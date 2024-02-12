import { BaseItem, registerAbility } from "../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../libraries/dota_ts_adapter";

@registerAbility()
export class item_butterfly_custom extends BaseItem {
    GetIntrinsicModifierName(): string {
        return modifier_passive_item_butterfly_custom.name;
    }
}

@registerModifier()
export class modifier_passive_item_butterfly_custom extends BaseModifier {
    // Modifier properties
    private ability: CDOTABaseAbility = this.GetAbility()!;
    bonusAgility!: number;
    bonusDamage!: number;
    evasion!: number;
    bonusAttackSpeed!: number;
    bonusAgilityPerLevel!: number;
    bonusDamagePerLevel!: number;

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
            ModifierFunction.PREATTACK_BONUS_DAMAGE,
            ModifierFunction.STATS_AGILITY_BONUS,
            ModifierFunction.ATTACKSPEED_BONUS_CONSTANT,
            ModifierFunction.EVASION_CONSTANT
        ];
    }

    GetModifierBonusStats_Agility(): number {
        return this.bonusAgility + (this.ability.GetLevel() - 1) * this.bonusAgilityPerLevel;
    }

    GetModifierPreAttack_BonusDamage(): number {
        return this.bonusDamage + (this.ability.GetLevel() - 1) * this.bonusDamagePerLevel;
    }

    GetModifierAttackSpeedBonus_Constant(): number {
        return this.bonusAttackSpeed;
    }

    GetModifierEvasion_Constant(): number {
        return this.evasion;
    }

    override OnCreated(): void {
        this.OnRefresh();
    }

    override OnRefresh(): void {
        this.bonusAgility = this.ability.GetSpecialValueFor("bonus_agility");
        this.bonusDamage = this.ability.GetSpecialValueFor("bonus_damage");
        this.evasion = this.ability.GetSpecialValueFor("bonus_evasion");
        this.bonusAttackSpeed = this.ability.GetSpecialValueFor("bonus_attack_speed");
        this.bonusAgilityPerLevel = this.ability.GetSpecialValueFor("bonus_agility_per_level");
        this.bonusDamagePerLevel = this.ability.GetSpecialValueFor("bonus_damage_per_level");
    }
}
