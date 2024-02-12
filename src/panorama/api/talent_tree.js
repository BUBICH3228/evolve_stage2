/* eslint-disable no-undef */
"use strict";

var DotaHUD = GameUI.CustomUIConfig().DotaHUD;
var PlayerTables = GameUI.CustomUIConfig().PlayerTables;
var Selection = GameUI.CustomUIConfig().Selection;
var Utils = GameUI.CustomUIConfig().Utils;
var Constants = GameUI.CustomUIConfig().Constants;

var TalentTree = {
    branchSelected: {},
    branchAvailable: {},
    branchPanels: {},
    heroTalents: {},
    callbacks: [],
    _isDataLoaded: false
};

TalentTree.TALENT_TREE_TABLE_NAME = "talent_tree_custom";

TalentTree.BRANCHES = Constants.TALENT_TREE_BRANCHES;

function IsBranchEnumValueExists(branchId) {
    let isExists = false;
    for (const [_, enumValue] of Object.entries(TalentTree.BRANCHES)) {
        if (enumValue == branchId) {
            isExists = true;
            break;
        }
    }
    return isExists;
}

TalentTree.ConvertBranchNameToEnumValue = function (branchName) {
    if (TalentTree.BRANCHES[branchName] != null) {
        return TalentTree.BRANCHES[branchName];
    }
    return -1;
};

TalentTree.GetBranchSelected = function (branchId) {
    try {
        if (IsBranchEnumValueExists(branchId) == false) {
            throw "Expected valid branchId instead of " + branchId + ". Are you forget to update TalentTree.BRANCHES?";
        }
    } catch (err) {
        $.Msg("TalentTree.GetBranchSelected throws error.");
        $.Msg(err);
        $.Msg(err.stack);
        return false;
    }
    if (TalentTree.branchSelected[branchId] != null) {
        return TalentTree.branchSelected[branchId];
    }
    return false;
};

TalentTree.SetBranchSelected = function (branchId, state) {
    try {
        if (IsBranchEnumValueExists(branchId) == false) {
            throw "Expected valid branchId instead of " + branchId + ". Are you forget to update TalentTree.BRANCHES?";
        }
    } catch (err) {
        $.Msg("TalentTree.SetBranchSelected throws error.");
        $.Msg(err);
        $.Msg(err.stack);
        return;
    }
    TalentTree.branchSelected[branchId] = state;
};

TalentTree.GetBranchAvailable = function (branchId) {
    try {
        if (IsBranchEnumValueExists(branchId) == false) {
            throw "Expected valid branchId instead of " + branchId + ". Are you forget to update TalentTree.BRANCHES?";
        }
    } catch (err) {
        $.Msg("TalentTree.GetBranchAvailable throws error.");
        $.Msg(err);
        $.Msg(err.stack);
        return false;
    }
    if (TalentTree.branchAvailable[branchId] != null) {
        return TalentTree.branchAvailable[branchId];
    }
    return false;
};

TalentTree.SetBranchAvailable = function (branchId, state) {
    try {
        if (IsBranchEnumValueExists(branchId) == false) {
            throw "Expected valid branchId instead of " + branchId + ". Are you forget to update TalentTree.BRANCHES?";
        }
    } catch (err) {
        $.Msg("TalentTree.SetBranchAvailable throws error.");
        $.Msg(err);
        $.Msg(err.stack);
        return;
    }
    TalentTree.branchAvailable[branchId] = state;
};

TalentTree.GetBranchPanel = function (branchId) {
    try {
        if (IsBranchEnumValueExists(branchId) == false) {
            throw "Expected valid branchId instead of " + branchId + ". Are you forget to update TalentTree.BRANCHES?";
        }
    } catch (err) {
        $.Msg("TalentTree.GetBranchPanel throws error.");
        $.Msg(err);
        $.Msg(err.stack);
        return;
    }
    return TalentTree.branchPanels[branchId];
};

