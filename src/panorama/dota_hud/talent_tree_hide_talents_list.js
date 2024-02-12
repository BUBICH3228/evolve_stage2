/* eslint-disable no-undef */
"use strict";

var DotaHUD = GameUI.CustomUIConfig().DotaHUD;

function FindAndHideTalentTreeList() {
    let dotaHud = DotaHUD.Get();
    let button = dotaHud.FindChildTraverse("statbranchdialog");
    if (button) {
        button.style.visibility = "collapse";
    } else {
        $.Msg("Seems valve break FindAndHideTalentTreeList");
    }
}

(function () {
    FindAndHideTalentTreeList();
})();
