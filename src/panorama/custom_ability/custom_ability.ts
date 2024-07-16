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
    } = {
        abilityLevelPanel: [],
        abilityCooldownPanel: [],
        abilityCooldownLabel: []
    };
    KEY_BIND_DATA: string[] = ["q", "w", "e", "d"];
    constructor() {
        HudButtons.ListenToButtonClickedEvent(Constants.HUD_BUTTONS.HERO_SELECTED, () => {
            $.Schedule(0.5, () => {
                this.CreateAbilities();
            });
        });
        this.UpdateAbilitylevel();
    }

    private CreateAbilities() {
        this.ABILITY_CONTAINER.SetHasClass("Hidden", false);
        this.ABILITY_CONTAINER.RemoveAndDeleteChildren();
        this.ABILITY_CONTAINER_DATA.abilityCooldownPanel = [];
        this.ABILITY_CONTAINER_DATA.abilityLevelPanel = [];
        for (let index = 1; index < 5; index++) {
            const AbilityEntityIndex = Entities.GetAbility(Players.GetPlayerHeroEntityIndex(this.playerID), index);
            const abilityName = Abilities.GetAbilityName(AbilityEntityIndex);
            const panel = $.CreatePanel("Panel", this.ABILITY_CONTAINER, "AbilityPanel");
            $.CreatePanel("Panel", panel, "NotLevel");
            const ability = $.CreatePanel("DOTAAbilityImage", panel, "Ability");
            ability.abilityname = abilityName;
            panel.SetPanelEvent("onmouseover", () => {
                $.DispatchEvent("DOTAShowAbilityTooltip", panel, ability.abilityname);
            });
            panel.SetPanelEvent("onmouseout", () => {
                $.DispatchEvent("DOTAHideAbilityTooltip");
                $.DispatchEvent("DOTAHideTextTooltip");
            });
            this.ABILITY_CONTAINER_DATA.abilityLevelPanel.push($.CreatePanel("CircularProgressBar", panel, "AbilityLevel"));
            this.ABILITY_CONTAINER_DATA.abilityCooldownPanel.push($.CreatePanel("CircularProgressBar", panel, "AbilityCooldown"));
            this.ABILITY_CONTAINER_DATA.abilityCooldownLabel.push($.CreatePanel("Label", panel, "AbilityCooldownLabel"));
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
        if (this.ABILITY_CONTAINER_DATA.abilityLevelPanel.length >= 4) {
            for (let index = 1; index < 5; index++) {
                const ability = Entities.GetAbility(Players.GetPlayerHeroEntityIndex(this.playerID), index);
                const abilityLevelPanel = this.ABILITY_CONTAINER_DATA.abilityLevelPanel[index - 1];
                abilityLevelPanel.max = 3;
                abilityLevelPanel.min = 0;
                abilityLevelPanel.value = Abilities.GetLevel(ability);
                const abilityCooldownPanel = this.ABILITY_CONTAINER_DATA.abilityCooldownPanel[index - 1];
                abilityCooldownPanel.min = 0;
                abilityCooldownPanel.max = Abilities.GetCooldown(ability);
                abilityCooldownPanel.value = Abilities.GetCooldownTimeRemaining(ability);
                const abilityCooldownLabel = this.ABILITY_CONTAINER_DATA.abilityCooldownLabel[index - 1];
                if (abilityCooldownPanel.value == 0) {
                    abilityCooldownLabel.SetHasClass("Hidden", true);
                } else {
                    abilityCooldownLabel.SetHasClass("Hidden", false);
                }
                abilityCooldownLabel.text = String(Utils.Round(Abilities.GetCooldownTimeRemaining(ability)));
                const panel = this.ABILITY_CONTAINER.GetChild(index - 1);
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
}

new CustomAbility();