TalentTree.SetBranchPanel = function (branchId, panel) {
    try {
        if (IsBranchEnumValueExists(branchId) == false) {
            throw "Expected valid branchId instead of " + branchId + ". Are you forget to update TalentTree.BRANCHES?";
        }
    } catch (err) {
        $.Msg("TalentTree.SetBranchPanel throws error.");
        $.Msg(err);
        $.Msg(err.stack);
        return;
    }
    TalentTree.branchPanels[branchId] = panel;
};

TalentTree.GetTalentNameForHero = function (hero, branchId) {
    try {
        if (IsBranchEnumValueExists(branchId) == false) {
            throw "Expected valid branchId instead of " + branchId + ". Are you forget to update TalentTree.BRANCHES?";
        }
    } catch (err) {
        $.Msg("TalentTree.GetTalentForHero throws error.");
        $.Msg(err);
        $.Msg(err.stack);
        return "";
    }
    if (Entities.IsHero(hero) == false || TalentTree.heroTalents[hero] == null) {
        return "";
    }
    return TalentTree.heroTalents[hero][branchId]["talent_name"];
};

TalentTree.IsTalentOfHeroHasDescription = function (hero, branchId) {
    try {
        if (IsBranchEnumValueExists(branchId) == false) {
            throw "Expected valid branchId instead of " + branchId + ". Are you forget to update TalentTree.BRANCHES?";
        }
    } catch (err) {
        $.Msg("TalentTree.GetTalentForHero throws error.");
        $.Msg(err);
        $.Msg(err.stack);
        return false;
    }
    if (Entities.IsHero(hero) == false || TalentTree.heroTalents[hero] == null) {
        return false;
    }
    return TalentTree.heroTalents[hero][branchId]["has_description"];
};

TalentTree.SetupTalentDescriptionLabel = function (hero, branchId, label) {
    try {
        if (IsBranchEnumValueExists(branchId) == false) {
            throw "Expected valid branchId instead of " + branchId + ". Are you forget to update TalentTree.BRANCHES?";
        }
    } catch (err) {
        $.Msg("TalentTree.GetTalentForHero throws error.");
        $.Msg(err);
        $.Msg(err.stack);
        return;
    }
    let talentName = TalentTree.GetTalentNameForHero(hero, branchId);
    let localizedDescription = $.Localize("#DOTA_Tooltip_ability_" + talentName + "_Description");
    let talent = Entities.GetAbilityByName(hero, talentName);
    if (talent > -1) {
        let specialsToReplace = localizedDescription.match(/%[\w\d]+%/g);
        if (specialsToReplace != null) {
            for (let i = 0; i < specialsToReplace.length; i++) {
                const specialName = Utils.ReplaceAll(specialsToReplace[i], "%", "");
                const roundedSpecialValue = Utils.Round(Abilities.GetLevelSpecialValueFor(talent, specialName, 3));
                localizedDescription = Utils.ReplaceAll(localizedDescription, specialsToReplace[i], roundedSpecialValue);
            }
        }
    }
    localizedDescription = Utils.ReplaceAll(localizedDescription, "%%", "%");
    label.text = localizedDescription;
};

TalentTree.IsHeroCanLearnTalent = function (hero, branchId) {
    if (Entities.IsHero(hero) == false || TalentTree.heroTalents[hero] == null) {
        return false;
    }
    return TalentTree.heroTalents[hero][branchId]["can_learn"];
};

TalentTree.IsHeroHaveTalent = function (hero, branchId) {
    if (Entities.IsHero(hero) == false || TalentTree.heroTalents[hero] == null) {
        return false;
    }
    return TalentTree.heroTalents[hero][branchId]["is_learned"];
};

TalentTree.IsAnyTalentCanBeLearned = function (hero) {
    if (Entities.IsHero(hero) == false || TalentTree.heroTalents[hero] == null) {
        return false;
    }
    let result = false;
    for (const [branchId, _] of Object.entries(TalentTree.heroTalents[hero])) {
        result = result || TalentTree.IsHeroCanLearnTalent(hero, branchId);
    }
    return result;
};

