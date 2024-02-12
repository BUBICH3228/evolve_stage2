/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-redeclare */
/* eslint-disable no-undef */
"use strict";

var TalentTree = GameUI.CustomUIConfig().TalentTree;
var Selection = GameUI.CustomUIConfig().Selection;
var GameSettings = GameUI.CustomUIConfig().GameSettings;

var TALENT_TREE_WINDOW_DATA = {
    Branches: {
        [TalentTree.BRANCHES.RIGHT_BRANCH_25]: {
            Label: $("#UpgradeName1"),
            DescriptionLabel: $("#Description1"),
            DescriptionContainer: $("#Upgrade1DescriptionContainer"),
            UpgradeButton: $("#Upgrade1")
        },
        [TalentTree.BRANCHES.LEFT_BRANCH_25]: {
            Label: $("#UpgradeName2"),
            DescriptionLabel: $("#Description2"),
            DescriptionContainer: $("#Upgrade2DescriptionContainer"),
            UpgradeButton: $("#Upgrade2")
        },
        [TalentTree.BRANCHES.RIGHT_BRANCH_50]: {
            Label: $("#UpgradeName3"),
            DescriptionLabel: $("#Description3"),
            DescriptionContainer: $("#Upgrade3DescriptionContainer"),
            UpgradeButton: $("#Upgrade3")
        },
        [TalentTree.BRANCHES.LEFT_BRANCH_50]: {
            Label: $("#UpgradeName4"),
            DescriptionLabel: $("#Description4"),
            DescriptionContainer: $("#Upgrade4DescriptionContainer"),
            UpgradeButton: $("#Upgrade4")
        },
        [TalentTree.BRANCHES.RIGHT_BRANCH_75]: {
            Label: $("#UpgradeName5"),
            DescriptionLabel: $("#Description5"),
            DescriptionContainer: $("#Upgrade5DescriptionContainer"),
            UpgradeButton: $("#Upgrade5")
        },
        [TalentTree.BRANCHES.LEFT_BRANCH_75]: {
            Label: $("#UpgradeName6"),
            DescriptionLabel: $("#Description6"),
            DescriptionContainer: $("#Upgrade6DescriptionContainer"),
            UpgradeButton: $("#Upgrade6")
        },
        [TalentTree.BRANCHES.RIGHT_BRANCH_100]: {
            Label: $("#UpgradeName7"),
            DescriptionLabel: $("#Description7"),
            DescriptionContainer: $("#Upgrade7DescriptionContainer"),
            UpgradeButton: $("#Upgrade7")
        },
        [TalentTree.BRANCHES.LEFT_BRANCH_100]: {
            Label: $("#UpgradeName8"),
            DescriptionLabel: $("#Description8"),
            DescriptionContainer: $("#Upgrade8DescriptionContainer"),
            UpgradeButton: $("#Upgrade8")
        }
    },
    BranchesPairs: {
        1: {
            Content: {
                1: TalentTree.BRANCHES.LEFT_BRANCH_25,
                2: TalentTree.BRANCHES.RIGHT_BRANCH_25
            },
            Head: $("#UpgradeOption1")
        },
        2: {
            Content: {
                1: TalentTree.BRANCHES.LEFT_BRANCH_50,
                2: TalentTree.BRANCHES.RIGHT_BRANCH_50
            },
            Head: $("#UpgradeOption2")
        },
        3: {
            Content: {
                1: TalentTree.BRANCHES.LEFT_BRANCH_75,
                2: TalentTree.BRANCHES.RIGHT_BRANCH_75
            },
            Head: $("#UpgradeOption3")
        },
        4: {
            Content: {
                1: TalentTree.BRANCHES.LEFT_BRANCH_100,
                2: TalentTree.BRANCHES.RIGHT_BRANCH_100
            },
            Head: $("#UpgradeOption4")
        }
    },
    BottomBranches: {
        // Populated in runtime
    }
};

