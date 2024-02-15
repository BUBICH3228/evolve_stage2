import { BaseModifier, registerModifier } from "../libraries/dota_ts_adapter";

@registerModifier()
export class modifier_quest_npc extends BaseModifier {
    // Modifier properties
    private parent: CDOTA_BaseNPC = this.GetParent();

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

    override CheckState(): Partial<Record<ModifierState, boolean>> {
        return {
            [ModifierState.INVULNERABLE]: true,
            [ModifierState.STUNNED]: true,
            [ModifierState.NO_HEALTH_BAR]: true
        };
    }

    override DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.MIN_HEALTH, ModifierFunction.INCOMING_DAMAGE_PERCENTAGE];
    }

    override GetMinHealth(): number {
        return 1;
    }

    override GetModifierIncomingDamage_Percentage(event: ModifierAttackEvent): number {
        if (event.target != this.parent) {
            return 0;
        }
        return -9999999;
    }
}
