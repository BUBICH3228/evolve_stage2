/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */
"use strict";

var PlayerTables = GameUI.CustomUIConfig().PlayerTables;

var GameSettings = {
    callbacks: [],
    _isSettingsLoaded: false
};

GameSettings.GetSettingValueAsNumber = function (name) {
    let value = PlayerTables.GetTableValue("game_settings", name);

    if (value == null || value == undefined) {
        throw "Game setting named " + name + " not exists.";
    }

    let result = Number(value);

    if (isNaN(result)) {
        throw "Game setting named " + name + " not a number.";
    }

    return result;
};

GameSettings.GetSettingValueAsString = function (name) {
    let value = PlayerTables.GetTableValue("game_settings", name);

    if (value == null || value == undefined) {
        throw "Game setting named " + name + " not exists.";
    }

    return new String(value).toString();
};

GameSettings.GetSettingValueAsBoolean = function (name) {
    let value = PlayerTables.GetTableValue("game_settings", name);

    if (value == null || value == undefined) {
        throw "Game setting named " + name + " not exists.";
    }

    let result = Number(value);

    if (isNaN(result)) {
        throw "Game setting named " + name + " not a boolean.";
    }

    if (result != 0 && result != 1) {
        throw "Game setting named " + name + " not a boolean.";
    }
    return result == 1;
};

GameSettings.GetSettingValueAsTable = function (name) {
    let value = PlayerTables.GetTableValue("game_settings", name);

    if (value == null || value == undefined) {
        throw "Game setting named " + name + " not exists.";
    }

    return value;
};

GameSettings.GetSettingValueAsTeamNumber = function (name) {
    let value = GameSettings.GetSettingValueAsString(name);

    if (value == null || value == undefined) {
        throw "Game setting named " + name + " not exists.";
    }
    if (DOTATeam_t[value] != null) {
        return DOTATeam_t[value];
    }
    throw "Game setting named " + name + " not a valid team number.";
};

GameSettings.ListenToGameSettingsLoadedEvent = function (callback) {
    try {
        if (typeof callback !== "function") {
            throw "Expected callback as function.";
        }
    } catch (err) {
        $.Msg("GameSettings.FireGameSettingsLoadedEvent throws error.");
        $.Msg(err);
        $.Msg(err.stack);
        return "";
    }
    GameSettings.callbacks.push(callback);
    if (IsSettingsLoaded()) {
        FireGameSettingsLoadedEvent();
    }
};

function FireGameSettingsLoadedEvent() {
    for (let i = 0; i < GameSettings.callbacks.length; i++) {
        if (GameSettings.callbacks[i]) {
            try {
                GameSettings.callbacks[i]();
            } catch (err) {
                $.Msg("FireGameSettingsLoadedEvent callback error.");
                $.Msg(err);
                $.Msg(err.stack);
            }
        }
    }
}

function SetIsSettingsLoaded(state) {
    GameSettings._isSettingsLoaded = state;
}

function IsSettingsLoaded() {
    return GameSettings._isSettingsLoaded;
}

GameUI.CustomUIConfig().GameSettings = GameSettings;

(function () {
    PlayerTables.SubscribeNetTableListener("game_settings", function (tableName, changes, deletions) {
        if (tableName == "game_settings") {
            SetIsSettingsLoaded(true);
            FireGameSettingsLoadedEvent();
        }
    });
})();
