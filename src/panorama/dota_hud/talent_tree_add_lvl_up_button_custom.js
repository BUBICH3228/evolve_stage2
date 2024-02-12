/* eslint-disable no-undef */
"use strict";

var DotaHUD = GameUI.CustomUIConfig().DotaHUD;

function AddTalentTreeLevelupButtonCustom(dotaTalentTreeTreeLevelupContainer) {
    if (dotaTalentTreeTreeLevelupContainer._customTalentTreeTreeLvlupButton != null) {
        dotaTalentTreeTreeLevelupContainer._customTalentTreeTreeLvlupButton.DeleteAsync(0);
    }
    let container = dotaTalentTreeTreeLevelupContainer.GetParent();
    let panel = $.CreatePanel("Panel", container, "");
    panel.BLoadLayout("file://{resources}/layout/custom_game/talent_tree/talent_tree_lvl_up_button.xml", false, false);
    container.MoveChildBefore(panel, dotaTalentTreeTreeLevelupContainer);
    dotaTalentTreeTreeLevelupContainer._customTalentTreeTreeLvlupButton = panel;
}

function FindTalentTreeLevelupButton() {
    let dotaHud = DotaHUD.Get();
    let button = dotaHud.FindChildTraverse("level_stats_frame");
    if (button) {
        AddTalentTreeLevelupButtonCustom(button);
    } else {
        $.Msg("Seems valve break FindTalentTreeLevelupButton");
    }
}

(function () {
    FindTalentTreeLevelupButton();
})();
