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
    }

    private OnGameRulesStateChange() {
        const newState = GameRules.State_Get();
    }

    private TeamSelectionComplete(kv: TeamSelectionResultsEvent) {
        const player = PlayerResource.GetPlayer(kv.PlayerID as PlayerID);
        const hero = PlayerResource.GetSelectedHeroEntity(kv.PlayerID as PlayerID);
        if (kv.PlayerType == "Hunter") {
            player?.SetTeam(DotaTeam.GOODGUYS);
            hero?.SetTeam(DotaTeam.GOODGUYS);
            PlayerResource.ReplacePlayerHero(kv.PlayerID as PlayerID, "npc_dota_hero_sniper", false);
        } else if (kv.PlayerType == "Monster") {
            player?.SetTeam(DotaTeam.BADGUYS);
            hero?.SetTeam(DotaTeam.BADGUYS);
            PlayerResource.ReplacePlayerHero(kv.PlayerID as PlayerID, "npc_dota_hero_primal_beast", false);
        } else {
            Debug_PrintError("TeamSelectionUI:TeamSelectionComplete PlayerType argument missing or invalid. Wtf?");
        }
    }
}
new TeamSelectionUI();
