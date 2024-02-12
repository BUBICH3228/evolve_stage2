import { BaseAbility, registerAbility } from "../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../libraries/dota_ts_adapter";

@registerAbility()
export class item_octarine_core_custom extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();

    GetIntrinsicModifierName(): string {
        return modifier_item_octarine_core_custom.name;
    }
}

@registerModifier()
export class modifier_item_octarine_core_custom extends BaseModifier {
    // Modifier properties
    private ability: CDOTABaseAbility = this.GetAbility()!;
    bonusCooldown!: number;
    bonusHealth!: number;
    bonusMana!: number;
    bonusManaRegen!: number;
    bonusManaPerLevel!: number;
    bonusManaRegenPerLevel!: number;
    castRangeBonus!: number;

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
            ModifierFunction.HEALTH_BONUS,
            ModifierFunction.MANA_BONUS,
            ModifierFunction.MANA_REGEN_CONSTANT,
            ModifierFunction.COOLDOWN_PERCENTAGE,
            ModifierFunction.CAST_RANGE_BONUS
        ];
    }

    GetModifierHealthBonus(): number {
        return this.bonusHealth;
    }

    GetModifierManaBonus(): number {
        return this.bonusMana + (this.ability.GetLevel() - 1) * this.bonusManaPerLevel;
    }

    GetModifierConstantManaRegen(): number {
        return this.bonusManaRegen + (this.ability.GetLevel() - 1) * this.bonusManaRegenPerLevel;
    }

    GetModifierPercentageCooldown(): number {
        return this.bonusCooldown;
    }

    GetModifierCastRangeBonus(): number {
        return this.castRangeBonus;
    }

    override OnCreated(): void {
        this.OnRefresh();
    }

    OnRefresh(): void {
        this.bonusCooldown = this.ability.GetSpecialValueFor("bonus_cooldown");
        this.bonusHealth = this.ability.GetSpecialValueFor("bonus_health");
        this.bonusMana = this.ability.GetSpecialValueFor("bonus_mana");
        this.bonusManaRegen = this.ability.GetSpecialValueFor("bonus_mana_regen");
        this.castRangeBonus = this.ability.GetSpecialValueFor("cast_range_bonus");

        this.bonusManaRegenPerLevel = this.ability.GetSpecialValueFor("bonus_mana_regen_per_level");
        this.bonusManaPerLevel = this.ability.GetSpecialValueFor("bonus_mana_per_level");
    }
}
