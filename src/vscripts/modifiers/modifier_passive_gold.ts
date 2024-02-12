import { registerModifier, BaseModifier } from "../libraries/dota_ts_adapter";

@registerModifier()
export class modifier_passive_gold extends BaseModifier {
    // Modifier properties
    private parent: CDOTA_BaseNPC_Hero = this.GetParent() as CDOTA_BaseNPC_Hero;
    tinkInterval = 1;

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

    override OnCreated(): void {
        if (!IsServer()) {
            return;
        }
        this.StartIntervalThink(this.tinkInterval);
    }

    OnIntervalThink(): void {
        if (GameRules.State_Get() == GameState.GAME_IN_PROGRESS) {
            this.parent.ModifyGold(
                this.tinkInterval * GameSettings.GetSettingValueAsNumber("passive_gold_tick"),
                true,
                ModifyGoldReason.GAME_TICK
            );
        }
    }
}
