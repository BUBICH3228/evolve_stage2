/* eslint-disable @typescript-eslint/no-unused-vars */

import { HeroesData } from "../common/data/heroes_data";

// eslint-disable-next-line no-var
var HudButtons = GameUI.CustomUIConfig().HudButtons;
// eslint-disable-next-line no-var
var Constants = GameUI.CustomUIConfig().Constants;
// eslint-disable-next-line no-var
var Utils = GameUI.CustomUIConfig().Utils;
// eslint-disable-next-line no-var
class CustomAbility {
    playerID = Game.GetLocalPlayerID();
    MAIN_PANEL = $("#MainPanel");
    ABILITY_CONTAINER = $("#AbilityContainerPanel");
    ABILITY_CONTAINER_DATA: {
        abilityLevelPanel: CircularProgressBar[];
        abilityCooldownPanel: CircularProgressBar[];
        abilityCooldownLabel: LabelPanel[];
        abilityChargesPanel: CircularProgressBar[];
        abilityChargesLabel: LabelPanel[];
    } = {
        abilityLevelPanel: [],
        abilityCooldownPanel: [],
        abilityCooldownLabel: [],
        abilityChargesPanel: [],
        abilityChargesLabel: []
    };
    COUNT_ABILITY = Players.GetTeam(this.playerID) == DotaTeam.BADGUYS ? 5 : 5;
    constructor() {
        GameEvents.Subscribe("change_hero", () => {
            $.Schedule(1, () => {
                this.CreateAbilities();
            });
        });
        this.CreateAbilities();
        this.UpdateAbilitylevel();
    }

    private CreateAbilities() {
        const Player = Players.GetLocalPlayerPortraitUnit();
        if (!Entities.IsHero(Player)) {
            $.Schedule(0.5, () => {
                this.CreateAbilities();
            });
            return;
        }
        this.playerID = Entities.GetPlayerOwnerID(Player);
        if (this.ABILITY_CONTAINER.BHasClass("Hidden")) this.ABILITY_CONTAINER.SetHasClass("Hidden", false);
        this.ABILITY_CONTAINER.RemoveAndDeleteChildren();
        this.ABILITY_CONTAINER_DATA.abilityCooldownPanel = [];
        this.ABILITY_CONTAINER_DATA.abilityChargesPanel = [];
        this.ABILITY_CONTAINER_DATA.abilityChargesLabel = [];
        this.ABILITY_CONTAINER_DATA.abilityLevelPanel = [];
        this.ABILITY_CONTAINER_DATA.abilityCooldownLabel = [];
        for (let index = 0; index < this.COUNT_ABILITY; index++) {
            const AbilityEntityIndex = Entities.GetAbility(Players.GetPlayerHeroEntityIndex(this.playerID), index);
            const abilityName = Abilities.GetAbilityName(AbilityEntityIndex);
            const panel = $.CreatePanel("Panel", this.ABILITY_CONTAINER, "AbilityPanel");
            $.CreatePanel("Panel", panel, "NotLevel");
            const ability = $.CreatePanel("DOTAAbilityImage", panel, "Ability");
            ability.AddClass(this.FindHeroClass(Players.GetPlayerSelectedHero(this.playerID)));
            ability.abilityname = abilityName;
            panel.SetPanelEvent("onactivate", () => {
                if (GameUI.IsAltDown() == true) {
                    Abilities.PingAbility(AbilityEntityIndex);
                } else {
                    Abilities.ExecuteAbility(AbilityEntityIndex, Game.GetLocalPlayerInfo().player_selected_hero_entity_index, false);
                }
            });

            panel.SetPanelEvent("onmouseover", () => {
                $.DispatchEvent("DOTAShowAbilityTooltipForLevel", panel, ability.abilityname, Abilities.GetLevel(AbilityEntityIndex));
            });
            panel.SetPanelEvent("onmouseout", () => {
                $.DispatchEvent("DOTAHideAbilityTooltip");
                $.DispatchEvent("DOTAHideTextTooltip");
            });
            this.ABILITY_CONTAINER_DATA.abilityLevelPanel.push($.CreatePanel("CircularProgressBar", panel, "AbilityLevel"));
            this.ABILITY_CONTAINER_DATA.abilityCooldownPanel.push($.CreatePanel("CircularProgressBar", panel, "AbilityCooldown"));
            this.ABILITY_CONTAINER_DATA.abilityCooldownLabel.push($.CreatePanel("Label", panel, "AbilityCooldownLabel"));
            this.ABILITY_CONTAINER_DATA.abilityChargesPanel.push($.CreatePanel("CircularProgressBar", panel, "AbilityCharges"));
            this.ABILITY_CONTAINER_DATA.abilityChargesLabel.push($.CreatePanel("Label", panel, "AbilityChargesLabel"));
            const keyBind = $.CreatePanel("Panel", panel, "KeyBindPanel");
            const keyBindText = $.CreatePanel("Label", keyBind, "KeyBindPanelLabel");
            keyBindText.text = Abilities.GetKeybind(AbilityEntityIndex);
        }

        if (Players.GetTeam(this.playerID) == DotaTeam.BADGUYS) {
            this.ABILITY_CONTAINER.SetHasClass("MonsterClass", true);
            this.ABILITY_CONTAINER.SetHasClass("HunterClass", false);
        } else if (Players.GetTeam(this.playerID) == DotaTeam.GOODGUYS) {
            this.ABILITY_CONTAINER.SetHasClass("MonsterClass", false);
            this.ABILITY_CONTAINER.SetHasClass("HunterClass", true);
        }
    }

