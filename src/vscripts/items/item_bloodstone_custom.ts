import { BaseItem, registerAbility } from "../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../libraries/dota_ts_adapter";

@registerAbility()
export class item_bloodstone_custom extends BaseItem {
    GetIntrinsicModifierName(): string {
        return modifier_passive_item_bloodstone_custom.name;
    }

    override OnSpellStart(): void {
        const caster = this.GetCaster();
        caster.AddNewModifier(caster, this, modifier_item_bloodstone_custom.name, { duration: this.GetDuration() });
        EmitSoundOn("Mountainitem.Bloodstone.Cast", caster);
    }
}

@registerModifier()
export class modifier_passive_item_bloodstone_custom extends BaseModifier {
    // Modifier properties
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    bonusHealth!: number;
    bonusMana!: number;
    spellLifesteal!: number;
    lifestealMultiplier!: number;
    bonusHealthPerLevel!: number;
    bonusManaPerLevel!: number;
    bonusAoe!: number;

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
            ModifierFunction.MOUNTAIN_SPELL_LIFESTEAL,
            ModifierFunction.AOE_BONUS_CONSTANT
        ];
    }

    GetModifierHealthBonus(): number {
        return this.bonusHealth + (this.ability.GetLevel() - 1) * this.bonusHealthPerLevel;
    }

    GetModifierManaBonus(): number {
        return this.bonusMana + (this.ability.GetLevel() - 1) * this.bonusManaPerLevel;
    }

    GetModifierSpellLifesteal(): number {
        if (this.parent.HasModifier(modifier_item_bloodstone_custom.name)) {
            return this.spellLifesteal * this.lifestealMultiplier;
        }

        return this.spellLifesteal;
    }

    GetModifierAoEBonusConstant(): number {
        return this.bonusAoe;
    }

    override OnCreated(): void {
        this.OnRefresh();
    }

    override OnRefresh(): void {
        this.bonusHealth = this.ability.GetSpecialValueFor("bonus_health");
        this.bonusMana = this.ability.GetSpecialValueFor("bonus_mana");
        this.spellLifesteal = this.ability.GetSpecialValueFor("spell_lifesteal");
        this.bonusAoe = this.ability.GetSpecialValueFor("bonus_aoe");
        this.lifestealMultiplier = this.ability.GetSpecialValueFor("lifesteal_multiplier");
        this.bonusHealthPerLevel = this.ability.GetSpecialValueFor("bonus_health_per_level");
        this.bonusManaPerLevel = this.ability.GetSpecialValueFor("bonus_mana_per_level");
    }
}

@registerModifier()
export class modifier_item_bloodstone_custom extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();

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
