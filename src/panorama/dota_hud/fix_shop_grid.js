/* eslint-disable no-undef */
"use strict";

var DotaHUD = GameUI.CustomUIConfig().DotaHUD;

function FindAndFixShopGrid() {
    let dotaHud = DotaHUD.Get();
    const gridBasicItems = dotaHud.FindChildTraverse("GridBasicItems");
    const gridUpgradeItems = dotaHud.FindChildTraverse("GridUpgradeItems")
    if (gridBasicItems && gridUpgradeItems) {
        gridBasicItems.style.overflow = "clip scroll";
        gridUpgradeItems.style.overflow = "clip scroll";
    } else {
        $.Schedule(5, FindAndFixShopGrid);
        $.Msg("Seems valve break FindAndFixShopGrid");
    }
}

(function () {
    FindAndFixShopGrid();
})();
