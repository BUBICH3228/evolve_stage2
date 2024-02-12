import { BaseAbility, registerAbility } from "../../../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../../../libraries/dota_ts_adapter";

interface SilencerCurseOfTheSilentData {
    multiplier: number;
}

@registerAbility()
export class silencer_curse_of_the_silent_custom extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();

    GetIntrinsicModifierName(): string {
        return modifier_silencer_curse_of_the_silent_custom_aoe.name;
    }

    GetAOERadius(): number {
        return this.GetSpecialValueFor("radius");
    }

    override OnSpellStart(targets?: CDOTA_BaseNPC[], multiplier?: number): void {
        const point = this.GetCursorPosition();
        let enemies: CDOTA_BaseNPC[] = [];
        if (targets != undefined) {
            enemies = targets;
        } else {
            enemies = FindUnitsInRadius(
                this.caster.GetTeamNumber(),
                point,
                undefined,
                this.GetSpecialValueFor("radius"),
                this.GetAbilityTargetTeam(),
                this.GetAbilityTargetType(),
                this.GetAbilityTargetFlags(),
                FindOrder.ANY,
                false
            );
        }

        enemies.forEach((target) => {
            const modifier = target.AddNewModifier(this.caster, this, modifier_silencer_curse_of_the_silent_custom.name, {
                duration: this.GetSpecialValueFor("duration"),
                multiplier: multiplier
            }) as modifier_silencer_curse_of_the_silent_custom;
            if (modifier != undefined) {
                if (modifier.ultiStacks == undefined) {
                    modifier.ultiStacks = 0;
                }
                if (multiplier != undefined) {
                    modifier.ultiStacks++;
                    modifier.IncrementIndependentStackCount(() => {
                        modifier.ultiStacks--;
                    });
                } else {
                    modifier.IncrementIndependentStackCount();
                }
            }
            const damage = this.GetSpecialValueFor("damage") * (this.caster.GetSpellAmplification(false) + 1);
            ApplyDamage({
                victim: target,
                attacker: this.caster,
                damage: damage,
                ability: this,
                damage_type: this.GetAbilityDamageType(),
                damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION
            });
        });

        const pfx = ParticleManager.CreateParticle(
            "particles/units/heroes/hero_silencer/silencer_curse_cast.vpcf",
            ParticleAttachment.ABSORIGIN_FOLLOW,
            this.caster
        );
        ParticleManager.SetParticleControlEnt(
            pfx,
            0,
            this.caster,
            ParticleAttachment.POINT_FOLLOW,
            ParticleAttachmentLocation.ATTACK1,
            Vector(0, 0, 0),
            true
        );
        ParticleManager.DestroyAndReleaseParticle(pfx);
        EmitSoundOn("Hero_Silencer.Curse.Cast", this.caster);

        const pfx1 = ParticleManager.CreateParticle(
            "particles/units/heroes/hero_silencer/silencer_curse_aoe.vpcf",
            ParticleAttachment.WORLDORIGIN,
            undefined
        );
        ParticleManager.SetParticleControl(pfx1, 0, point);
        ParticleManager.SetParticleControl(pfx1, 1, Vector(this.GetSpecialValueFor("radius"), 0, 0));
        ParticleManager.DestroyAndReleaseParticle(pfx1);
        EmitSoundOnLocationWithCaster(point, "Hero_Silencer.Curse", this.caster);
    }
}

@registerModifier()
export class modifier_silencer_curse_of_the_silent_custom_aoe extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    targetTeam!: UnitTargetTeam;
    targetType!: UnitTargetType;
    targetFlags!: UnitTargetFlags;
    radius!: number;
    interval!: number;
    duration!: number;

    // Modifier specials

    override IsHidden() {
        return true;
    }
    override IsDebuff() {
        return true;
    }
    override IsPurgable() {
        return false;
    }
    override IsPurgeException() {
        return false;
    }

    override OnCreated(): void {
        this.OnRefresh();
        if (!IsServer()) {
            return;
        }
        this.targetTeam = this.ability.GetAbilityTargetTeam();
        this.targetType = this.ability.GetAbilityTargetType();
        this.targetFlags = this.ability.GetAbilityTargetFlags();
    }

    OnRefresh(): void {
        this.interval = this.ability.GetSpecialValueFor("talent_interval");
        this.radius = this.ability.GetSpecialValueFor("talent_radius");
        this.duration = this.ability.GetSpecialValueFor("talent_duration");
        if (!IsServer()) {
            return;
        }
        if (!this.caster.HasTalent("talent_curse_of_the_silent_aoe")) {
            return;
        }
        this.StartIntervalThink(this.interval);
    }

    OnIntervalThink(): void {
        const enemies = FindUnitsInRadius(
            this.caster.GetTeamNumber(),
            this.caster.GetAbsOrigin(),
            undefined,
            this.radius,
            this.targetTeam,
            this.targetType,
            this.targetFlags,
            FindOrder.ANY,
            false
        );

        enemies.forEach((target) => {
            const modifier = target.AddNewModifier(this.caster, this.ability, modifier_silencer_curse_of_the_silent_custom.name, {
                duration: this.duration
            }) as modifier_silencer_curse_of_the_silent_custom;
            if (modifier != undefined) {
                if (modifier.ultiStacks == undefined) {
                    modifier.ultiStacks = 0;
                }
                modifier.IncrementIndependentStackCount();
            }
        });
    }
}

