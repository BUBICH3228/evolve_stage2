/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */
"use strict";

var HeroStats = {
    GoldCollectionProgres: 0,
    CountPoint: 0,
    AutoUseStatName: "",
    buttons: {},
    callbacks: {}
};

HeroStats.SetCountPoint = function (value) {
    HeroStats.CountPoint = value;
};

HeroStats.GetCountPoint = function () {
    return HeroStats.CountPoint;
};

HeroStats.SetGoldCollectionProgress = function (value) {
    HeroStats.GoldCollectionProgres = value;
};

HeroStats.GetGoldCollectionProgress = function () {
    return HeroStats.GoldCollectionProgres;
};

HeroStats.SetAutoUseStatName = function (value) {
    HeroStats.AutoUseStatName = value
}

HeroStats.GetAutoUseStatName = function () {
    return HeroStats.AutoUseStatName
}

HeroStats.FireButtonClickedEvent = function (buttonId) {
    if (HeroStats.callbacks[buttonId] == null) {
        return;
    }
    for (let i = 0; i < HeroStats.callbacks[buttonId].length; i++) {
        if (HeroStats.callbacks[buttonId][i] != null) {
            try {
                HeroStats.callbacks[buttonId][i]();
            } catch (err) {
                $.Msg("FireButtonClickedEvent callback error.");
                $.Msg(err);
                $.Msg(err.stack);
            }
        }
    }
};

HeroStats.ListenToButtonClickedEvent = function (buttonId, callback) {
    try {
        if (typeof callback !== "function") {
            throw "Expected callback as function.";
        }
    } catch (err) {
        $.Msg("HeroStats.ListenToButtonClickedEvent throws error.");
        $.Msg(err);
        $.Msg(err.stack);
        return;
    }
    if (HeroStats.callbacks[buttonId] == null) {
        HeroStats.callbacks[buttonId] = [];
    }
    HeroStats.callbacks[buttonId].push(callback);
};

HeroStats.SetButton = function (buttonId, panel) {
    try {
    } catch (err) {
        $.Msg("HeroStats.ListenToButtonClickedEvent throws error.");
        $.Msg(err);
        $.Msg(err.stack);
        return;
    }
    HeroStats.buttons[buttonId] = panel;
};

GameUI.CustomUIConfig().HeroStats = HeroStats;
