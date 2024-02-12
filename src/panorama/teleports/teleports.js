/* eslint-disable no-undef */
const TELEPORTS_CONTAINER = $("#TeleportButtonsContainer");
const MAIN_WINDOW = $("#MainWindow");
let TELEPORTS_BUTTONS = {};
var DotaHUD = GameUI.CustomUIConfig().DotaHUD;

function CreateOrUpdateTeleportButton(id, name, image, useCenterAlignment, isLocked, unlockBossName) {
    let button = TELEPORTS_BUTTONS[id];

    if (button == null) {
        button = $.CreatePanel("Button", TELEPORTS_CONTAINER, "");
        button.BLoadLayoutSnippet("TeleportButton");
    }

    button.SetHasClass("Center", useCenterAlignment);
    button.SetHasClass("Locked", isLocked);

    let locationImage = button.FindChildTraverse("TeleportButtonIcon");
    if (locationImage) {
        locationImage.SetImage(image);
    }

    let locationNameLabel = button.FindChildTraverse("TeleportButtonTitle");
    if (locationNameLabel) {
        locationNameLabel.text = $.Localize(name);
    }

    let locationUnlockBossName = button.FindChildTraverse("TeleportUnlockBossName");
    if (locationUnlockBossName) {
        locationUnlockBossName.text = "'" + $.Localize("#" + unlockBossName) + "'";
    }

    button.SetPanelEvent("onactivate", function () {
        if (isLocked == false) {
            OnTeleportButtonPressed(id);
        }
    });

    TELEPORTS_BUTTONS[id] = button;
}

function OnTeleportButtonPressed(id) {
    GameEvents.SendCustomGameEventToServer("teleports_player_selected_location", {
        location: id
    });
    ShowWindow(false);
}

function OnTeleportsDataReceived(kv) {
    let sortedTeleports = Object.entries(kv["teleports"]).sort(([a], [b]) => a - b);
    for (const [id, data] of sortedTeleports) {
        let isRequireCenterAlignment = parseInt(data["require_center_alignment"]) == 1;
        let isLocked = parseInt(data["locked"]) == 1;
        CreateOrUpdateTeleportButton(id, data["name"], data["image"], isRequireCenterAlignment, isLocked, data["unlock_boss"]);
    }
}

function OnCloseButtonPressed() {
    ShowWindow(false);
}

function OnOpenWindowRequest() {
    ShowWindow(true);
}

function ShowWindow(state) {
    MAIN_WINDOW.SetHasClass("Visible", state);
}

function ClearTeleports() {
    TELEPORTS_CONTAINER.RemoveAndDeleteChildren();
}

function OnMouseEvent(eventType, clickBehavior) {
    if (
        (eventType == "pressed" && clickBehavior == CLICK_BEHAVIORS.DOTA_CLICK_BEHAVIOR_NONE) ||
        clickBehavior == CLICK_BEHAVIORS.DOTA_CLICK_BEHAVIOR_MOVE
    ) {
        let cursorPos = GameUI.GetCursorPosition();
        let panelPos = MAIN_WINDOW.GetPositionWithinWindow();
        let width = Number(MAIN_WINDOW.actuallayoutwidth);
        let height = Number(MAIN_WINDOW.actuallayoutheight);

        if (
            !(
                Number(panelPos.x) < cursorPos[0] &&
                Number(panelPos.x) + width > cursorPos[0] &&
                Number(panelPos.y) < cursorPos[1] &&
                Number(panelPos.y) + height > cursorPos[1]
            )
        ) {
            OnCloseButtonPressed();
        }
    }
}

(function () {
    ClearTeleports();
    GameEvents.SendCustomGameEventToServer("teleports_get_data", {});
    GameEvents.Subscribe("teleports_get_data_response", OnTeleportsDataReceived);
    GameEvents.Subscribe("teleports_open_window", OnOpenWindowRequest);
    DotaHUD.ListenToMouseEvent(OnMouseEvent);
})();
