/* eslint-disable no-undef */
"use strict";

var Constants = GameUI.CustomUIConfig().Constants;

var TopBarButtons = {
    buttons: {},
    callbacks: {}
};

TopBarButtons.IsInitialized = function () {
    if (TopBarButtons._initialized != null) {
        return TopBarButtons._initialized;
    }
    return false;
};

TopBarButtons.SetIsInitialized = function (state) {
    TopBarButtons._initialized = state;
};

TopBarButtons.ShowButton = function (buttonId, state) {
    if (TopBarButtons.IsInitialized() == false) {
        $.Schedule(0.05, function () {
            TopBarButtons.ShowButton(buttonId, state);
        });
        return;
    }
    if (TopBarButtons.buttons[buttonId]) {
        TopBarButtons.buttons[buttonId].SetHasClass("Hidden", !state);
    }
};

TopBarButtons.FireButtonClickedEvent = function (buttonId) {
    if (TopBarButtons.callbacks[buttonId] == null) {
        return;
    }
    for (let i = 0; i < TopBarButtons.callbacks[buttonId].length; i++) {
        if (TopBarButtons.callbacks[buttonId][i] != null) {
            try {
                TopBarButtons.callbacks[buttonId][i]();
            } catch (err) {
                $.Msg("FireButtonClickedEvent callback error.");
                $.Msg(err);
                $.Msg(err.stack);
            }
        }
    }
};

function IsButtonEnumValueExists(buttonId) {
    let isExists = false;
    for (const [_, enumValue] of Object.entries(Constants.TOP_BAR_BUTTONS)) {
        if (enumValue == buttonId) {
            isExists = true;
            break;
        }
    }
    return isExists;
}

TopBarButtons.ListenToButtonClickedEvent = function (buttonId, callback) {
    try {
        if (IsButtonEnumValueExists(buttonId) == false) {
            throw "Expected valid buttonId instead of " + buttonId + ". Are you forget to update Constants.TOP_BAR_BUTTONS?";
        }
        if (typeof callback !== "function") {
            throw "Expected callback as function.";
        }
    } catch (err) {
        $.Msg("TopBarButtons.ListenToButtonClickedEvent throws error.");
        $.Msg(err);
        $.Msg(err.stack);
        return;
    }
    if (TopBarButtons.callbacks[buttonId] == null) {
        TopBarButtons.callbacks[buttonId] = [];
    }
    TopBarButtons.callbacks[buttonId].push(callback);
};

TopBarButtons.SetButton = function (buttonId, panel) {
    try {
        if (IsButtonEnumValueExists(buttonId) == false) {
            throw "Expected valid buttonId instead of " + buttonId + ". Are you forget to update Constants.TOP_BAR_BUTTONS?";
        }
    } catch (err) {
        $.Msg("TopBarButtons.ListenToButtonClickedEvent throws error.");
        $.Msg(err);
        $.Msg(err.stack);
        return;
    }
    TopBarButtons.buttons[buttonId] = panel;
};

GameUI.CustomUIConfig().TopBarButtons = TopBarButtons;
