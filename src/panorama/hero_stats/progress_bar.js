/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */
var HeroStats = GameUI.CustomUIConfig().HeroStats;
let PROGRESS_PANEL = $("#ProgressPanel");
let PROGRESS_PANEL_TEXT = $("#ProgressPanelText");
let AutofillButtonIsEnabled = false;

function UpdateGoldCollectionProgressPanel(HeroStatsTableDisplay) {
    if (HeroStatsTableDisplay == undefined) {
        return;
    }

    if (HeroStatsTableDisplay["Player"] == undefined) {
        return;
    }
    PROGRESS_PANEL_TEXT.text = Math.floor(HeroStatsTableDisplay["Player"][Game.GetLocalPlayerID()].GoldCollectionProgress) + "%";
    PROGRESS_PANEL.style.height = HeroStatsTableDisplay["Player"][Game.GetLocalPlayerID()].GoldCollectionProgress + "%";
}

function OnAutofillButtonPressed() {
    AutofillButtonIsEnabled = !AutofillButtonIsEnabled;
    GameEvents.SendCustomGameEventToServer("custom_hero_stats_autofill_button_pressed", {});
    const autofillButtonLabel = $("#AutofillButtonLabel");
    if (AutofillButtonIsEnabled) {
        autofillButtonLabel.text = "ON";
        autofillButtonLabel.style.color = "#38bd1dda";
    } else {
        autofillButtonLabel.text = "OFF";
        autofillButtonLabel.style.color = "#ff0000da";
    }
}

(function () {
    //GameEvents.Subscribe("custom_hero_stats_update_progress_bar", UpdateGoldCollectionProgressPanel);
})();
