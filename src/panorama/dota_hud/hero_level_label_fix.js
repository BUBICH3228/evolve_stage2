/* eslint-disable no-undef */
"use strict";

var DotaHUD = GameUI.CustomUIConfig().DotaHUD;

function FindAndFixLevelLabel() {
    let dotaHud = DotaHUD.Get();
    let levelLabel = dotaHud.FindChildTraverse("LevelLabel");
    if (levelLabel) {
        levelLabel.style.width = "50px";
    } else {
        $.Msg("Seems valve break FindAndFixLevelLabel");
    }
}

(function () {
    FindAndFixLevelLabel();
})();
