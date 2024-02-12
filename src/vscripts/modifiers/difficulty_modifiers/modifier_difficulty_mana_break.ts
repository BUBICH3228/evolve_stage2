import { registerModifier, BaseModifier } from "../../libraries/dota_ts_adapter";

@registerModifier()
export class modifier_difficulty_mana_break extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
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
    override RemoveOnDeath(): boolean {
        return false;
    }

    GetTexture(): string {
        return "difficulty_modifiers/mana_break";
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.ON_TAKEDAMAGE];
    }

    OnTakeDamage(kv: ModifierInstanceEvent): void {
        if (kv.attacker === this.parent || kv.unit != this.parent) {
            return;
        }

        if (kv.damage_category != DamageCategory.ATTACK) {
            return;
        }

        const currentMana = this.parent.GetMana();

        if (kv.attacker.IsBoss()) {
            this.parent.Script_ReduceMana(currentMana * 0.1, this);
        } else {
            this.parent.Script_ReduceMana(currentMana * 0.02, this);
        }
    }
}
