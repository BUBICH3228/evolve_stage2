/* eslint-disable no-undef */
"use strict";

var DotaHUD = GameUI.CustomUIConfig().DotaHUD;

function AddTalentTreeTreeCustomButton(dotaTalentTreeTreeButton) {
    if (dotaTalentTreeTreeButton._customTalentTreeTreeButton != null) {
        dotaTalentTreeTreeButton._customTalentTreeTreeButton.DeleteAsync(0);
    }
    let container = dotaTalentTreeTreeButton.GetParent();
    let panel = $.CreatePanel("Panel", container, "");
    panel.BLoadLayout("file://{resources}/layout/custom_game/talent_tree/talent_tree_tree_button.xml", false, false);
    container.MoveChildBefore(panel, dotaTalentTreeTreeButton);
    dotaTalentTreeTreeButton._customTalentTreeTreeButton = panel;
}

function FindTalentTreeTreeButton() {
    let dotaHud = DotaHUD.Get();
    let button = dotaHud.FindChildTraverse("StatBranch");
    if (button) {
        AddTalentTreeTreeCustomButton(button);
    } else {
        $.Msg("Seems valve break FindTalentTreeTreeButton");
    }
}

(function () {
    FindTalentTreeTreeButton();
})();
