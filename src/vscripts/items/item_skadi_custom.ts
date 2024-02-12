import { BaseAbility, registerAbility } from "../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../libraries/dota_ts_adapter";

@registerAbility()
export class item_skadi_custom extends BaseAbility {
    // Ability properties
    GetIntrinsicModifierName(): string {
        return modifier_item_skadi_custom.name;
    }
}

@registerModifier()
export class modifier_item_skadi_custom extends BaseModifier {
    // Modifier properties
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    bonusAllStats!: number;
    bonusAllStatsPerLevel!: number;
    bonusHealth!: number;
    bonusMana!: number;
    targetTeam!: UnitTargetTeam;
    targetType!: UnitTargetType;
    targetFlags!: UnitTargetFlags;
    coldDuration!: number;

    // Modifier specials

    override IsHidden() {
        return true;
    }
    override IsDebuff() {
        return false;
    }
    override IsPurgable() {
        return false;
    }
    override IsPurgeException() {
        return false;
    }
    RemoveOnDeath(): boolean {
        return false;
    }

    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.STATS_STRENGTH_BONUS,
            ModifierFunction.STATS_AGILITY_BONUS,
            ModifierFunction.STATS_INTELLECT_BONUS,
            ModifierFunction.HEALTH_BONUS,
            ModifierFunction.MANA_BONUS,
            ModifierFunction.ON_ATTACK_LANDED
        ];
    }

    GetModifierBonusStats_Strength(): number {
        return this.bonusAllStats + (this.ability.GetLevel() - 1) * this.bonusAllStatsPerLevel;
    }

    GetModifierBonusStats_Agility(): number {
        return this.bonusAllStats + (this.ability.GetLevel() - 1) * this.bonusAllStatsPerLevel;
    }

    GetModifierBonusStats_Intellect(): number {
        return this.bonusAllStats + (this.ability.GetLevel() - 1) * this.bonusAllStatsPerLevel;
    }

    GetModifierHealthBonus(): number {
        return this.bonusHealth;
    }

    GetModifierManaBonus(): number {
        return this.bonusMana;
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
        this.bonusAllStats = this.ability.GetSpecialValueFor("bonus_all_stats");
        this.bonusHealth = this.ability.GetSpecialValueFor("bonus_health");
        this.bonusMana = this.ability.GetSpecialValueFor("bonus_mana");
        this.coldDuration = this.ability.GetSpecialValueFor("cold_duration");

        this.bonusAllStatsPerLevel = this.ability.GetSpecialValueFor("bonus_all_stats_per_level");
    }

    OnAttackLanded(kv: ModifierAttackEvent): void {
        if (kv.attacker != this.parent) {
            return;
        }

        if (
            UnitFilter(kv.target, this.targetTeam, this.targetType, this.targetFlags, this.parent.GetTeamNumber()) !=
            UnitFilterResult.SUCCESS
        ) {
            return;
        }

        kv.target.AddNewModifier(this.parent, this.ability, modifier_item_skadi_custom_cold_debuff.name, {
            duration: this.coldDuration * (1 - kv.target.GetStatusResistance())
        });
    }
}

@registerModifier()
export class modifier_item_skadi_custom_cold_debuff extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    coldSlow!: number;
    coldAttackSlow!: number;
    healReduction!: number;

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
    override IsPurgeException() {
        return true;
    }

    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.ATTACKSPEED_BONUS_CONSTANT,
            ModifierFunction.MOVESPEED_BONUS_PERCENTAGE,
            ModifierFunction.LIFESTEAL_AMPLIFY_PERCENTAGE
        ];
    }

    GetModifierMoveSpeedBonus_Percentage(): number {
        return this.coldSlow;
    }

    GetModifierAttackSpeedBonus_Constant(): number {
        return this.coldAttackSlow;
    }

    GetModifierLifestealRegenAmplify_Percentage(): number {
        return this.healReduction;
    }

    override OnCreated(): void {
        this.OnRefresh();
    }

    OnRefresh(): void {
        this.coldSlow = -1 * this.ability.GetSpecialValueFor("cold_slow");
        this.coldAttackSlow = -1 * this.ability.GetSpecialValueFor("cold_attack_slow");
        this.healReduction = -1 * this.ability.GetSpecialValueFor("heal_reduction");
    }
}
