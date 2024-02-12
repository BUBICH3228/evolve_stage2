/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */
"use strict";

var DotaHUD = GameUI.CustomUIConfig().DotaHUD;
var TalentTree = GameUI.CustomUIConfig().TalentTree;

function AddTalentTreeListCustom(dotaTalentTreeListContainer) {
    if (dotaTalentTreeListContainer._customTalentTreeTreeLvlupButton != null) {
        dotaTalentTreeListContainer._customTalentTreeTreeLvlupButton.DeleteAsync(0);
    }
    let container = dotaTalentTreeListContainer.GetParent();
    let panel = $.CreatePanel("Panel", container, "");
    panel.BLoadLayout("file://{resources}/layout/custom_game/talent_tree/talent_tree_window.xml", false, false);
    container.MoveChildBefore(panel, dotaTalentTreeListContainer);
    dotaTalentTreeListContainer._customTalentTreeTreeLvlupButton = panel;
}

function FindTalentTreeList() {
    let dotaHud = DotaHUD.Get();
    let button = dotaHud.FindChildTraverse("statbranchdialog");
    if (button) {
        AddTalentTreeListCustom(button);
    } else {
        $.Msg("Seems valve break FindTalentTreeList");
    }
}

(function () {
    FindTalentTreeList();
})();
