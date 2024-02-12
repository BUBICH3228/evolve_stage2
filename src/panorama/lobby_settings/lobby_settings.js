/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */
var Constants = GameUI.CustomUIConfig().Constants;
var GameSettings = GameUI.CustomUIConfig().GameSettings;
var Utils = GameUI.CustomUIConfig().Utils;
var GameDifficulty = GameUI.CustomUIConfig().GameDifficulty;

let ROOT = $("#MainWindow");
let DIFFICULTY_BUTTONS_CONTAINER = $("#DifficultyButtonsContainer");
let TIME_LEFT_LABEl = $("#TimeLeftLabel");
let DIFFICULTY_BUTTONS = [];
let IS_DIFFICULTY_BUTTONS_CREATED = false;

function SetVisibleStateIfPossible() {
    if (IS_DIFFICULTY_BUTTONS_CREATED == false) {
        return;
    }

    if (GameDifficulty.IsSelected() == true) {
        return;
    }

    let playerInfo = Game.GetLocalPlayerInfo();
    if (playerInfo["player_has_host_privileges"] == false) {
        return;
    }

    ShowWindow(true);
}

function ShowWindow(state) {
    ROOT.SetHasClass("Visible", state);
}

function Think() {
    let time = Game.GetDOTATime(false, true);

    if (time < 0) {
        TIME_LEFT_LABEl.text = Utils.ReplaceAll($.Localize("#ui_lobby_settings_time_left"), "%TIME%", Utils.FormatTime(Math.abs(time)));
        if (time > -1) {
            ShowWindow(false);
        } else {
            $.Schedule(1, Think);
        }
    } else {
        ShowWindow(false);
    }
}

function CreateDifficultyButtons() {
    DIFFICULTY_BUTTONS_CONTAINER.RemoveAndDeleteChildren();

    for (const [_, difficultyEnumValue] of Object.entries(Constants.GAME_DIFFICULTY)) {
        let panel = $.CreatePanel("Panel", DIFFICULTY_BUTTONS_CONTAINER, "");
        panel.BLoadLayoutSnippet("DifficultyButtonSnippet");
        let icon = panel.FindChildTraverse("DifficultyIcon");
        let label = panel.FindChildTraverse("DifficultyLabel");
        icon.SetImage(GameDifficulty.GetDifficultyImage(difficultyEnumValue));
        label.text = GameDifficulty.GetDifficultyTooltip(difficultyEnumValue);
        panel.SetPanelEvent("onmouseover", function () {
            $.DispatchEvent(
                "UIShowCustomLayoutParametersTooltip",
                panel,
                "DifficultyButtonTooltip",
                "file://{resources}/layout/custom_game/tooltips/game_difficulty_tooltip.xml",
                "difficulty=" + difficultyEnumValue
            );
        });
        panel.SetPanelEvent("onmouseout", function () {
            $.DispatchEvent("UIHideCustomLayoutTooltip", panel, "DifficultyButtonTooltip");
        });
        panel.SetPanelEvent("onactivate", function () {
            GameEvents.SendCustomGameEventToServer("game_difficulty_set_difficulty", {
                difficulty: difficultyEnumValue
            });
            ShowWindow(false);
            Game.EmitSound("Item.PickUpGemShop");
        });
    }

    IS_DIFFICULTY_BUTTONS_CREATED = true;
}

(function () {
    GameSettings.ListenToGameSettingsLoadedEvent(function () {
        CreateDifficultyButtons();
        SetVisibleStateIfPossible();
    });
    GameDifficulty.ListenToGameDifficultyChangedEvent(function () {
        SetVisibleStateIfPossible();
    });
    Think();
})();
