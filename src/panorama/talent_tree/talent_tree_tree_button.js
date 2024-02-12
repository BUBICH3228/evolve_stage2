/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */
"use strict";

var TalentTree = GameUI.CustomUIConfig().TalentTree;
var Selection = GameUI.CustomUIConfig().Selection;
var DotaHUD = GameUI.CustomUIConfig().DotaHUD;

var TALENT_TREE_TREE_BUTTON_DATA = {
    Container: $("#StatBranch").GetParent(),
    Branches: {
        [TalentTree.BRANCHES.RIGHT_BRANCH_25]: {
            Row: $("#StatRow10"),
            isLeft: false
        },
        [TalentTree.BRANCHES.LEFT_BRANCH_25]: {
            Row: $("#StatRow10"),
            isLeft: true
        },
        [TalentTree.BRANCHES.RIGHT_BRANCH_50]: {
            Row: $("#StatRow15"),
            isLeft: false
        },
        [TalentTree.BRANCHES.LEFT_BRANCH_50]: {
            Row: $("#StatRow15"),
            isLeft: true
        },
        [TalentTree.BRANCHES.RIGHT_BRANCH_75]: {
            Row: $("#StatRow20"),
            isLeft: false
        },
        [TalentTree.BRANCHES.LEFT_BRANCH_75]: {
            Row: $("#StatRow20"),
            isLeft: true
        },
        [TalentTree.BRANCHES.RIGHT_BRANCH_100]: {
            Row: $("#StatRow25"),
            isLeft: false
        },
        [TalentTree.BRANCHES.LEFT_BRANCH_100]: {
            Row: $("#StatRow25"),
            isLeft: true
        }
    },
    Levels: {
        1: $("#StatLevelProgressBar"),
        2: $("#StatLevelProgressBarBlur")
    }
};

function OnTalentTreeButtonPressed() {
    TalentTree.ToggleTalentTreeWindow();
}

function OnLocalPlayerSelectedUnit() {
    let selectedUnit = Selection.GetLocalPlayerSelectedUnit();
    if (Entities.IsHero(selectedUnit) == false) {
        return;
    }

    for (const [branchEnumValue, branch] of Object.entries(TALENT_TREE_TREE_BUTTON_DATA["Branches"])) {
        var isLeft = branch["isLeft"];
        var branchRow = branch["Row"];

        let isHeroHaveTalent = TalentTree.IsHeroHaveTalent(selectedUnit, branchEnumValue);

        branchRow.SetHasClass(isLeft ? "LeftBranchSelected" : "RightBranchSelected", isHeroHaveTalent);
    }

    let container = TALENT_TREE_TREE_BUTTON_DATA["Container"];
    let isAnyTalentCanBeLearned = TalentTree.IsAnyTalentCanBeLearned(selectedUnit);

    container.SetHasClass("SkillUpgradable", isAnyTalentCanBeLearned);
    container.SetHasClass("TalentUpgradeable", isAnyTalentCanBeLearned);
    container.SetHasClass("CanLevelStats", isAnyTalentCanBeLearned);

    let heroLevel = Entities.GetLevel(selectedUnit);

    for (const [_, progressBar] of Object.entries(TALENT_TREE_TREE_BUTTON_DATA["Levels"])) {
        progressBar.value = heroLevel;
    }
}

function OnMouseEvent(eventType, clickBehavior) {
    if (eventType == "pressed" && TalentTree.IsTalentTreeWindowOpened() && clickBehavior == CLICK_BEHAVIORS.DOTA_CLICK_BEHAVIOR_NONE) {
        if (TalentTree.IsMouseOverTalentTreeWindow()) {
            TalentTree.CloseTalentTreeWindow();
        }
    }
}

(function () {
    GameEvents.Subscribe("dota_player_update_selected_unit", OnLocalPlayerSelectedUnit);
    GameEvents.Subscribe("dota_player_update_query_unit", OnLocalPlayerSelectedUnit);

    TalentTree.ListenToLocalPlayerTalentTreeChangedEvent(OnLocalPlayerSelectedUnit);

    DotaHUD.ListenToMouseEvent(OnMouseEvent);
})();
