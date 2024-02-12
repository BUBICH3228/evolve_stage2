import { BaseAbility, registerAbility } from "../../../libraries/dota_ts_adapter";
import { BaseModifier, registerModifier } from "../../../libraries/dota_ts_adapter";
import { modifier_bashed } from "../../../modifiers/modifier_bashed";

interface LionImpaleProjectileExtraData {
    isAutoCast: number | boolean;
    isMainProjectile: number | boolean;
}

@registerAbility()
export class lion_impale_custom extends BaseAbility {
    Precache(context: CScriptPrecacheContext) {
        PrecacheResource(PrecacheType.PARTICLE, "particles/units/heroes/hero_nyx_assassin/nyx_assassin_impale.vpcf", context);
        PrecacheResource(PrecacheType.PARTICLE, "particles/units/heroes/hero_lion/lion_spell_impale_hit_spikes.vpcf", context);
    }

    // Ability properties
    private caster: CDOTA_BaseNPC_Hero = this.GetCaster() as CDOTA_BaseNPC_Hero;

    GetBehavior(): AbilityBehavior | Uint64 {
        if (this.caster.HasTalent("talent_lion_impale_custom_autocast")) {
            return AbilityBehavior.AUTOCAST + AbilityBehavior.POINT + AbilityBehavior.UNIT_TARGET + AbilityBehavior.IGNORE_BACKSWING;
        }
        return super.GetBehavior();
    }

    GetCooldown(level: number): number {
        if (!IsServer()) {
            return super.GetCooldown(level);
        }
        if (this.GetAutoCastState()) {
            return super.GetCooldown(level) - this.GetSpecialValueFor("talent_autocast_cooldown");
        }
        return super.GetCooldown(level);
    }

    override OnSpellStart(): void {
        if (!IsServer()) {
            return;
        }

        const target = this.GetCursorTarget();
        let point = this.GetCursorPosition();

        if (target) {
            point = target.GetAbsOrigin();
        }

        this.ImpaleCast(point, this.GetAutoCastState(), true, this.caster.GetAbsOrigin());
    }

    ImpaleCast(point: Vector, isAutoCast: boolean, isMainProjectile: boolean, start_point: Vector): void {
        if (!IsServer()) {
            return;
        }
        const speed = this.GetSpecialValueFor("speed");
        const width = this.GetSpecialValueFor("width");
        const projectileDirection = (point - this.caster.GetAbsOrigin()) as Vector;

        ProjectileManager.CreateLinearProjectile({
            Source: this.caster,
            Ability: this,
            vSpawnOrigin: start_point,
            bDrawsOnMinimap: true,
            bHasFrontalCone: true,
            bIgnoreSource: true,
            bProvidesVision: true,
            bVisibleToEnemies: true,
            iVisionRadius: 350,
            iVisionTeamNumber: DotaTeam.GOODGUYS,
            iUnitTargetTeam: this.GetAbilityTargetTeam(),
            iUnitTargetType: this.GetAbilityTargetType(),
            iUnitTargetFlags: this.GetAbilityTargetFlags(),
            EffectName: "particles/units/heroes/hero_lion/lion_spell_impale.vpcf",
            fDistance: this.GetEffectiveCastRange(point, this.caster),
            fStartRadius: width,
            fEndRadius: width,
            fProjectileSpeed: speed,
            vVelocity: (projectileDirection.Normalized() * speed) as Vector,
            fExpireTime: GameRules.GetGameTime() + 10,
            ExtraData: <LionImpaleProjectileExtraData>{
                isAutoCast: isAutoCast,
                isMainProjectile: isMainProjectile
            }
        });
        if (isMainProjectile) {
            EmitSoundOn("Hero_Lion.Impale", this.caster);
        }
    }

