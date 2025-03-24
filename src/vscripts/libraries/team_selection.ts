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
            Timers.CreateTimer(60, () => {
                CustomGameEventManager.Send_ServerToAllClients("show_hero_selection_menu", { visibleState: false });
                this.ForEachPlayer((playerID) => {
                    this.SelectionHero({ PlayerID: playerID, HeroName: undefined });
                });
                CustomGameEventManager.Send_ServerToAllClients("show_map_selection_menu", { visibleState: true });
            });
            Timers.CreateTimer(120, () => {
                CustomGameEventManager.Send_ServerToAllClients("show_map_selection_menu", { visibleState: false });
                this.SpawnMap("wraith_trap_map");
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
        if (data.PlayerID != undefined && data.HeroName != undefined) {
            PlayerResource.ReplacePlayerHero(data.PlayerID, data.HeroName, false);
            Timers.CreateTimer(1, () => {
                CustomGameEventManager.Send_ServerToAllClients("fix_hero_minimap_icon", {});
                const hero = PlayerResource.GetSelectedHeroEntity(data.PlayerID!) as CDOTA_BaseNPC_Hero_Selection;
                hero.isHeroSelected = true;
                if (hero?.GetTeam() == DotaTeam.BADGUYS) {
                    hero.SetAbilityPoints(3);
                }
            });
        } else if (data.PlayerID != undefined && data.HeroName == undefined) {
            const hero = PlayerResource.GetSelectedHeroEntity(data.PlayerID!) as CDOTA_BaseNPC_Hero_Selection;
            if (hero.isHeroSelected == undefined) {
                PlayerResource.ReplacePlayerHero(data.PlayerID, this.GetRandomHeroKey(hero.GetTeam() == DotaTeam.BADGUYS), false);
            }
        } else {
            Debug_PrintError("TeamSelectionUI:SelectionHero PlayerID and HeroName argument missing or invalid. Wtf?");
        }
    }

    private GetRandomHeroKey(IsMonster: boolean): string {
        const data = Object.entries(HeroesData);

        if (data.length === 0) {
            return "npc_dota_hero_wisp";
        }

        if (IsMonster == true) {
            const Monsterkeys = Object.keys(data[4]);
            return Monsterkeys[RandomInt(0, Monsterkeys.length)] || "npc_dota_hero_wisp";
        }

        const Hunterkeys = [];
        for (let index = 0; index < 4; index++) {
            Hunterkeys.push(Object.keys(data[index]));
        }

        const randomClass = RandomInt(0, Hunterkeys.length);

        return Hunterkeys[randomClass][RandomInt(0, Hunterkeys[randomClass].length)] || "npc_dota_hero_wisp";
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
                print("Map spawn");
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
