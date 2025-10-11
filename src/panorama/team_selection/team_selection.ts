// eslint-disable-next-line no-var
var DotaHUD = GameUI.CustomUIConfig().DotaHUD;

class TeamSelection {
    MAIN_PANEL = $("#MainPanel");
    CLOSE_BUTTON = $("#CloseButton");
    HUNTER_BUTTON = $("#SelectHunterButton");
    MONSTER_BUTTON = $("#SelectMonsterButton");
    UNDECIDED_BUTTON = $("#SelectUndecidedButton");
    UNDECIDED_PLAYERS_CONTAINER = $("#UndecidedPlayersContainer");
    MONSTER_PLAYERS_CONTAINER = $("#MonsterPlayersContainer");
    HUNTER_PLAYERS_CONTAINER = $("#HunterPlayersContainer");

    constructor() {
        GameEvents.Subscribe("team_selection_event", (data) => {
            (Players as CScriptBindingPR_Players_TeamSelection).PlayerData[data.playerID] = data.palyerTeam;
            this.UpdateUndecidedPlayers();
        });
        this.SetupSelectHunterOrMonsterButton();

        const playersID = Game.GetAllPlayerIDs();
        (Players as CScriptBindingPR_Players_TeamSelection).PlayerData = [];
        playersID.forEach(() => {
            (Players as CScriptBindingPR_Players_TeamSelection).PlayerData.push("Undecided");
        });
        this.UpdateUndecidedPlayers();
        this.FixUIDOTAInterface();
        $.Schedule(9.5, () => {
            this.TeamSelectionResults();
        });
    }

    private FixUIDOTAInterface() {
        const hud = DotaHUD.Get();
        const TeamsList = hud.FindChildTraverse("TeamsList");
        if (TeamsList) {
            TeamsList.style.visibility = "collapse";
        }
        const GameAndPlayersRoot = hud.FindChildTraverse("GameAndPlayersRoot");
        if (GameAndPlayersRoot) {
            GameAndPlayersRoot.style.backgroundColor = "#ffffff00";
            GameAndPlayersRoot.style.boxShadow = "#ffffff00 0px 0px 0px";
            GameAndPlayersRoot.style.width = "100%";
            GameAndPlayersRoot.style.height = "100%";
            GameAndPlayersRoot.FindChildTraverse("MapInfo")!.style.visibility = "collapse";
            GameAndPlayersRoot.FindChildTraverse("TimerBg")!.style.visibility = "collapse";
            GameAndPlayersRoot.FindChildTraverse("TimerRing")!.style.visibility = "collapse";
            GameAndPlayersRoot.FindChildTraverse("StartGameCountdownTimer")!.style.marginTop = "5px";
            GameAndPlayersRoot.FindChildTraverse("StartGameCountdownTimer")!.style.marginLeft = "55px";
            const GameInfoPanel = GameAndPlayersRoot.FindChildTraverse("GameInfoPanel");
            if (GameInfoPanel) {
                GameInfoPanel.style.height = "90%";
                GameInfoPanel.style.marginLeft = "44.5%";
                GameInfoPanel.FindChildTraverse("GameModeNameLabel")!.style.color = "Black";
                GameInfoPanel.FindChildTraverse("TeamSelectTimer")!.style.color = "Black";
                GameInfoPanel.FindChildTraverse("TimerLabelAutoStart")!.style.color = "Black";
            }
        }
        const CancelAndUnlockButton = hud.FindChildTraverse("CancelAndUnlockButton");
        if (CancelAndUnlockButton) {
            CancelAndUnlockButton.style.visibility = "collapse";
        }
        const UnassignedPlayerPanel = hud.FindChildTraverse("UnassignedPlayerPanel");
        if (UnassignedPlayerPanel) {
            UnassignedPlayerPanel.style.visibility = "collapse";
        }
        const LockAndStartButton = hud.FindChildTraverse("LockAndStartButton");
        if (LockAndStartButton) {
            LockAndStartButton.style.visibility = "collapse";
        }
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
        GameEvents.SendCustomGameEventToServer("team_selection_results", {
            PlayerType: (Players as CScriptBindingPR_Players_TeamSelection).PlayerData[Game.GetLocalPlayerID()],
            PlayerID: Game.GetLocalPlayerID()
        });
    }
}

new TeamSelection();

interface CScriptBindingPR_Players_TeamSelection extends CScriptBindingPR_Players {
    PlayerData: string[];
}
