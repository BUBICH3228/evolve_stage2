import { HeroesData, StatsData, AboutHeroData, AbilitiesData } from "../common/data/heroes_data";
// eslint-disable-next-line no-var
var HudButtons = GameUI.CustomUIConfig().HudButtons;
// eslint-disable-next-line no-var
var Constants = GameUI.CustomUIConfig().Constants;
class HeroSelection {
    OLD_HERO_NAME = "";
    MAIN_PANEL = $("#MainPanel");
    MOVE_PANEL = $("#MovePanel");
    HERO_MODEL_PANEL = $("#HeroModelPanel");
    HERO_ABILITY_PANEL = $("#HeroAbilityPanel");
    HERO_PICKER_PANEL = $("#HeroPickerPanel");
    HERO_STATS_PANEL = $("#HeroStatsPanel");
    HERO_PIKER_PANEL_DATA = [
        {
            class: "trapper",
            panel: $("#TrapperClassTitleText")
        },
        {
            class: "assault",
            panel: $("#AssaultClassTitleText")
        },
        {
            class: "support",
            panel: $("#SupportClassTitleText")
        },
        {
            class: "medic",
            panel: $("#MedicClassTitleText")
        },
        {
            class: "monster",
            panel: $("#MonsterClassTitleText")
        }
    ];
    HERO_INFO_TABS_BUTTON_DATA = [
        {
            class: "stats",
            panel: $("#HeroStats")
        },
        {
            class: "aboutHero",
            panel: $("#HeroDescription")
        }
    ];

    constructor() {
        GameEvents.Subscribe("show_hero_selection_menu", (data) => {
            this.MAIN_PANEL.SetHasClass("Hidden", data.visibleState == 0);
            this.SetupHeroesClassButton();
        });
    }

    private SetupHeroesClassButton() {
        this.HERO_PIKER_PANEL_DATA.forEach((data) => {
            data.panel.ClearPanelEvent("onactivate");
            data.panel.SetPanelEvent("onactivate", () => {
                this.HERO_PICKER_PANEL.RemoveAndDeleteChildren();
                for (const [heroName, value] of Object.entries(HeroesData[data.class])) {
                    this.IlluminateClassSelectionPanel(data.panel);
                    const panel = $.CreatePanel("DOTAHeroImage", this.HERO_PICKER_PANEL, "HeroImage");
                    panel.heroname = heroName;
                    panel.heroimagestyle = "portrait";
                    this.SetupHeroSelectionButton(heroName);
                    panel.SetPanelEvent("onactivate", () => {
                        this.SetupHeroImageButton(heroName, value.abilities, value.stats, value.aboutHero);
                        Game.EmitSound("Item.PickUpGemShop");
                    });
                }
                Game.EmitSound("Item.PickUpGemShop");
            });
        });

        let index = 0;

        if (Players.GetTeam(Game.GetLocalPlayerID()) == DotaTeam.BADGUYS) {
            index = 4;
            $("#TitelHuntersClassPanel").SetHasClass("Hidden", true);
            $("#TitelMonsterClassPanel").SetHasClass("Hidden", false);
        }

        for (const [heroName, value] of Object.entries(HeroesData[this.HERO_PIKER_PANEL_DATA[index].class])) {
            const panel = $.CreatePanel("DOTAHeroImage", this.HERO_PICKER_PANEL, "HeroImage");
            panel.heroname = heroName;
            panel.heroimagestyle = "portrait";
            this.SetupHeroImageButton(heroName, value.abilities, value.stats, value.aboutHero);
            this.CreateStatsPanel(value.stats);
            this.SetupHeroSelectionButton(heroName);
        }
    }

    private SetupHeroImageButton(heroName: string, abilities: AbilitiesData, stats: StatsData, aboutHero: AboutHeroData) {
        this.CreteScenePanel(heroName);
        this.CreteAbilityPanel(abilities);
        this.CreateAbilityPreview(abilities[0].abilityPreview);
        this.HERO_INFO_TABS_BUTTON_DATA.forEach((data) => {
            data.panel.SetPanelEvent("onactivate", () => {
                if (data.class == "stats") {
                    $("#HeroStats").SetHasClass("Glow", true);
                    $("#HeroDescription").SetHasClass("Glow", false);
                    this.CreateStatsPanel(stats);
                } else if (data.class == "aboutHero") {
                    $("#HeroStats").SetHasClass("Glow", false);
                    $("#HeroDescription").SetHasClass("Glow", true);
                    this.CreateHeroeAboutPanel(aboutHero);
                }
                Game.EmitSound("Item.PickUpGemShop");
            });
        });
    }

