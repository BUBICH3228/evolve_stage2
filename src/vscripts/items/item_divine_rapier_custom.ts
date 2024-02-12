import { BaseAbility, registerAbility } from "../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../libraries/dota_ts_adapter";

@registerAbility()
export class item_divine_rapier_custom extends BaseAbility {
    // Ability properties
    GetIntrinsicModifierName(): string {
        return modifier_item_divine_rapier_custom.name;
    }
}

@registerModifier()
export class modifier_item_divine_rapier_custom extends BaseModifier {
    // Modifier properties
    private ability: CDOTABaseAbility = this.GetAbility()!;
    bonusDamage!: number;
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
        return [ModifierFunction.PREATTACK_BONUS_DAMAGE];
    }

    GetModifierPreAttack_BonusDamage(): number {
        return this.bonusDamage + (this.ability.GetLevel() - 1) * this.bonusDamagePerLevel;
    }

    override OnCreated(): void {
        this.OnRefresh();
    }

    OnRefresh(): void {
        this.bonusDamage = this.ability.GetSpecialValueFor("bonus_damage");

        this.bonusDamagePerLevel = this.ability.GetSpecialValueFor("bonus_damage_per_level");
    }
}