function OnTalentBranchButtonPressed(branchName) {
    let branchId = TalentTree.ConvertBranchNameToEnumValue(branchName);
    let selectedUnit = Selection.GetLocalPlayerSelectedUnit();
    if (TalentTree.IsHeroCanLearnTalent(selectedUnit, branchId) == false) {
        return;
    }
    GameEvents.SendCustomGameEventToServer("talent_tree_level_up_talent", {
        talentIndex: branchId
    });
    Game.EmitSound("Item.PickUpGemShop");
}

function OnLocalPlayerSelectedUnit() {
    let selectedUnit = Selection.GetLocalPlayerSelectedUnit();
    if (Entities.IsHero(selectedUnit) == false) {
        return;
    }
    for (const [branchEnumValue, _] of Object.entries(TALENT_TREE_WINDOW_DATA["Branches"])) {
        var branch = TALENT_TREE_WINDOW_DATA["Branches"][branchEnumValue];

        var talentName = TalentTree.GetTalentNameForHero(selectedUnit, branchEnumValue);
        GameUI.SetupDOTATalentNameLabel(branch["Label"], talentName);

        var isHasDescription = TalentTree.IsTalentOfHeroHasDescription(selectedUnit, branchEnumValue);
        if (isHasDescription) {
            TalentTree.SetupTalentDescriptionLabel(selectedUnit, branchEnumValue, branch["DescriptionLabel"]);
        }
        branch["DescriptionContainer"].SetHasClass("HasDescription", isHasDescription);

        let isHeroCanLearnTalent = TalentTree.IsHeroCanLearnTalent(selectedUnit, branchEnumValue);
        let isHeroHaveTalent = TalentTree.IsHeroHaveTalent(selectedUnit, branchEnumValue);

        if (isHeroHaveTalent) {
            branch["UpgradeButton"].SetHasClass("Activated", true);
            branch["UpgradeButton"].SetHasClass("Disabled", true);
            branch["UpgradeButton"].SetHasClass("BranchChosen", true);
        } else {
            if (isHeroCanLearnTalent) {
                branch["UpgradeButton"].SetHasClass("Activated", true);
                branch["UpgradeButton"].SetHasClass("Disabled", false);
                branch["UpgradeButton"].SetHasClass("BranchChosen", true);
            } else {
                branch["UpgradeButton"].SetHasClass("Activated", false);
                branch["UpgradeButton"].SetHasClass("Disabled", true);
                branch["UpgradeButton"].SetHasClass("BranchChosen", false);
            }
        }
    }

    for (const [_, branchPair] of Object.entries(TALENT_TREE_WINDOW_DATA["BranchesPairs"])) {
        let isAnyBranchCanBeLearned = false;
        let branchActive = {
            1: false,
            2: false
        };
        let totalTalentsLearned = 0;
        for (const [branchIndex, branchId] of Object.entries(branchPair["Content"])) {
            let isHeroCanLearnTalent = TalentTree.IsHeroCanLearnTalent(selectedUnit, branchId);
            if (isHeroCanLearnTalent) {
                isAnyBranchCanBeLearned = true;
            }
            if (TalentTree.IsHeroHaveTalent(selectedUnit, branchId)) {
                totalTalentsLearned = totalTalentsLearned + 1;
            }
            branchActive[branchIndex] = isHeroCanLearnTalent;
        }
        isAnyBranchCanBeLearned = isAnyBranchCanBeLearned && totalTalentsLearned == 0;
        branchPair["Head"].SetHasClass("BranchActive", isAnyBranchCanBeLearned);
        branchPair["Head"].SetHasClass("LeftBranchActive", branchActive[1] && isAnyBranchCanBeLearned);
        branchPair["Head"].SetHasClass("RightBranchActive", branchActive[2] && isAnyBranchCanBeLearned);
    }
    UpdateBottomBranches(selectedUnit);
}

