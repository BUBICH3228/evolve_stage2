// eslint-disable-next-line no-var
var Utils = GameUI.CustomUIConfig().Utils;

class TeamSelection {
    MAIN_WINDOW = $("#MainPanel");
    CLOSE_BUTTON = $("#CloseButton");
    HUNTER_BUTTON = $("#SelectHuntersButton");
    MONSTER_BUTTON = $("#SelectMonsterButton");
    TIMER_LABEL = $("#Timer");

    result = "Undecided";
    constructor() {
        $.Schedule(2, () => {
            this.ShowWindow(true);
        });
        GameEvents.Subscribe("get_team_selection_results", () => {
            this.TeamSelectionResults();
        });
        this.SetupCloseWindowButton();
        this.SetupSelectHunterOrMonsterButton();

        this.UpdateTimer();
    }

    private UpdateTimer() {
        this.TIMER_LABEL.text = Utils.FormatTime(Math.abs(Game.GetDOTATime(false, true)) - 30);
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
        this.MAIN_WINDOW.SetHasClass("Hidden", !state);
    }

    private SetupSelectHunterOrMonsterButton() {
        this.HUNTER_BUTTON.SetPanelEvent("onactivate", () => {
            this.result = "Hunter";
        });
        this.MONSTER_BUTTON.SetPanelEvent("onactivate", () => {
            this.result = "Monster";
        });
    }
    private TeamSelectionResults() {
        this.ShowWindow(false);
        GameEvents.SendCustomGameEventToServer("team_selection_results", { PlayerType: this.result });
    }
}

new TeamSelection();
