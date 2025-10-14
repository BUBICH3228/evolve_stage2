import { HeroesData } from "../common/data/heroes_data";
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */
const Utils = GameUI.CustomUIConfig().Utils;
// eslint-disable-next-line no-var
export class MonsterUpgradeAbilities {
    MAIN_PANEL = $("#MainPanel");
    POINTS_PANEL = $("#CountPointsLable");
    HERO_ABILITY_PANEL = $("#HeroAbilityPanel");
    TIME = $("#Time");
    constructor() {
        //$.Schedule(1, () => {
        //    this.ShowAndHideMonsterAbilityUpgradePanel();
        //    this.Timer(14);
        //});
    }

    private Timer(time: number) {
        this.TIME.text = $.Localize("#monster_upgrade_abilities_time_left") + Utils.FormatTime(Math.abs(time));
        if (time <= 0) {
            this.ShowAndHideMonsterAbilityUpgradePanel();
        } else {
            $.Schedule(1, () => {
                this.Timer(time - 1);
            });
        }
    }

    private ShowAndHideMonsterAbilityUpgradePanel() {
        this.MAIN_PANEL.SetHasClass("Collapse", !this.MAIN_PANEL.BHasClass("Collapse"));
        if (this.MAIN_PANEL.BHasClass("Collapse") == false) {
            this.CreateOrUpadeMonsterAbilityUpgradePanel();
        }
    }

    private CreateOrUpadeMonsterAbilityUpgradePanel() {
        this.HERO_ABILITY_PANEL.RemoveAndDeleteChildren();
        const abilities = HeroesData["monster"][Players.GetPlayerSelectedHero(Game.GetLocalPlayerID())].abilities;
        delete abilities[4];
        this.POINTS_PANEL.SetDialogVariable(
            "value",
            String(Entities.GetAbilityPoints(Players.GetPlayerHeroEntityIndex(Game.GetLocalPlayerID())))
        );
        for (const [_, value] of Object.entries(abilities)) {
            const container = $.CreatePanel("Panel", this.HERO_ABILITY_PANEL, "AbilityContainer");
            const ability = Entities.GetAbilityByName(Players.GetPlayerHeroEntityIndex(Game.GetLocalPlayerID()), value.abilityName);

            const moveContainer = $.CreatePanel("Panel", container, "MoveContainer");
            const moviePanel = $.CreatePanel("Movie", moveContainer, "MovePanel", {
                class: "hero_portrait_hover",
                src: value.abilityPreview,
                repeat: "true",
                hittest: "false",
                autoplay: "onload"
            });
            moviePanel.AddClass("MoveDriver");
            moviePanel.style.width = "1000px";
            moviePanel.style.height = "600px";
            moviePanel.style.align = "center center";

            const button = $.CreatePanel("Panel", container, "AbilityButton");
            const panel = $.CreatePanel("DOTAAbilityImage", button, "AbilityImage");
            panel.abilityname = value.abilityName;
            button.SetPanelEvent("onmouseover", () => {
                $.DispatchEvent("DOTAShowAbilityTooltip", panel, panel.abilityname);
            });
            button.SetPanelEvent("onmouseout", () => {
                $.DispatchEvent("DOTAHideAbilityTooltip");
                $.DispatchEvent("DOTAHideTextTooltip");
            });
            const learnButton = $.CreatePanel("Panel", container, "LearnButton");
            container.SetPanelEvent("onactivate", () => {
                this.LearnAbility(ability, learnButton);
            });
            this.CreateLearnButton(learnButton, ability);
        }
    }

    private CreateLearnButton(learnButton: Panel, ability: AbilityEntityIndex) {
        learnButton.RemoveAndDeleteChildren();
        this.POINTS_PANEL.SetDialogVariable(
            "value",
            String(Entities.GetAbilityPoints(Players.GetPlayerHeroEntityIndex(Game.GetLocalPlayerID())))
        );
        const currentLevel = Abilities.GetLevel(ability);
        const maxLevel = Abilities.GetMaxLevel(ability);
        const labelLearnButton = $.CreatePanel("Label", learnButton, "LabelLearnButton");
        labelLearnButton.text = $.Localize("#monster_upgrade_abilities_label_button_" + (currentLevel == maxLevel ? "learned" : "learn"));
        const abilityPointsContainer = $.CreatePanel("Panel", learnButton, "AbilityPointsContainer");

        for (let index = 0; index < maxLevel; index++) {
            const panel = $.CreatePanel("Panel", abilityPointsContainer, "AbilityPointsPanel");
            if (index < currentLevel) {
                panel.SetHasClass("Learned", true);
                panel.AddClass("Level" + (index + 1));
            } else {
                panel.SetHasClass("UnLearned", true);
            }
            panel.style.marginLeft = 40 * index + "px";
        }
    }

    private LearnAbility(ability: AbilityEntityIndex, learnButton: Panel) {
        if (Abilities.AttemptToUpgrade(ability) == true) {
            $.Schedule(0.1, () => {
                this.CreateLearnButton(learnButton, ability);
            });
        }
    }
}

new MonsterUpgradeAbilities();
