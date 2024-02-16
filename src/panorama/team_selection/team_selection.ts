class TeamSelection {
    MAIN_WINDOW = $("#MainPanel");
    CLOSE_BUTTON = $("#CloseButton");
    HUNTER_BUTTON = $("#SelectHuntersButton");
    MONSTER_BUTTON = $("#SelectMonsterButton");
    constructor() {
        $.Schedule(2, () => {
            this.ShowWindow(true);
        });
        this.SetupCloseWindowButton();
        this.SetupSelectHunterOrMonsterButton();
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
            GameEvents.SendCustomGameEventToServer("team_selection_results", { PlayerType: "Hunter" });
        });
        this.MONSTER_BUTTON.SetPanelEvent("onactivate", () => {
            GameEvents.SendCustomGameEventToServer("team_selection_results", { PlayerType: "Monster" });
        });
    }
}

new TeamSelection();
