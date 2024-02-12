/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */
"use strict";

var TalentTree = GameUI.CustomUIConfig().TalentTree;
var Selection = GameUI.CustomUIConfig().Selection;

var TALENT_TREE_LVL_UP_BUTTON_PARENT = $("#LevelUpTab").GetParent();

function OnTalentTreeButtonPressed() {
    TalentTree.ToggleTalentTreeWindow();
}

function OnLocalPlayerSelectedUnit() {
    if (TALENT_TREE_LVL_UP_BUTTON_PARENT) {
        let selectedUnit = Selection.GetLocalPlayerSelectedUnit();
        if (Entities.IsHero(selectedUnit) == false) {
            return;
        }

        let isAnyTalentCanBeLearned = TalentTree.IsAnyTalentCanBeLearned(selectedUnit);
        TALENT_TREE_LVL_UP_BUTTON_PARENT.SetHasClass("SkillUpgradable", isAnyTalentCanBeLearned);
        TALENT_TREE_LVL_UP_BUTTON_PARENT.SetHasClass("CanLevelStats", isAnyTalentCanBeLearned);
    } else {
        $.Msg("Seems valve break custom talent lvl up button.");
    }
}

(function () {
    GameEvents.Subscribe("dota_player_update_selected_unit", OnLocalPlayerSelectedUnit);
    GameEvents.Subscribe("dota_player_update_query_unit", OnLocalPlayerSelectedUnit);

    TalentTree.SetTalentTreeWindow($("#DOTAStatBranch"));

    TalentTree.ListenToLocalPlayerTalentTreeChangedEvent(OnLocalPlayerSelectedUnit);
})();
