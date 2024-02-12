import { BaseItem, registerAbility } from "../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../libraries/dota_ts_adapter";

@registerAbility()
export class item_satanic_custom extends BaseItem {
    GetIntrinsicModifierName(): string {
        return modifier_passive_item_satanic_custom.name;
    }

    override OnSpellStart(): void {
        const caster = this.GetCaster();
        caster.AddNewModifier(caster, this, modifier_item_satanic_custom.name, { duration: this.GetDuration() });
        caster.Purge(false, true, false, true, false);
        EmitSoundOn("Mountainitem.Satanic.Cast", caster);
    }
}

@registerModifier()
export class modifier_passive_item_satanic_custom extends BaseModifier {
    // Modifier properties
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    bonusStrength!: number;
    bonusDamage!: number;
    lifestealPercent!: number;
    unholyLifestealPercent!: number;
    bonusDamagePerLevel!: number;
    bonusStrengthPerLevel!: number;

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
        return [ModifierFunction.PREATTACK_BONUS_DAMAGE, ModifierFunction.STATS_STRENGTH_BONUS, ModifierFunction.MOUNTAIN_LIFESTEAL];
    }

    GetModifierBonusStats_Strength(): number {
        return this.bonusStrength + (this.ability.GetLevel() - 1) * this.bonusStrengthPerLevel;
    }

    GetModifierPreAttack_BonusDamage(): number {
        return this.bonusDamage + (this.ability.GetLevel() - 1) * this.bonusDamagePerLevel;
    }

    GetModifierLifesteal(kv: ModifierAttackEvent): number {
        if (kv.attacker != this.parent) {
            return 0;
        }

        if (this.parent.HasModifier(modifier_item_satanic_custom.name)) {
            return this.lifestealPercent + this.unholyLifestealPercent;
        }

        return this.lifestealPercent;
    }

    override OnCreated(): void {
        this.OnRefresh();
    }

    override OnRefresh(): void {
        this.bonusStrength = this.ability.GetSpecialValueFor("bonus_strength");
        this.bonusDamage = this.ability.GetSpecialValueFor("bonus_damage");
        this.lifestealPercent = this.ability.GetSpecialValueFor("lifesteal_percent");
        this.unholyLifestealPercent = this.ability.GetSpecialValueFor("unholy_lifesteal_percent");
        this.bonusStrengthPerLevel = this.ability.GetSpecialValueFor("bonus_strength_per_level");
        this.bonusDamagePerLevel = this.ability.GetSpecialValueFor("bonus_damage_per_level");
    }
}

@registerModifier()
export class modifier_item_satanic_custom extends BaseModifier {
    // Modifier properties
    private ability: CDOTABaseAbility = this.GetAbility()!;

    // Modifier specials

    override IsHidden() {
        return false;
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

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.TOOLTIP];
    }

    OnTooltip(): number {
        return this.ability.GetSpecialValueFor("unholy_lifesteal_percent");
    }
}
