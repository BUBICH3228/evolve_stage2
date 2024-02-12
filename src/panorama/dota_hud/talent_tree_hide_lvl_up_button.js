/* eslint-disable no-undef */
"use strict";

var DotaHUD = GameUI.CustomUIConfig().DotaHUD;

function FindAndHideTalentTreeLevelUpButton() {
    let dotaHud = DotaHUD.Get();
    let button = dotaHud.FindChildTraverse("level_stats_frame");
    if (button) {
        button.style.visibility = "collapse";
    } else {
        $.Msg("Seems valve break FindAndHideTalentTreeLevelUpButton");
    }
}

(function () {
    FindAndHideTalentTreeLevelUpButton();
})();
