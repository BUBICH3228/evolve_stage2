import { BaseAbility, registerAbility } from "../../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../../libraries/dota_ts_adapter";

@registerAbility()
export class creep_health_bar_pips extends BaseAbility {
    Spawn(): void {
        if (IsClient()) {
            return;
        }
        this.SetLevel(1);
    }
    GetIntrinsicModifierName(): string {
        return modifier_creep_health_bar_pips.name;
    }
}

@registerModifier()
export class modifier_creep_health_bar_pips extends BaseModifier {
    // Modifier properties
    private parent: CDOTA_BaseNPC = this.GetParent();

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
    override RemoveOnDeath() {
        return false;
    }

    DeclareFunctions(): modifierfunction[] {
        return [ModifierFunction.HEALTHBAR_PIPS];
    }

    GetModifierHealthBarPips(): number {
        return math.ceil(this.parent.GetMaxHealth() / 70);
    }
}
