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
            Timers.CreateTimer(10, () => {
                this.TeamDistribution();
            });
        }
        //if (newState == GameState.HERO_SELECTION) {
        //        //CustomGameEventManager.Send_ServerToAllClients("show_map_selection_menu", { visibleState: true });
        //    });
        //}

        if (newState == GameState.PRE_GAME) {
            this.SpawnMap("wraith_trap_map");
            PauseGame(true);
            Timers.CreateTimer("Uni1", {
                useGameTime: false,
                endTime: 5,
                callback: () => {
                    PauseGame(false);
                }
            });
            //Timers.CreateTimer(120, () => {
            //    CustomGameEventManager.Send_ServerToAllClients("show_map_selection_menu", { visibleState: false });
            //});

            Timers.CreateTimer(0.2, () => {
                CustomGameEventManager.Send_ServerToAllClients("change_hero", {} as never);
            });
        }

        if (newState == GameState.GAME_IN_PROGRESS) {
            const heroes = HeroList.GetAllHeroes();
            heroes.forEach((hero) => {
                if (hero.GetTeam() == DotaTeam.GOODGUYS) {
                    const entities = Entities.FindAllByName("spawn_hunters");
                    FindClearSpaceForUnit(hero, entities[0].GetAbsOrigin(), true);
                } else {
                    const entities = Entities.FindAllByName("spawn_monster");
                    FindClearSpaceForUnit(hero, entities[RandomInt(0, entities.length)].GetAbsOrigin(), true);
                }
                hero.AddNewModifier(hero, undefined, "modifier_phased", { duration: 0.01 });
                hero.Interrupt();
                CenterCameraOnUnit(hero.GetPlayerOwnerID(), hero);
            });
            CustomGameEventManager.Send_ServerToAllClients("change_hero", {} as never);
            Timers.CreateTimer(1500, () => {
                GameRules.SetGameWinner(DotaTeam.GOODGUYS);
            });
        }
    }

    private TeamSelectionComplete(kv: TeamSelectionResultsEvent) {
        const player = PlayerResource.GetPlayer(kv.PlayerID as PlayerID) as CDOTAPlayerController_TeamSelectionUI;
        if (kv.PlayerType != undefined) {
            player.FavoredTeam = kv.PlayerType;
        } else {
            Debug_PrintError("TeamSelectionUI:TeamSelectionComplete PlayerType argument missing or invalid. Wtf?");
        }
    }

    private TeamDistribution() {
        const PlayersList: CDOTAPlayerController_TeamSelectionUI[] = [];
        const TablePlayerIDchoseMonster: PlayerID[] = [];
        for (let id = 0; id < PlayerResource.GetPlayerCountForTeam(DotaTeam.NOTEAM); id++) {
            const player = PlayerResource.GetPlayer(id as PlayerID) as CDOTAPlayerController_TeamSelectionUI;
            if (player != undefined) {
                PlayersList.push(player);
                if (player.FavoredTeam === "Monster") {
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
        player?.SetTeam(2);
        hero?.SetTeam(2);
    }

    private SelectionHero(data: HeroSelectionEvent) {
        if (data.PlayerID != undefined) {
            const PlayerID = data.PlayerID;
            if (!PlayerResource.HasSelectedHero(PlayerID) && !PlayerResource.IsBroadcaster(PlayerID)) {
                const player = PlayerResource.GetPlayer(data.PlayerID);
                if (player != undefined) {
                    if (data.HeroName == undefined) {
                        data.HeroName = this.GetRandomHeroKey(player.GetTeam() == DotaTeam.BADGUYS);
                    }
                    player.SetSelectedHero(data.HeroName);
                }
            } else {
                Debug_PrintError("TeamSelectionUI:SelectionHero Player argument missing or invalid. Wtf?");
            }
        } else {
            Debug_PrintError("TeamSelectionUI:SelectionHero PlayerID argument missing or invalid. Wtf?");
        }
    }

    private GetRandomHeroKey(IsMonster: boolean): string {
        const data = Object.entries(HeroesData);
        if (data.length === 0) {
            return "npc_dota_hero_tinker";
        }
        const keyClass: string[] = ["trapper", "assault", "support", "medic", "monster"];
        if (IsMonster == true) {
            const Monsterkeys = Object.keys(HeroesData[keyClass[4]]);
            const heroName = Monsterkeys[RandomInt(0, Monsterkeys.length - 1)];
            return heroName || "npc_dota_hero_tinker";
        }

        const Hunterkeys = Object.keys(HeroesData[keyClass[RandomInt(0, 3)]]);
        const heroName = Hunterkeys[RandomInt(0, Hunterkeys.length - 1)];
        return heroName || "npc_dota_hero_tinker";
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
    }
}

export interface CDOTAPlayerController_TeamSelectionUI extends CDOTAPlayerController {
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