    private SetupHeroSelectionButton(heroName: string) {
        const panel = $.CreatePanel("Panel", $("#HeroStatisticsContainer"), "HeroSelectionButton");
        panel.BLoadLayoutSnippet("HeroSelectionButtonSnippet");
        HudButtons.SetButton(Constants.HUD_BUTTONS.HERO_SELECTED, panel);
        panel.SetPanelEvent("onactivate", () => {
            GameEvents.SendCustomGameEventToServer("hero_selection_event", { HeroName: heroName, PlayerID: Game.GetLocalPlayerID() });
            this.MAIN_PANEL.SetHasClass("Hidden", true);
            HudButtons.FireButtonClickedEvent(Constants.HUD_BUTTONS.HERO_SELECTED);
        });
    }

    private CreteAbilityPanel(abilities: AbilitiesData) {
        this.HERO_ABILITY_PANEL.RemoveAndDeleteChildren();

        for (const [_, value] of Object.entries(abilities)) {
            $.Msg(value);
            const button = $.CreatePanel("Panel", this.HERO_ABILITY_PANEL, "AbilityButton");
            const panel = $.CreatePanel("DOTAAbilityImage", button, "AbilityImage");
            panel.abilityname = value.abilityName;
            button.SetPanelEvent("onactivate", () => {
                this.CreateAbilityPreview(value.abilityPreview);
            });
            button.SetPanelEvent("onmouseover", () => {
                $.DispatchEvent("DOTAShowAbilityTooltip", panel, panel.abilityname);
            });
            button.SetPanelEvent("onmouseout", () => {
                $.DispatchEvent("DOTAHideAbilityTooltip");
                $.DispatchEvent("DOTAHideTextTooltip");
            });
        }
    }

    private CreateAbilityPreview(abilityPreview: string) {
        this.MOVE_PANEL.RemoveAndDeleteChildren();
        const panel = $.CreatePanel("Movie", this.MOVE_PANEL, "", {
            class: "hero_portrait_hover",
            src: abilityPreview,
            repeat: "true",
            hittest: "false",
            autoplay: "onload"
        });

        panel.style.width = "412px";
        panel.style.height = "294px";
        panel.style.align = "center center";
    }

    private CreateStatsPanel(stats: StatsData) {
        $("#DerivedStatsContainer").RemoveAndDeleteChildren();
        $("#HeroStatsPanel").SetHasClass("Hidden", false);
        $("#DerivedStatsContainer").SetHasClass("Hidden", false);
        $("#HeroDescriptionPanel").SetHasClass("Hidden", true);
        for (const [key, value] of Object.entries(stats)) {
            const panel = this.HERO_STATS_PANEL.FindChildTraverse(key + "Label");
            if (panel) {
                panel.text = String(value);
            } else {
                const panel = $.CreatePanel("Panel", $("#DerivedStatsContainer"), "DerivedStat");
                panel.BLoadLayoutSnippet("DerivedStatSnippet");

                const iconPanel = panel.FindChildTraverse("HeroStatIcon") as Panel;
                const attributeNumbers = panel.FindChildTraverse("AttributeNumbers") as LabelPanel;
                attributeNumbers.text = String(value);
                iconPanel.style.backgroundImage = "url('s2r://panorama/images/hud/reborn/icon_" + key + "_psd.vtex')";
            }
        }
    }

    private CreateHeroeAboutPanel(aboutHero: AboutHeroData) {
        $("#HeroStatsPanel").SetHasClass("Hidden", true);
        $("#DerivedStatsContainer").SetHasClass("Hidden", true);
        $("#HeroDescriptionPanel").SetHasClass("Hidden", false);

        $("#HeroPersonality").text = $.Localize(aboutHero.personality);
    }

    private IlluminateClassSelectionPanel(panel: Panel) {
        this.HERO_PIKER_PANEL_DATA.forEach((data) => {
            if (data.panel != panel) {
                data.panel.SetHasClass("Glow", false);
            } else {
                data.panel.SetHasClass("Glow", true);
            }
        });
    }

    private CreteScenePanel(HeroName: string) {
        if (this.OLD_HERO_NAME != HeroName) {
            this.OLD_HERO_NAME = HeroName;
            if (this.HERO_MODEL_PANEL.FindChildTraverse("HeroModel") != undefined) {
                (this.HERO_MODEL_PANEL.FindChildTraverse("HeroModel") as Panel).DeleteAsync(0);
            }
            (this.HERO_MODEL_PANEL.FindChildTraverse("HeroName") as Panel).text = $.Localize("#" + HeroName);
            $.CreatePanel("DOTAScenePanel", this.HERO_MODEL_PANEL, "HeroModel", {
                unit: HeroName,
                particleonly: "false",
                yawmin: "-90",
                yawmax: "90",
                camera: "default_camera",
                drawbackground: "false",
                rendershadows: "false",
                deferredalpha: "false",
                rotateonmousemove: "false",
                rotateonhover: "false"
            });
        }
    }
}

new HeroSelection();
