class TeamSelectionUI {
    constructor() {
        this.Initialize();
    }

    private Initialize() {
        this.ListenToGameEvents();
    }

    private ListenToGameEvents() {
        ListenToGameEvent("game_rules_state_change", () => this.OnGameRulesStateChange(), undefined);
        CustomGameEventManager.RegisterListener("team_selection_results", (_, event) => this.TeamSelectionComplete(event));
        CustomGameEventManager.RegisterListener("hero_selection_event", (_, event) => this.SelectionHero(event));
    }

    private OnGameRulesStateChange() {
        const newState = GameRules.State_Get();
        if (newState == GameState.PRE_GAME) {
            CustomGameEventManager.Send_ServerToAllClients("show_team_selection_menu", { visibleState: true });
            Timers.CreateTimer(30, () => {
                CustomGameEventManager.Send_ServerToAllClients("show_team_selection_menu", { visibleState: false });
                this.TeamDistribution();
                CustomGameEventManager.Send_ServerToAllClients("show_hero_selection_menu", { visibleState: true });
            });
            Timers.CreateTimer(90, () => {
                CustomGameEventManager.Send_ServerToAllClients("show_hero_selection_menu", { visibleState: false });
                CustomGameEventManager.Send_ServerToAllClients("show_map_selection_menu", { visibleState: true });
            });
            Timers.CreateTimer(120, () => {
                CustomGameEventManager.Send_ServerToAllClients("show_map_selection_menu", { visibleState: false });
                this.SpawnMap("wraith_trap_map");
            });
        }
    }

    private TeamSelectionComplete(kv: TeamSelectionResultsEvent) {
        const hero = PlayerResource.GetSelectedHeroEntity(kv.PlayerID as PlayerID) as CDOTA_BaseNPC_Hero_TeamSelectionUI;
        if (kv.PlayerType != undefined) {
            hero.FavoredTeam = kv.PlayerType;
        } else {
            Debug_PrintError("TeamSelectionUI:TeamSelectionComplete PlayerType argument missing or invalid. Wtf?");
        }
    }

    private TeamDistribution() {
        const heroes = HeroList.GetAllHeroes() as CDOTA_BaseNPC_Hero_TeamSelectionUI[];
        const TablePlayerIDchoseMonster: PlayerID[] = [];
        heroes.forEach((hero) => {
            if (hero.FavoredTeam == "Monster") {
                TablePlayerIDchoseMonster.push(hero.GetPlayerOwnerID());
            }
        });

        if (TablePlayerIDchoseMonster.length == 0) {
            const heroes = HeroList.GetAllHeroes();
            const RandomPlayerID = heroes[RandomInt(0, heroes.length - 1)].GetPlayerOwnerID();
            this.SetTeam(RandomPlayerID, DotaTeam.BADGUYS);

            heroes.forEach((hero) => {
                const PlayerID = hero.GetPlayerOwnerID();
                if (PlayerID != RandomPlayerID) {
                    this.SetTeam(PlayerID, DotaTeam.GOODGUYS);
                }
            });
        } else if (TablePlayerIDchoseMonster.length == 1) {
            this.SetTeam(TablePlayerIDchoseMonster[0], DotaTeam.BADGUYS);
            const heroes = HeroList.GetAllHeroes();
            heroes.forEach((hero) => {
                const PlayerID = hero.GetPlayerOwnerID();
                if (PlayerID != TablePlayerIDchoseMonster[0]) {
                    this.SetTeam(PlayerID, DotaTeam.GOODGUYS);
                }
            });
        } else if (TablePlayerIDchoseMonster.length > 1) {
            const RandomPlayerID = TablePlayerIDchoseMonster[RandomInt(0, TablePlayerIDchoseMonster.length - 1)];
            this.SetTeam(RandomPlayerID, DotaTeam.BADGUYS);

            heroes.forEach((hero) => {
                const PlayerID = hero.GetPlayerOwnerID();
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
                const hero = PlayerResource.GetSelectedHeroEntity(data.PlayerID!);
                if (hero?.GetTeam() == DotaTeam.BADGUYS) {
                    hero.SetAbilityPoints(3);
                }
            });
        } else {
            Debug_PrintError("TeamSelectionUI:SelectionHero PlayerID and HeroName argument missing or invalid. Wtf?");
        }
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
    }
}

interface CDOTA_BaseNPC_Hero_TeamSelectionUI extends CDOTA_BaseNPC_Hero {
    FavoredTeam: string;
}

new TeamSelectionUI();
