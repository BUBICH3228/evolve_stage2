/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable no-undef */
"use strict";

var DotaHUD = GameUI.CustomUIConfig().DotaHUD;

function FindAndHideTalentTreeTreeButton() {
    let dotaHud = DotaHUD.Get();
    let button = dotaHud.FindChildTraverse("StatBranch");
    if (button) {
        button.style.visibility = "collapse";
        button.SetPanelEvent("onmouseover", function () {});
        button.SetPanelEvent("onactivate", function () {});
    } else {
        $.Msg("Seems valve break FindAndHideTalentTreeTreeButton");
    }
}

(function () {
    FindAndHideTalentTreeTreeButton();
})();
