import { registerModifier, BaseModifier } from "../../libraries/dota_ts_adapter";

@registerModifier()
export class modifier_difficulty_silence extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    IsSelected = false;

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
        return "difficulty_modifiers/silence";
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.ON_TAKEDAMAGE];
    }

    CheckState(): Partial<Record<ModifierState, boolean>> {
        return { [ModifierState.SILENCED]: this.IsSelected };
    }

    OnTakeDamage(kv: ModifierInstanceEvent): void {
        if (kv.attacker === this.parent || kv.unit != this.parent) {
            return;
        }

        if (kv.damage_category != DamageCategory.ATTACK) {
            return;
        }

        if (RollPseudoRandomPercentage(1, this) == false) {
            return;
        }

        if (this.IsSelected == true) {
            return;
        }

        this.IsSelected = true;

        Timers.CreateTimer(2 * (1 - this.parent.GetStatusResistance()), () => {
            this.IsSelected = false;
        });
    }
}
