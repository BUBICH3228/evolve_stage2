/* eslint-disable no-undef */
"use strict";

const DOTA_HUD_ROOT = $.GetContextPanel().GetParent().GetParent();

var DotaHUD = {
    mouseCallbacks: []
};

DotaHUD.Get = function () {
    return DOTA_HUD_ROOT;
};

DotaHUD.ShowError = function (message) {
    GameEvents.SendEventClientSide("dota_hud_error_message", {
        reason: 80,
        message: message
    });
};

DotaHUD.ListenToMouseEvent = function (callback) {
    try {
        if (typeof callback !== "function") {
            throw "Expected callback as function.";
        }
    } catch (err) {
        $.Msg("DotaHUD.ListenToMouseEvent throws error.");
        $.Msg(err);
        $.Msg(err.stack);
        return "";
    }
    DotaHUD.mouseCallbacks.push(callback);
};

DotaHUD.IsCursorOverPanel = function (panel) {
    if (panel == null) {
        return false;
    }

    let cursorPos = GameUI.GetCursorPosition();

    let panelPos = panel.GetPositionWithinWindow();
    let width = panel.actuallayoutwidth;
    let height = panel.actuallayoutheight;
    
    if (
        ((panelPos.x < cursorPos[0] && panelPos.x + width > cursorPos[0]) && (panelPos.y < cursorPos[1] && panelPos.y + height > cursorPos[1]))
    ) {
        return false;
    }
    return true;
};

DotaHUD.GetScreenWidth = function() {
    return DotaHUD._screenWidth;
};

DotaHUD.GetScreenHeight = function() {
    return DotaHUD._screenHeight;
};

function FireMouseEvent(eventType, clickBehavior)
{
    for(let i = 0; i < DotaHUD.mouseCallbacks.length; i++) {
        if (DotaHUD.mouseCallbacks[i]) {
            try {
                DotaHUD.mouseCallbacks[i](eventType, clickBehavior);
            } catch (err) {
                $.Msg("FireMouseEvent callback error.");
                $.Msg(err);
                $.Msg(err.stack);
            }
        }
    }
}

GameUI.CustomUIConfig().DotaHUD = DotaHUD;

function SetClasses() {
    DOTA_HUD_ROOT.SetHasClass("ShopOpened", Game.IsShopOpen());
    DOTA_HUD_ROOT.SetHasClass("AltPressed", GameUI.IsAltDown());
    DOTA_HUD_ROOT.SetHasClass("CtrlPressed", GameUI.IsControlDown());
    DOTA_HUD_ROOT.SetHasClass("ShiftPressed", GameUI.IsShiftDown());
    DOTA_HUD_ROOT.SetHasClass("IsToolsMode", Game.IsInToolsMode());

    let selectedUnit = Players.GetLocalPlayerPortraitUnit();
    DOTA_HUD_ROOT.SetHasClass("NonHero", !Entities.IsHero(selectedUnit));
    $.Schedule(0.05, SetClasses);
}

function SetScreenHeightWidth()
{
  DotaHUD._screenWidth = DOTA_HUD_ROOT.actuallayoutwidth;
  DotaHUD._screenHeight = DOTA_HUD_ROOT.actuallayoutheight;  

  $.Schedule(1/2, SetScreenHeightWidth);
}

(function() {
    GameEvents.Subscribe('mountain_dota_hud_show_hud_error', function(data) {
        DotaHUD.ShowError(data.message);
    });

    GameUI.SetMouseCallback(function (eventType, clickBehavior) {
        FireMouseEvent(eventType, clickBehavior);
        return false;
    });

    SetScreenHeightWidth();
	SetClasses();
})();
