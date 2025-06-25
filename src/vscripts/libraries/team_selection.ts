import { HeroesData } from "../common/data/heroes_data";
import { reloadable } from "./tstl-utils";

@reloadable
export class TeamSelection {
    constructor() {
        this.Initialize();
    }

    private Initialize() {
        this.ListenToGameEvents();
    }

    private ListenToGameEvents() {
        ListenToGameEvent("game_rules_state_change", () => this.OnGameRulesStateChange(), undefined);
        CustomEvents.RegisterEventHandler(CustomEvent.CUSTOM_EVENT_ON_PLAYER_TEAM_SELECTED, (event) => {
            this.TeamSelectionComplete(event as TeamSelectionResultsEvent);
        });
        CustomEvents.RegisterEventHandler(CustomEvent.CUSTOM_EVENT_ON_PLAYER_HERO_SELECTED, (event) => {
            this.SelectionHero(event as HeroSelectionEvent);
        });
    }

    private OnGameRulesStateChange() {
        const newState = GameRules.State_Get();
        if (newState == GameState.CUSTOM_GAME_SETUP) {
            Timers.CreateTimer(5, () => {
                this.TeamDistribution();
            });
        }
        if (newState == GameState.PRE_GAME) {
            Timers.CreateTimer(1, () => {
                this.ForEachPlayer((playerID) => {
                    this.SelectionHero({ PlayerID: playerID, HeroName: undefined });
                    this.GiveOutHeroPlayer(playerID);
                });
                CustomGameEventManager.Send_ServerToAllClients("show_map_selection_menu", { visibleState: true });
            });
            Timers.CreateTimer(120, () => {
                CustomGameEventManager.Send_ServerToAllClients("show_map_selection_menu", { visibleState: false });
                //this.SpawnMap("prefabs/wraith_trap_map/section_1");
            });
        }
    }

    private TeamSelectionComplete(kv: TeamSelectionResultsEvent) {
        const hero = PlayerResource.GetPlayer(kv.PlayerID as PlayerID) as CDOTAPlayerController_TeamSelectionUI;
        if (kv.PlayerType != undefined) {
            hero.FavoredTeam = kv.PlayerType;
        } else {
            Debug_PrintError("TeamSelectionUI:TeamSelectionComplete PlayerType argument missing or invalid. Wtf?");
        }
    }

    private TeamDistribution() {
        const PlayersList: CDOTAPlayerController_TeamSelectionUI[] = [];
        const TablePlayerIDchoseMonster: PlayerID[] = [];
        for (let id = 0; id < PlayerResource.GetPlayerCountForTeam(DotaTeam.NOTEAM); id++) {
            const player = PlayerResource.GetPlayer(id as PlayerID) as CDOTAPlayerController_TeamSelectionUI;
            if (player) {
                PlayersList.push(player);
                if (player.FavoredTeam == "Monster") {
                    TablePlayerIDchoseMonster.push(id as PlayerID);
                }
            }
        }

        if (TablePlayerIDchoseMonster.length == 0) {
            const RandomPlayerID = PlayersList[RandomInt(0, PlayersList.length - 1)].GetPlayerID();
            this.SetTeam(RandomPlayerID, DotaTeam.BADGUYS);

            PlayersList.forEach((player) => {
                const PlayerID = player.GetPlayerID();
                if (PlayerID != RandomPlayerID) {
                    this.SetTeam(PlayerID, DotaTeam.GOODGUYS);
                }
            });
        } else if (TablePlayerIDchoseMonster.length == 1) {
            this.SetTeam(TablePlayerIDchoseMonster[0], DotaTeam.BADGUYS);
            PlayersList.forEach((player) => {
                const PlayerID = player.GetPlayerID();
                if (PlayerID != TablePlayerIDchoseMonster[0]) {
                    this.SetTeam(PlayerID, DotaTeam.GOODGUYS);
                }
            });
        } else if (TablePlayerIDchoseMonster.length > 1) {
            const RandomPlayerID = TablePlayerIDchoseMonster[RandomInt(0, TablePlayerIDchoseMonster.length - 1)];
            this.SetTeam(RandomPlayerID, DotaTeam.BADGUYS);

            PlayersList.forEach((player) => {
                const PlayerID = player.GetPlayerID();
                if (PlayerID != RandomPlayerID) {
                    this.SetTeam(PlayerID, DotaTeam.GOODGUYS);
                }
            });
        }
    }

    private SetTeam(PlayerID: PlayerID, DotaTeam: DotaTeam) {
        const player = PlayerResource.GetPlayer(PlayerID);
        const hero = PlayerResource.GetSelectedHeroEntity(PlayerID);
        player?.SetTeam(DotaTeam);
        hero?.SetTeam(DotaTeam);
    }