@registerModifier()
export class modifier_silencer_curse_of_the_silent_custom extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    penalty!: number;
    damage!: number;
    interval!: number;
    damageTable!: ApplyDamageOptions;
    moveSpeedBonus!: number;
    penaltyMultiplier!: number;
    multiplier!: number;
    targetTeam!: UnitTargetTeam;
    targetType!: UnitTargetType;
    targetFlags!: UnitTargetFlags;
    talentDamagePct!: number;
    duration!: number;
    talentExplosionRadius!: number;
    ultiStacks!: number;

    // Modifier specials

    override IsHidden() {
        return false;
    }
    override IsDebuff() {
        return true;
    }

    GetEffectName(): string {
        return "particles/units/heroes/hero_silencer/silencer_curse.vpcf";
    }

    GetEffectAttachType(): ParticleAttachment {
        return ParticleAttachment.OVERHEAD_FOLLOW;
    }

    override DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.MOVESPEED_BONUS_PERCENTAGE, ModifierFunction.ON_DEATH];
    }

    GetModifierMoveSpeedBonus_Percentage(): number {
        if (this.parent.IsSilenced()) {
            return this.moveSpeedBonus * this.penaltyMultiplier * this.GetStackCount();
        }
        return this.moveSpeedBonus * this.GetStackCount();
    }

    override OnCreated(kv: SilencerCurseOfTheSilentData): void {
        this.OnRefresh(kv);
        if (!IsServer()) {
            return;
        }
        this.targetTeam = this.ability.GetAbilityTargetTeam();
        this.targetType = this.ability.GetAbilityTargetType();
        this.targetFlags = this.ability.GetAbilityTargetFlags();

        this.damageTable = {
            victim: this.parent,
            attacker: this.caster,
            damage: 0,
            ability: this.ability,
            damage_type: this.ability.GetAbilityDamageType(),
            damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION
        };

        this.StartIntervalThink(this.interval);
    }

    OnRefresh(kv: SilencerCurseOfTheSilentData): void {
        this.damage = this.ability.GetSpecialValueFor("application_damage");
        this.interval = this.ability.GetSpecialValueFor("interval");
        this.moveSpeedBonus = -1 * this.ability.GetSpecialValueFor("movespeed");
        this.penaltyMultiplier = this.ability.GetSpecialValueFor("penalty_multiplier");
        this.talentDamagePct = this.ability.GetSpecialValueFor("talent_damage_pct") / 100;
        this.duration = this.ability.GetSpecialValueFor("duration");
        this.talentExplosionRadius = this.ability.GetSpecialValueFor("talent_explosion_radius");
        if (this.multiplier == undefined || this.multiplier == 0) {
            if (kv.multiplier != undefined) {
                this.multiplier = kv.multiplier;
            } else {
                this.multiplier = 0;
            }
        }
    }

    OnIntervalThink(): void {
        let damage = this.damage * (this.caster.GetSpellAmplification(false) + 1);
        damage = damage * (this.GetStackCount() - this.ultiStacks) + damage * this.ultiStacks * this.multiplier;
        if (this.parent.IsSilenced()) {
            damage *= this.penaltyMultiplier;
        }
        this.damageTable.damage = damage;
        ApplyDamage(this.damageTable);

        EmitSoundOn("Hero_Silencer.Curse_Tick", this.parent);
    }

    OnDeath(kv: ModifierInstanceEvent): void {
        if (this.parent != kv.unit) {
            return;
        }
        if (!this.caster.HasTalent("talent_curse_of_the_silent_cast_on_death")) {
            return;
        }

        const enemies = FindUnitsInRadius(
            this.caster.GetTeamNumber(),
            this.parent.GetAbsOrigin(),
            undefined,
            this.talentExplosionRadius,
            this.targetTeam,
            this.targetType,
            this.targetFlags,
            FindOrder.ANY,
            false
        );

        enemies.forEach((target) => {
            const modifier = target.AddNewModifier(this.caster, this.ability, modifier_silencer_curse_of_the_silent_custom.name, {
                duration: this.duration
            }) as modifier_silencer_curse_of_the_silent_custom;
            if (modifier != undefined) {
                if (modifier.ultiStacks == undefined) {
                    modifier.ultiStacks = 0;
                }
                modifier.IncrementIndependentStackCount();
            }
            let damage = this.damage * (this.caster.GetSpellAmplification(false) + 1);
            damage = damage * (this.GetStackCount() - this.ultiStacks) + damage * this.ultiStacks * this.multiplier;
            damage *= this.talentDamagePct;
            this.damageTable.damage = damage;
            ApplyDamage(this.damageTable);
        });
    }
}
