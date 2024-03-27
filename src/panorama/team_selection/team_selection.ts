// eslint-disable-next-line no-var
var Utils = GameUI.CustomUIConfig().Utils;

class TeamSelection {
    MAIN_PANEL = $("#MainPanel");
    CLOSE_BUTTON = $("#CloseButton");
    HUNTER_BUTTON = $("#SelectHunterButton");
    MONSTER_BUTTON = $("#SelectMonsterButton");
    UNDECIDED_BUTTON = $("#SelectUndecidedButton");
    UNDECIDED_PLAYERS_CONTAINER = $("#UndecidedPlayersContainer");
    MONSTER_PLAYERS_CONTAINER = $("#MonsterPlayersContainer");
    HUNTER_PLAYERS_CONTAINER = $("#HunterPlayersContainer");
    TIMER_LABEL = $("#Timer");

    constructor() {
        $.Schedule(2, () => {
            this.ShowWindow(true);
        });
        GameEvents.Subscribe("show_team_selection_menu", (data) => {
            this.MAIN_PANEL.SetHasClass("Hidden", data.visibleState == 0);
            if (data.visibleState == 0) {
                this.TeamSelectionResults();
            }
        });

        GameEvents.Subscribe("team_selection_event", (data) => {
            (Players as CScriptBindingPR_Players_TeamSelection).PlayerData[data.playerID] = data.palyerTeam;
            this.UpdateUndecidedPlayers();
        });
        this.SetupCloseWindowButton();
        this.SetupSelectHunterOrMonsterButton();

        this.UpdateTimer();

        const playersID = Game.GetAllPlayerIDs();
        (Players as CScriptBindingPR_Players_TeamSelection).PlayerData = [];
        playersID.forEach(() => {
            (Players as CScriptBindingPR_Players_TeamSelection).PlayerData.push("Undecided");
        });
        this.UpdateUndecidedPlayers();
    }

    private UpdateUndecidedPlayers() {
        this.UNDECIDED_PLAYERS_CONTAINER.RemoveAndDeleteChildren();
        this.MONSTER_PLAYERS_CONTAINER.RemoveAndDeleteChildren();
        this.HUNTER_PLAYERS_CONTAINER.RemoveAndDeleteChildren();
        const playersID = Game.GetAllPlayerIDs();
        playersID.forEach((playerID) => {
            const data = Game.GetPlayerInfo(playerID);
            if ((Players as CScriptBindingPR_Players_TeamSelection).PlayerData[playerID] == "Undecided") {
                this.CreatePlayerAvatar(data.player_steamid, this.UNDECIDED_PLAYERS_CONTAINER);
            } else if ((Players as CScriptBindingPR_Players_TeamSelection).PlayerData[playerID] == "Monster") {
                this.CreatePlayerAvatar(data.player_steamid, this.MONSTER_PLAYERS_CONTAINER);
            } else if ((Players as CScriptBindingPR_Players_TeamSelection).PlayerData[playerID] == "Hunter") {
                this.CreatePlayerAvatar(data.player_steamid, this.HUNTER_PLAYERS_CONTAINER);
            }
        });
    }

    private CreatePlayerAvatar(playerSteamID: string, mainPanel: Panel) {
        const panel = $.CreatePanel("Panel", mainPanel, "PlayerInfoPanel");
        panel.BLoadLayoutSnippet("PlayerInfoSnippet");
        (panel.FindChildTraverse("Avatar") as AvatarImage).steamid = playerSteamID;
    }

    private UpdateTimer() {
        this.TIMER_LABEL.text = Utils.FormatTime(Math.abs(Game.GetDOTATime(false, true)) - 29);
        $.Schedule(0.25, () => {
            this.UpdateTimer();
        });
    }

    private SetupCloseWindowButton() {
        this.CLOSE_BUTTON.SetPanelEvent("onactivate", () => {
            this.ShowWindow(false);
        });
    }

    private ShowWindow(state: boolean) {
        this.MAIN_PANEL.SetHasClass("Hidden", !state);
    }

    private SetupSelectHunterOrMonsterButton() {
        this.HUNTER_BUTTON.SetPanelEvent("onactivate", () => {
            GameEvents.SendCustomGameEventToAllClients("team_selection_event", { playerID: Game.GetLocalPlayerID(), palyerTeam: "Hunter" });
        });
        this.MONSTER_BUTTON.SetPanelEvent("onactivate", () => {
            GameEvents.SendCustomGameEventToAllClients("team_selection_event", {
                playerID: Game.GetLocalPlayerID(),
                palyerTeam: "Monster"
            });
        });
        this.UNDECIDED_BUTTON.SetPanelEvent("onactivate", () => {
            GameEvents.SendCustomGameEventToAllClients("team_selection_event", {
                playerID: Game.GetLocalPlayerID(),
                palyerTeam: "Undecided"
            });
        });
    }
    private TeamSelectionResults() {
        this.ShowWindow(false);
        GameEvents.SendCustomGameEventToServer("team_selection_results", {
            PlayerType: (Players as CScriptBindingPR_Players_TeamSelection).PlayerData[Game.GetLocalPlayerID()]
        });
    }
}

new TeamSelection();

interface CScriptBindingPR_Players_TeamSelection extends CScriptBindingPR_Players {
    PlayerData: string[];
}