    private SelectionHero(data: HeroSelectionEvent) {
        if (data.PlayerID) {
            const player = PlayerResource.GetPlayer(data.PlayerID) as CDOTAPlayerController_TeamSelectionUI;
            if (player) {
                if (player.SelectedHero != undefined) {
                    return;
                }
                if (data.HeroName == undefined) {
                    const hero = PlayerResource.GetSelectedHeroEntity(data.PlayerID);
                    if (hero) {
                        player.SelectedHero = this.GetRandomHeroKey(hero.GetTeam() == DotaTeam.BADGUYS);
                    }
                } else {
                    player.SelectedHero = data.HeroName;
                }
            } else {
                Debug_PrintError("TeamSelectionUI:SelectionHero Player argument missing or invalid. Wtf?");
            }
        } else {
            Debug_PrintError("TeamSelectionUI:SelectionHero PlayerID argument missing or invalid. Wtf?");
        }
    }

    private GiveOutHeroPlayer(PlayerID: PlayerID) {
        const player = PlayerResource.GetPlayer(PlayerID) as CDOTAPlayerController_TeamSelectionUI;
        let HeroName = "npc_dota_hero_wisp";

        if (player) {
            HeroName = player.SelectedHero;
        }

        if (PlayerID != undefined) {
            Timers.CreateTimer(1, () => {
                PlayerResource.ReplacePlayerHero(PlayerID, HeroName, false);

                Timers.CreateTimer(1, () => {
                    CustomGameEventManager.Send_ServerToAllClients("fix_hero_minimap_icon", {});
                    const hero = PlayerResource.GetSelectedHeroEntity(PlayerID!) as CDOTA_BaseNPC_Hero_Selection;
                    hero.isHeroSelected = true;
                    if (hero?.GetTeam() == DotaTeam.BADGUYS) {
                        hero.SetAbilityPoints(3);
                    }
                });
            });
        } else {
            Debug_PrintError("TeamSelectionUI:GiveOutHeroPlayer PlayerID argument missing or invalid. Wtf?");
        }
    }

    private GetRandomHeroKey(IsMonster: boolean): string {
        const data = Object.entries(HeroesData);
        if (data.length === 0) {
            return "npc_dota_hero_wisp";
        }
        const keyClass: string[] = ["trapper", "assault", "support", "medic", "monster"];
        if (IsMonster == true) {
            const Monsterkeys = Object.keys(HeroesData[keyClass[4]]);
            const heroName = Monsterkeys[RandomInt(0, Monsterkeys.length)];
            return heroName || "npc_dota_hero_wisp";
        }

        const Hunterkeys = Object.keys(HeroesData[keyClass[RandomInt(0, 3)]]);
        const heroName = Hunterkeys[RandomInt(0, Hunterkeys.length)];
        return heroName || "npc_dota_hero_wisp";
    }

    private ForEachPlayer(callback: (playerId: PlayerID) => void): void {
        const heroes = HeroList.GetAllHeroes();
        heroes.forEach((hero) => {
            const playerId = hero.GetPlayerOwnerID();
            try {
                callback(playerId);
            } catch (e) {
                Debug_PrintError(e);
            }
        });
    }

    private SpawnMap(mapName: string) {
        DOTA_SpawnMapAtPosition(
            mapName,
            Vector(0, 0, 0),
            false,
            () => {
                return true;
            },
            () => {
                return;
            },
            undefined
        );
        Timers.CreateTimer(1, () => {
            const heroes = HeroList.GetAllHeroes();
            heroes.forEach((hero) => {
                if (hero.GetTeam() == DotaTeam.BADGUYS) {
                    FindClearSpaceForUnit(hero, Vector(0, 0, 500), true);
                    hero.AddNewModifier(hero, undefined, "modifier_phased", { duration: 0.01 });
                    hero.Interrupt();
                    CenterCameraOnUnit(hero.GetPlayerOwnerID(), hero);
                } else {
                    FindClearSpaceForUnit(hero, Vector(0, 0, 500), true);
                    hero.AddNewModifier(hero, undefined, "modifier_phased", { duration: 0.01 });
                    hero.Interrupt();
                    CenterCameraOnUnit(hero.GetPlayerOwnerID(), hero);
                }
            });
        });
    }
}

interface CDOTAPlayerController_TeamSelectionUI extends CDOTAPlayerController {
    FavoredTeam: string;
    SelectedHero: string;
}

declare global {
    // eslint-disable-next-line no-var
    var _TeamSelectionInitialized: boolean;
}

if (IsServer() && !_G._TeamSelectionInitialized) {
    new TeamSelection();
    _G._TeamSelectionInitialized = true;
}

interface CDOTA_BaseNPC_Hero_Selection extends CDOTA_BaseNPC_Hero {
    isHeroSelected: boolean;
}