    private UpdateAbilitylevel() {
        const Player = Players.GetLocalPlayerPortraitUnit();
        if (!Entities.IsHero(Player)) {
            $.Schedule(0.5, () => {
                this.UpdateAbilitylevel();
            });
            return;
        }
        const playerID = Entities.GetPlayerOwnerID(Player);
        if (playerID != this.playerID && Players.GetTeam(this.playerID) == Players.GetTeam(playerID)) {
            this.CreateAbilities();
        }
        if (
            this.ABILITY_CONTAINER_DATA.abilityLevelPanel.length +
                this.ABILITY_CONTAINER_DATA.abilityCooldownPanel.length +
                this.ABILITY_CONTAINER_DATA.abilityCooldownLabel.length >=
            12
        ) {
            for (let index = 0; index < this.COUNT_ABILITY; index++) {
                const ability = Entities.GetAbility(Players.GetPlayerHeroEntityIndex(this.playerID), index);
                const abilityLevelPanel = this.ABILITY_CONTAINER_DATA.abilityLevelPanel[index];
                if (abilityLevelPanel == null) {
                    break;
                }
                abilityLevelPanel.max = Abilities.GetMaxLevel(ability);
                abilityLevelPanel.min = 0;
                abilityLevelPanel.value = Abilities.GetLevel(ability);
                const abilityCooldownPanel = this.ABILITY_CONTAINER_DATA.abilityCooldownPanel[index];
                const abilityChargesPanel = this.ABILITY_CONTAINER_DATA.abilityChargesPanel[index];
                const abilityChargesLabel = this.ABILITY_CONTAINER_DATA.abilityChargesLabel[index];

                if (abilityCooldownPanel == null) {
                    break;
                }
                const isChargeAbility = Abilities.GetSpecialValueFor(ability, "AbilityCharges") > 0;

                abilityChargesPanel.min = 0;
                abilityCooldownPanel.min = 0;

                if (isChargeAbility == true) {
                    abilityChargesLabel.text = String(Abilities.GetCurrentAbilityCharges(ability));

                    abilityChargesPanel.max = Abilities.GetSpecialValueFor(ability, "AbilityChargeRestoreTime");
                    abilityChargesPanel.value = Math.min(
                        abilityChargesPanel.max - Abilities.GetAbilityChargeRestoreTimeRemaining(ability),
                        abilityChargesPanel.max
                    );

                    abilityCooldownPanel.max = Abilities.GetSpecialValueFor(ability, "AbilityChargeRestoreTime");
                    abilityCooldownPanel.value = Abilities.GetAbilityChargeRestoreTimeRemaining(ability);
                } else {
                    abilityCooldownPanel.max = Abilities.GetCooldown(ability);
                    abilityCooldownPanel.value = Abilities.GetCooldownTimeRemaining(ability);
                }

                const abilityCooldownLabel = this.ABILITY_CONTAINER_DATA.abilityCooldownLabel[index];
                if (abilityCooldownLabel == null) {
                    break;
                }

                if (isChargeAbility == true) {
                    (abilityCooldownPanel as never as Panel).SetHasClass(
                        "Hidden",
                        Abilities.GetCurrentAbilityCharges(ability) > 0 ? true : false
                    );
                    abilityCooldownLabel.SetHasClass("Hidden", Abilities.GetCurrentAbilityCharges(ability) > 0 ? true : false);
                } else {
                    abilityChargesLabel.SetHasClass("Hidden", true);
                    (abilityChargesPanel as never as Panel).SetHasClass("Hidden", true);
                    abilityCooldownLabel.SetHasClass("Hidden", abilityCooldownPanel.value == 0 ? true : false);
                }

                abilityCooldownLabel.text =
                    "" +
                    Math.ceil(
                        isChargeAbility == true
                            ? Abilities.GetAbilityChargeRestoreTimeRemaining(ability)
                            : Abilities.GetCooldownTimeRemaining(ability)
                    );

                const panel = this.ABILITY_CONTAINER.GetChild(index);
                if (panel) {
                    const NotLevelPanel = panel.FindChildTraverse("NotLevel");
                    if (NotLevelPanel) {
                        if (abilityLevelPanel.value == 0) {
                            NotLevelPanel.SetHasClass("Hidden", false);
                        } else {
                            NotLevelPanel.SetHasClass("Hidden", true);
                        }
                    }
                }
            }
        }

        $.Schedule(0.1, () => {
            this.UpdateAbilitylevel();
        });
    }

    private FindHeroClass(heroName: string): string {
        const classes = Object.keys(HeroesData) as (keyof typeof HeroesData)[];

        for (const className of classes) {
            const heroesInClass = HeroesData[className];

            if (heroName in heroesInClass) {
                return String(className);
            }
        }

        return "";
    }
}

new CustomAbility();
