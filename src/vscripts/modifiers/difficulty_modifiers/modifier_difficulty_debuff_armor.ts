import { registerModifier, BaseModifier } from "../../libraries/dota_ts_adapter";

@registerModifier()
export class modifier_difficulty_debuff_armor extends BaseModifier {
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
        return "difficulty_modifiers/debuff_armor";
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.PHYSICAL_ARMOR_BONUS, ModifierFunction.ON_TAKEDAMAGE];
    }

    GetModifierPhysicalArmorBonus(): number {
        return -1 * this.GetStackCount();
    }

    OnTakeDamage(kv: ModifierInstanceEvent): void {
        if (kv.attacker === this.parent || kv.unit != this.parent) {
            return;
        }

        if (kv.damage_category != DamageCategory.ATTACK) {
            return;
        }

        if (kv.attacker.IsBoss()) {
            this.SetStackCount(this.GetStackCount() + 8);
        } else {
            this.IncrementStackCount();
        }

        Timers.CreateTimer(5 * (1 - this.parent.GetStatusResistance()), () => {
            if (kv.attacker.IsBoss()) {
                this.SetStackCount(this.GetStackCount() - 8);
            } else {
                this.DecrementStackCount();
            }
        });
    }
}
