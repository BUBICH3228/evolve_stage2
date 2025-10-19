import { BaseModifier, registerModifier } from "../libraries/dota_ts_adapter";

@registerModifier()
export class modifier_invulnerable_custom extends BaseModifier {
    IsHidden() {
        return true;
    }
    IsDebuff() {
        return false;
    }
    IsStunDebuff() {
        return true;
    }
    IsPurgable() {
        return false;
    }
    IsPurgeException() {
        return false;
    }
    CheckState(): Partial<Record<ModifierState, boolean>> {
        return {
            [ModifierState.INVULNERABLE]: true,
            [ModifierState.ATTACK_IMMUNE]: true,
            [ModifierState.NO_HEALTH_BAR]: true,
            [ModifierState.NO_HEALTH_BAR_FOR_ENEMIES]: true,
            [ModifierState.NO_HEALTH_BAR_FOR_OTHER_PLAYERS]: true
        };
    }
}