    OnProjectileHit_ExtraData(target: CDOTA_BaseNPC, location: Vector, extraData: LionImpaleProjectileExtraData): void {
        if (!IsServer()) {
            return;
        }

        const isAutoCast = extraData.isAutoCast == 1;
        const isMainProjectile = extraData.isMainProjectile == 1;

        if (target != null) {
            if (target.TriggerSpellAbsorb(this)) {
                return;
            }

            let damage =
                this.GetSpecialValueFor("damage") * (this.caster.GetSpellAmplification(false) + 1) +
                (this.caster.GetIntellect() / 100) * this.GetSpecialValueFor("int_to_dmg_pct");

            if (isAutoCast) {
                damage = damage + (damage * this.GetSpecialValueFor("talent_autocast_dmg_increase_pct")) / 100;
            }

            if (isMainProjectile) {
                damage += (damage * this.GetSpecialValueFor("talent_split_damage_from_orig_pct")) / 100;
            }

            if (!isMainProjectile) {
                damage -= (damage * this.GetSpecialValueFor("talent_split_damage_from_orig_pct")) / 100;
            }

            if (this.caster.HasTalent("talent_lion_impale_custom_split")) {
                damage += (damage * this.GetSpecialValueFor("talent_split_damage_from_orig_pct")) / 100;
            }

            const damage_table = {
                victim: target,
                attacker: this.caster,
                damage: damage,
                ability: this,
                damage_type: this.GetAbilityDamageType(),
                damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION
            };

            target.AddNewModifier(this.caster, this, "modifier_knockback", {
                duration: this.GetSpecialValueFor("knockback_duration"),
                knockback_height: this.GetSpecialValueFor("knockback_height")
            });

            Timers.CreateTimer(this.GetSpecialValueFor("knockback_duration"), () => {
                ApplyDamage(damage_table);
                EmitSoundOn("Hero_Lion.ImpaleTargetLand", target);
            });

            if (!isAutoCast) {
                target.AddNewModifier(this.caster, this, modifier_bashed.name, { duration: this.GetSpecialValueFor("stun_duration") });
            }

            if (this.caster.HasTalent("talent_lion_impale_custom_debuff")) {
                target.AddNewModifier(this.caster, this, modifier_lion_impale_custom_debuff.name, {
                    duration: this.GetSpecialValueFor("talent_debuff_duration")
                });
            }

            const pfx = ParticleManager.CreateParticle(
                "particles/units/heroes/hero_lion/lion_spell_impale_hit_spikes.vpcf",
                ParticleAttachment.ABSORIGIN,
                target
            );
            ParticleManager.DestroyAndReleaseParticle(pfx);
        } else {
            if (!this.caster.HasTalent("talent_lion_impale_custom_split")) {
                return;
            }
            if (!isMainProjectile) {
                return;
            }
            const casterPosition = this.caster.GetAbsOrigin();

            for (let key = 1; key <= 6; key++) {
                const newPoint = RotatePosition(
                    casterPosition,
                    QAngle(0, (key / this.GetSpecialValueFor("talent_split_divisions")) * 360, 0),
                    location
                );
                this.ImpaleCast(newPoint, isAutoCast, false, location);
            }
        }
    }
}

@registerModifier()
export class modifier_lion_impale_custom_debuff extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC_Hero = this.GetCaster()! as CDOTA_BaseNPC_Hero;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    talent_dmg_per_sec!: number;
    talent_int_to_dmg_per_sec_pct!: number;
    talent_debuff_duration!: number;
    talent_damage_interval!: number;
    damage_table!: ApplyDamageOptions;

    // Modifier specials

    override IsHidden() {
        return false;
    }
    override IsDebuff() {
        return true;
    }
    override IsPurgable() {
        return true;
    }

    override OnCreated(): void {
        // Modifier specials
        this.OnRefresh();
    }

    OnRefresh(): void {
        this.talent_dmg_per_sec = this.ability.GetSpecialValueFor("talent_dmg_per_sec");
        this.talent_int_to_dmg_per_sec_pct = this.ability.GetSpecialValueFor("talent_int_to_dmg_per_sec_pct");
        this.talent_debuff_duration = this.ability.GetSpecialValueFor("talent_debuff_duration");
        this.talent_damage_interval = this.ability.GetSpecialValueFor("talent_damage_interval");

        if (!IsServer()) {
            return;
        }
        this.IncrementIndependentStackCount();
        this.StartIntervalThink(this.talent_damage_interval);
        this.damage_table = {
            victim: this.parent,
            attacker: this.caster,
            damage: 0,
            ability: this.ability,
            damage_type: this.ability.GetAbilityDamageType(),
            damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION
        };
    }

    OnIntervalThink() {
        let damage = this.talent_dmg_per_sec;
        damage = damage * (this.caster.GetSpellAmplification(false) + 1);
        damage = damage + this.caster.GetIntellect() / 100;
        this.damage_table.damage = damage * this.talent_damage_interval;
        ApplyDamage(this.damage_table);
    }
}
