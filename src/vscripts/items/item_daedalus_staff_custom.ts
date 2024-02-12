import { BaseAbility, registerAbility } from "../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../libraries/dota_ts_adapter";

@registerAbility()
export class item_daedalus_staff_custom extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();

    GetIntrinsicModifierName(): string {
        return modifier_item_daedalus_staff_custom.name;
    }
}

@registerModifier()
export class modifier_item_daedalus_staff_custom extends BaseModifier {
    // Modifier properties
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent()!;
    bonusDamage!: number;
    spellAmp!: number;
    damageMultiple!: number;
    spellAmpPerLevel!: number;
    damageMultiplePerLevel!: number;

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
        return [ModifierFunction.SPELL_AMPLIFY_PERCENTAGE, ModifierFunction.MOUNTAIN_PRE_SPELL_CRITICAL_STRIKE];
    }

    GetModifierSpellAmplify_Percentage(): number {
        return this.spellAmp + (this.ability.GetLevel() - 1) * this.spellAmpPerLevel;
    }

    GetSpellCritDamage(): number {
        return this.damageMultiple + (this.ability.GetLevel() - 1) * this.damageMultiplePerLevel;
    }

    GetModifierPreSpell_CriticalStrike(kv: ModifierPreSpellCriticalStrikeEvent): number {
        if (!this.ability.IsCooldownReady()) {
            return 0;
        }

        if (kv.attacker != this.parent) {
            return 0;
        }

        if (!kv.inflictor || kv.inflictor.IsItem() == true) {
            return 0;
        }

        this.ability.UseResources(false, false, false, true);

        return this.damageMultiple + (this.ability.GetLevel() - 1) * this.damageMultiplePerLevel;
    }

    override OnCreated(): void {
        this.OnRefresh();
    }

    OnRefresh(): void {
        this.spellAmp = this.ability.GetSpecialValueFor("spell_amp");
        this.damageMultiple = this.ability.GetSpecialValueFor("damage_multiple");
        this.spellAmpPerLevel = this.ability.GetSpecialValueFor("spell_amp_per_level");
        this.damageMultiplePerLevel = this.ability.GetSpecialValueFor("damage_multiple_per_level");
    }
}