TalentTree.SetTalentTreeWindow = function (panel) {
    TalentTree._window = panel;
};

TalentTree.IsMouseOverTalentTreeWindow = function () {
    return DotaHUD.IsCursorOverPanel(TalentTree._window);
};

TalentTree.IsTalentTreeWindowOpened = function () {
    if (TalentTree._window != null) {
        return !TalentTree._window.BHasClass("Hidden");
    }
    return false;
};

TalentTree.ToggleTalentTreeWindow = function () {
    if (TalentTree.IsTalentTreeWindowOpened()) {
        TalentTree.CloseTalentTreeWindow();
    } else {
        TalentTree.OpenTalentTreeWindow();
    }
};

TalentTree.CloseTalentTreeWindow = function () {
    if (TalentTree._window != null) {
        TalentTree._window.SetHasClass("Hidden", true);
    }
};

TalentTree.OpenTalentTreeWindow = function () {
    if (TalentTree._window != null) {
        TalentTree._window.SetHasClass("Hidden", false);
    }
};

TalentTree.ListenToLocalPlayerTalentTreeChangedEvent = function (callback) {
    try {
        if (typeof callback !== "function") {
            throw "Expected callback as function.";
        }
    } catch (err) {
        $.Msg("TalentTree.ListenToLocalPlayerTalentTreeChangedEvent throws error.");
        $.Msg(err);
        $.Msg(err.stack);
        return "";
    }
    TalentTree.callbacks.push(callback);
    if (IsDataLoaded()) {
        FireLocalPlayerTalentTreeChangedEvent();
    }
};

function FireLocalPlayerTalentTreeChangedEvent() {
    for (let i = 0; i < TalentTree.callbacks.length; i++) {
        if (TalentTree.callbacks[i]) {
            try {
                TalentTree.callbacks[i]();
            } catch (err) {
                $.Msg("FireLocalPlayerTalentTreeChangedEvent callback error.");
                $.Msg(err);
                $.Msg(err.stack);
            }
        }
    }
}

function SetIsDataLoaded(state) {
    TalentTree._isDataLoaded = state;
}

function IsDataLoaded() {
    return TalentTree._isDataLoaded;
}

GameUI.CustomUIConfig().TalentTree = TalentTree;

function OnTalentsDataReceived(tableName, changesObject) {
    if (tableName != TalentTree.TALENT_TREE_TABLE_NAME) {
        $.Msg("Seems valve breaks TalentTree api. Table name is invalid. Wtf?");
        return;
    }
    if (changesObject["hero_talents"] == null) {
        $.Msg("Seems valve breaks TalentTree api. Table key hero_talents not defined. Wtf?");
        return;
    }
    let currentSelectedUnit = Selection.GetLocalPlayerSelectedUnit();

    for (const [entIndex, talentsData] of Object.entries(changesObject["hero_talents"])) {
        TalentTree.heroTalents[entIndex] = {};
        for (const [talentIndex, data] of Object.entries(talentsData)) {
            TalentTree.heroTalents[entIndex][talentIndex] = {
                talent_name: data["talent_name"] == null ? "" : data["talent_name"],
                can_learn: data["can_learn"] == null ? false : parseInt(data["can_learn"]) == 1,
                is_learned: data["is_learned"] == null ? false : parseInt(data["is_learned"]) == 1,
                has_description: data["has_description"] == null ? false : parseInt(data["has_description"]) == 1
            };
        }
        if (entIndex == currentSelectedUnit) {
            FireLocalPlayerTalentTreeChangedEvent();
        }
    }

    SetIsDataLoaded(true);
}

(function () {
    PlayerTables.SubscribeNetTableListener(TalentTree.TALENT_TREE_TABLE_NAME, OnTalentsDataReceived);
})();
