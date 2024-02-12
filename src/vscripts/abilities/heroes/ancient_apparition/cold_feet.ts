import { BaseAbility, registerAbility } from "../../../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../../../libraries/dota_ts_adapter";

@registerAbility()
export class ancient_apparition_cold_feet_custom extends BaseAbility {
    Precache(context: CScriptPrecacheContext): void {
        PrecacheResource(
            PrecacheType.PARTICLE,
            "particles/units/heroes/hero_ancient_apparition/ancient_apparition_cold_feet_marker.vpcf",
            context
        );
        PrecacheResource(
            PrecacheType.PARTICLE,
            "particles/units/heroes/hero_ancient_apparition/ancient_apparition_cold_feet.vpcf",
            context
        );
        PrecacheResource(
            PrecacheType.PARTICLE,
            "particles/units/heroes/hero_ancient_apparition/ancient_apparition_cold_feet_frozen.vpcf",
            context
        );
    }

    GetAOERadius(): number {
        return this.GetSpecialValueFor("radius");
    }

    GetAbilityTargetTeam(): UnitTargetTeam {
        if (this.caster.HasTalent("talent_ancient_apparition_cold_feet_used_on_team")) {
            return UnitTargetTeam.BOTH;
        }
        return super.GetAbilityTargetTeam();
    }

    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();

    override OnSpellStart(): void {
        const point = this.GetCursorPosition();

        const enemies = FindUnitsInRadius(
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

        enemies.forEach((enemy) => {
            enemy.AddNewModifier(this.caster, this, modifier_ancient_apparition_cold_feet_custom.name, { duration: -1 });
        });
    }
}

@registerModifier()
export class modifier_ancient_apparition_cold_feet_custom extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC_Hero = this.GetCaster()! as CDOTA_BaseNPC_Hero;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    duration!: number;
    interval!: number;
    damage!: number;
    damagePerInt!: number;
    damageTable!: ApplyDamageOptions;
    freezDuration!: number;
    breakDistance!: number;
    originalPosition!: Vector;
    damageReductionPct!: number;
    multiplier!: number;

    // Modifier specials

    override IsHidden() {
        return false;
    }
    override IsDebuff() {
        if (this.caster.GetTeamNumber() == this.parent.GetTeamNumber()) {
            return false;
        }
        return true;
    }
    override IsPurgable() {
        return false;
    }
    override IsPurgeException() {
        return false;
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.TOTALDAMAGEOUTGOING_PERCENTAGE];
    }

    GetModifierTotalDamageOutgoing_Percentage(): number {
        if (this.parent.GetTeamNumber() == this.caster.GetTeamNumber()) {
            return 0;
        }
        return this.damageReductionPct;
    }

    override OnCreated(): void {
        this.OnRefresh();
    }

    OnRefresh(): void {
        this.duration = this.ability.GetSpecialValueFor("duration");
        this.freezDuration = this.ability.GetSpecialValueFor("freez_duration");
        this.breakDistance = this.ability.GetSpecialValueFor("break_distance");
        this.interval = this.ability.GetSpecialValueFor("interval");
        this.damage = this.ability.GetSpecialValueFor("damage");
        this.damagePerInt = this.ability.GetSpecialValueFor("damage_per_int") / 100;
        this.damageReductionPct = -1 * this.ability.GetSpecialValueFor("talent_damage_reduction_pct");
        this.multiplier = this.ability.GetSpecialValueFor("talent_multiplier") / 100;

        this.originalPosition = this.parent.GetAbsOrigin();

        const coldFeetMarkerParticle = ParticleManager.CreateParticle(
            "particles/units/heroes/hero_ancient_apparition/ancient_apparition_cold_feet_marker.vpcf",
            ParticleAttachment.ABSORIGIN,
            this.parent
        );
        this.AddParticle(coldFeetMarkerParticle, false, false, -1, false, false);

        const coldFeetParticle = ParticleManager.CreateParticle(
            "particles/units/heroes/hero_ancient_apparition/ancient_apparition_cold_feet.vpcf",
            ParticleAttachment.OVERHEAD_FOLLOW,
            this.parent
        );
        this.AddParticle(coldFeetParticle, false, false, -1, false, false);

        if (!IsServer()) {
            return;
        }

        this.damageTable = {
            victim: this.parent,
            attacker: this.caster,
            ability: this.ability,
            damage: 0,
            damage_type: this.ability.GetAbilityDamageType(),
            damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION
        };

        this.StartIntervalThink(this.interval);
    }

    OnIntervalThink(): void {
        if (CalculateDistance(this.originalPosition, this.parent.GetAbsOrigin()) < this.breakDistance) {
            if (this.GetElapsedTime() < this.duration) {
                EmitSoundOnClient("Hero_Ancient_Apparition.ColdFeetTick", this.parent.GetPlayerOwner());
                let damage = this.damage * (this.caster.GetSpellAmplification(false) + 1);
                damage += this.damagePerInt * this.caster.GetIntellect() * this.interval;
                if (this.parent.GetTeamNumber() == this.caster.GetTeamNumber()) {
                    damage *= this.multiplier;
                    this.parent.Heal(damage, this.ability);
                    SendOverheadEventMessage(undefined, OverheadAlert.HEAL, this.parent, damage, undefined);
                } else {
                    SendOverheadEventMessage(undefined, OverheadAlert.BONUS_SPELL_DAMAGE, this.parent, damage, undefined);
                    this.damageTable.damage = damage;
                    ApplyDamage(this.damageTable);
                }
            } else {
                let duration = this.freezDuration;
                if (this.parent.GetTeamNumber() == this.caster.GetTeamNumber()) {
                    duration *= this.multiplier;
                }
                this.parent.AddNewModifier(this.caster, this.ability, modifier_ancient_apparition_cold_feet_custom_freez.name, {
                    duration: duration
                });
                this.Destroy();
            }
        } else {
            this.Destroy();
        }
    }
}

@registerModifier()
export class modifier_ancient_apparition_cold_feet_custom_freez extends BaseModifier {
    // Modifier properties
    private parent: CDOTA_BaseNPC = this.GetParent();

    // Modifier specials

    override IsHidden() {
        return false;
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

    GetEffectName(): string {
        return "particles/units/heroes/hero_ancient_apparition/ancient_apparition_cold_feet_frozen.vpcf";
    }

    GetEffectAttachType(): ParticleAttachment {
        return ParticleAttachment.OVERHEAD_FOLLOW;
    }

    CheckState(): Partial<Record<ModifierState, boolean>> {
        return {
            [ModifierState.STUNNED]: true,
            [ModifierState.FROZEN]: true
        };
    }

    override OnCreated(): void {
        if (!IsServer()) {
            return;
        }

        this.parent.EmitSound("Hero_Ancient_Apparition.ColdFeetFreeze");
    }
}
