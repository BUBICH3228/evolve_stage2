/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */
"use strict";

var PlayerTables = GameUI.CustomUIConfig().PlayerTables;
var Constants = GameUI.CustomUIConfig().Constants;

var GameDifficulty = {
    _selectedDifficulty: Constants.GAME_DIFFICULTY.GAME_DIFFICULTY_NORMAL,
    _isSelected: false,
    _isDataLoaded: false,
    callbacks: []
};

GameDifficulty._DIFFICULTY_DATA = {
    [Constants.GAME_DIFFICULTY.GAME_DIFFICULTY_EASY]: {
        icon: "file://{resources}/images/custom_game/ui/lobby_settings/difficulty/easy.png",
        tooltip: $.Localize("#ui_lobby_settings_difficulty_easy")
    },
    [Constants.GAME_DIFFICULTY.GAME_DIFFICULTY_NORMAL]: {
        icon: "file://{resources}/images/custom_game/ui/lobby_settings/difficulty/normal.png",
        tooltip: $.Localize("#ui_lobby_settings_difficulty_normal")
    },
    [Constants.GAME_DIFFICULTY.GAME_DIFFICULTY_HARD]: {
        icon: "file://{resources}/images/custom_game/ui/lobby_settings/difficulty/hard.png",
        tooltip: $.Localize("#ui_lobby_settings_difficulty_hard")
    },
    [Constants.GAME_DIFFICULTY.GAME_DIFFICULTY_IMPOSSIBLE]: {
        icon: "file://{resources}/images/custom_game/ui/lobby_settings/difficulty/impossible.png",
        tooltip: $.Localize("#ui_lobby_settings_difficulty_impossible")
    }
};

function IsDifficultyEnumValueExists(difficultyId) {
    let isExists = false;
    for (const [_, enumValue] of Object.entries(Constants.GAME_DIFFICULTY)) {
        if (enumValue == difficultyId) {
            isExists = true;
            break;
        }
    }
    return isExists;
}

GameDifficulty.GetDifficultyImage = function (difficulty) {
    if (IsDifficultyEnumValueExists(difficulty) == false) {
        throw "Difficulty " + difficulty + " not exists!";
    }
    return GameDifficulty._DIFFICULTY_DATA[difficulty]["icon"];
};

GameDifficulty.GetDifficultyTooltip = function (difficulty) {
    if (IsDifficultyEnumValueExists(difficulty) == false) {
        throw "Difficulty " + difficulty + " not exists!";
    }
    return GameDifficulty._DIFFICULTY_DATA[difficulty]["tooltip"];
};

GameDifficulty.GetCurrentDifficulty = function () {
    return GameDifficulty._selectedDifficulty;
};

GameDifficulty.IsSelected = function () {
    return GameDifficulty._isSelected;
};

GameDifficulty.ListenToGameDifficultyChangedEvent = function (callback) {
    try {
        if (typeof callback !== "function") {
            throw "Expected callback as function.";
        }
    } catch (err) {
        $.Msg("GameDifficulty.ListenToGameDifficultyChangedEvent throws error.");
        $.Msg(err);
        $.Msg(err.stack);
        return "";
    }
    GameDifficulty.callbacks.push(callback);
    if (IsDataLoaded()) {
        FireToGameDifficultyChangedEvent();
    }
};

function FireToGameDifficultyChangedEvent() {
    for (let i = 0; i < GameDifficulty.callbacks.length; i++) {
        if (GameDifficulty.callbacks[i]) {
            try {
                GameDifficulty.callbacks[i]();
            } catch (err) {
                $.Msg("FireToGameDifficultyChangedEvent callback error.");
                $.Msg(err);
                $.Msg(err.stack);
            }
        }
    }
}

function SetIsDataLoaded(state) {
    GameDifficulty._isDataLoaded = state;
}

function IsDataLoaded() {
    return GameDifficulty._isDataLoaded;
}

function OnGameDifficultyDataChanged(changes) {
    if (changes["selected_difficulty"] != null) {
        GameDifficulty._selectedDifficulty = parseInt(changes["selected_difficulty"]);
    }
    if (changes["is_selected"] != null) {
        GameDifficulty._isSelected = parseInt(changes["is_selected"]) == 1;
    }
    SetIsDataLoaded(true);
}

GameUI.CustomUIConfig().GameDifficulty = GameDifficulty;

(function () {
    PlayerTables.SubscribeNetTableListener("game_difficulty", function (tableName, changes, deletions) {
        if (tableName == "game_difficulty") {
            OnGameDifficultyDataChanged(changes);
        }
    });
})();
