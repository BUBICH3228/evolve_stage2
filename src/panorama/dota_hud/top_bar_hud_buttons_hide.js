/* eslint-disable no-undef */
"use strict";

var DotaHUD = GameUI.CustomUIConfig().DotaHUD;

function HideDefaultDOTATopBarButtons() {
    var hud = DotaHUD.Get();
    var buttonsContainer = hud.FindChildTraverse("MenuButtons");
    if (buttonsContainer) {
        buttonsContainer.style.visibility = "collapse";
    } else {
        $.Msg("Seems valve break HideDefaultDOTATopBarButtons");
    }
}

(function () {
    HideDefaultDOTATopBarButtons();
})();