function UpdateBottomBranches(selectedUnit) {
    for (const [branchId, data] of Object.entries(TALENT_TREE_WINDOW_DATA["BottomBranches"])) {
        let abilityName = data["AbilityName"];
        let branchAbility = Entities.GetAbilityByName(selectedUnit, abilityName);
        if (branchAbility > -1) {
            let levelsContainer = data["LevelsContainer"];
            let maxLevel = Abilities.GetMaxLevel(branchAbility);
            let createdLevel = levelsContainer.GetChildCount();
            let levelsDiff = Math.abs(maxLevel - createdLevel);
            if (levelsDiff > 0) {
                for (var i = 0; i < levelsDiff; i++) {
                    let panel = $.CreatePanel("Panel", levelsContainer, "");
                    panel.BLoadLayoutSnippet("BottomBranchLevelPanel");
                }
            }
            let currentLevel = Abilities.GetLevel(branchAbility);
            for (var i = 0; i < maxLevel; i++) {
                let panel = levelsContainer.GetChild(i);
                if (panel != null) {
                    panel.SetHasClass("active_level", i < currentLevel);
                    panel.SetHasClass("next_level", i == currentLevel);
                }
            }
            let isCanBeUpgraded =
                Abilities.CanAbilityBeUpgraded(branchAbility) == AbilityLearnResult_t.ABILITY_CAN_BE_UPGRADED &&
                Entities.GetAbilityPoints(selectedUnit) > 0;
            let branchContainer = data["Container"];
            let isMaxLevelReached = currentLevel == maxLevel;

            branchContainer.SetHasClass("TalentBranchActive", isMaxLevelReached);
            branchContainer.SetHasClass("StatBranchComplete", isMaxLevelReached);
            branchContainer.SetHasClass("StatBranchActive", isCanBeUpgraded && !isMaxLevelReached);
            branchContainer.SetHasClass("could_level_up", isCanBeUpgraded && !isMaxLevelReached);
        }
    }
}

function PopulateBottomBranches() {
    TALENT_TREE_WINDOW_DATA["BottomBranches"][TalentTree.BRANCHES.BOTTOM_BRANCH] = {
        AbilityName: GameSettings.GetSettingValueAsString("hero_bonus_attributes_talent"),
        Container: $("#UpgradeStat"),
        LevelsContainer: $("#UpgradeStatLevelContainer"),
        HeaderLabel: $("#UpgradeStatName")
    };

    for (const [_, data] of Object.entries(TALENT_TREE_WINDOW_DATA["BottomBranches"])) {
        let levelsContainer = data["LevelsContainer"];
        levelsContainer.RemoveAndDeleteChildren();
        let headerLabel = data["HeaderLabel"];
        let abilityName = data["AbilityName"];
        headerLabel.text = $.Localize("#DOTA_Tooltip_ability_" + abilityName);
    }
}

function SetupTalentRowsLevels() {
    $("#TalentRow1Label").text = GameSettings.GetSettingValueAsNumber("hero_talents_row_1");
    $("#TalentRow2Label").text = GameSettings.GetSettingValueAsNumber("hero_talents_row_2");
    $("#TalentRow3Label").text = GameSettings.GetSettingValueAsNumber("hero_talents_row_3");
    $("#TalentRow4Label").text = GameSettings.GetSettingValueAsNumber("hero_talents_row_4");
}

(function () {
    GameEvents.Subscribe("dota_player_update_selected_unit", OnLocalPlayerSelectedUnit);
    GameEvents.Subscribe("dota_player_update_query_unit", OnLocalPlayerSelectedUnit);

    TalentTree.SetTalentTreeWindow($("#DOTAStatBranch"));

    TalentTree.ListenToLocalPlayerTalentTreeChangedEvent(OnLocalPlayerSelectedUnit);

    GameSettings.ListenToGameSettingsLoadedEvent(function () {
        PopulateBottomBranches();
        SetupTalentRowsLevels();
    });
})();
