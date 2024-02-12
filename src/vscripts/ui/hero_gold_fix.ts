/* eslint-disable @typescript-eslint/no-unused-vars */

import { HeroStats } from "./hero_stats";

/* eslint-disable @typescript-eslint/no-explicit-any */
export class HeroGoldFix {
    public static HeroGoldTable: HeroGoldTable = {
        Player: {
            0: {
                CurrentGold: 0,
                SavedGold: 0
            },
            1: {
                CurrentGold: 0,
                SavedGold: 0
            },
            2: {
                CurrentGold: 0,
                SavedGold: 0
            },
            3: {
                CurrentGold: 0,
                SavedGold: 0
            },
            4: {
                CurrentGold: 0,
                SavedGold: 0
            }
        }
    };

    constructor() {
        this.Initialize();
    }

    private Initialize() {
        ListenToGameEvent("game_rules_state_change", () => this.OnGameRulesStateChange(), undefined);
        CustomEvents.RegisterEventHandler(CustomEvent.CUSTOM_EVENT_ON_PRE_PLAYER_GAIN_GOLD, (event) => {
            this.OnPlayerGainedGold(event as ModifyGoldFilterEvent);
        });

        CustomGameEventManager.RegisterListener("hero_gold_fix_update_table", (_, event) => {
            const data = {
                player_id_const: event.ID,
                gold: 0,
                reliable: 1,
                reason_const: ModifyGoldReason.GAME_TICK
            } as ModifyGoldFilterEvent;
            this.OnPlayerGainedGold(data, event.PlayerID);
        });
    }

    private OnGameRulesStateChange() {
        const newState = GameRules.State_Get();

        if (newState == GameState.PRE_GAME) {
            for (let id = 0; id < 5; id++) {
                const hero = PlayerResource.GetSelectedHeroEntity(id as PlayerID) as CDOTA_BaseNPC_Hero;
                if (hero == undefined) {
                    return;
                }
                Timers.CreateTimer(0.1, () => {
                    hero.SpendGold(0, ModifyGoldReason.GAME_TICK);
                    return 0.1;
                });
            }
        }
    }

    private OnPlayerGainedGold(event: ModifyGoldFilterEvent, LocalID?: PlayerID) {
        if (event.reason_const == ModifyGoldReason.UNSPECIFIED) {
            return;
        }
        const PlayerID = event.player_id_const;
        let player = PlayerResource.GetPlayer(PlayerID);
        if (LocalID != undefined) {
            player = PlayerResource.GetPlayer(LocalID);
        }
        const hero = PlayerResource.GetSelectedHeroEntity(PlayerID) as CDOTA_BaseNPC_Hero;
        if (hero == undefined || player == undefined) {
            return;
        }

        if (event.gold < -99999) {
            if (HeroGoldFix.HeroGoldTable.Player[PlayerID].CurrentGold < -1 * event.gold) {
                HeroGoldFix.HeroGoldTable.Player[PlayerID].CurrentGold = 0;
                HeroGoldFix.HeroGoldTable.Player[PlayerID].SavedGold = 0;
                hero.SpendGold(hero.GetGold(), ModifyGoldReason.UNSPECIFIED);
            }
        }

        const currentGold = hero.GetGold();
        if (event.gold >= 99999) {
            HeroGoldFix.HeroGoldTable.Player[PlayerID].CurrentGold += event.gold;
            HeroGoldFix.HeroGoldTable.Player[PlayerID].SavedGold = HeroGoldFix.HeroGoldTable.Player[PlayerID].CurrentGold - currentGold;
        } else if (event.gold > 0 && currentGold == 99999) {
            HeroGoldFix.HeroGoldTable.Player[PlayerID].SavedGold += event.gold;
        }

        const giveGold = math.min(99999 - currentGold, HeroGoldFix.HeroGoldTable.Player[PlayerID].SavedGold);

        HeroGoldFix.HeroGoldTable.Player[PlayerID].SavedGold -= giveGold;
        if (giveGold < 0) {
            hero.SpendGold(-1 * giveGold, ModifyGoldReason.UNSPECIFIED);
        } else {
            hero.ModifyGold(giveGold, false, ModifyGoldReason.UNSPECIFIED);
        }

        HeroGoldFix.HeroGoldTable.Player[PlayerID].CurrentGold =
            HeroGoldFix.HeroGoldTable.Player[PlayerID].SavedGold + PlayerResource.GetGold(PlayerID);

        if (event.reason_const == ModifyGoldReason.GAME_TICK) {
            CustomGameEventManager.Send_ServerToPlayer(player, "hero_gold_fix_update_label", HeroGoldFix.HeroGoldTable);
        }
    }
}

interface HeroGoldTable {
    Player: { [key: number]: PlayerData };
}

interface PlayerData {
    CurrentGold: number;
    SavedGold: number;
}

if (IsServer()) {
    new HeroGoldFix();
}
