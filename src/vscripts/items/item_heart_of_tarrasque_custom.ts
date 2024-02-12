import { BaseItem, registerAbility } from "../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../libraries/dota_ts_adapter";

@registerAbility()
export class item_heart_of_tarrasque_custom extends BaseItem {
    GetIntrinsicModifierName(): string {
        return modifier_item_heart_of_tarrasque_custom.name;
    }
}

@registerModifier()
export class modifier_item_heart_of_tarrasque_custom extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    bonusStrength!: number;
    bonusHealth!: number;
    healthRegenPct!: number;
    bonusStrengthPerLevel!: number;
    bonusHealthPerLevel!: number;

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
        return [ModifierFunction.STATS_STRENGTH_BONUS, ModifierFunction.EXTRA_HEALTH_BONUS, ModifierFunction.HEALTH_REGEN_PERCENTAGE];
    }

    GetModifierBonusStats_Strength(): number {
        return this.bonusStrength + (this.ability.GetLevel() - 1) * this.bonusStrengthPerLevel;
    }

    GetModifierExtraHealthBonus(): number {
        return this.bonusHealth + (this.ability.GetLevel() - 1) * this.bonusHealthPerLevel;
    }

    GetModifierHealthRegenPercentage(): number {
        return this.healthRegenPct;
    }

    override OnCreated(): void {
        this.OnRefresh();
    }

    override OnRefresh(): void {
        this.bonusStrength = this.ability.GetSpecialValueFor("bonus_strength");
        this.bonusHealth = this.ability.GetSpecialValueFor("bonus_health");
        this.healthRegenPct = this.ability.GetSpecialValueFor("health_regen_pct");

        this.bonusStrengthPerLevel = this.ability.GetSpecialValueFor("bonus_strength_per_level");
        this.bonusHealthPerLevel = this.ability.GetSpecialValueFor("bonus_health_per_level");
    }
}
