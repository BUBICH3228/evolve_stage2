/* eslint-disable @typescript-eslint/no-unused-vars */
import { HeroesData, StatsData, AboutHeroData, AbilitiesData } from "../common/data/heroes_data";
// eslint-disable-next-line no-var
var DotaHUD = GameUI.CustomUIConfig().DotaHUD;
class HeroSelection {
    OLD_HERO_NAME = "";
    MAIN_PANEL = $("#MainPanel");
    MOVE_PANEL = $("#MovePanel");
    HERO_MODEL_PANEL = $("#HeroModelPanel");
    HERO_ABILITY_PANEL = $("#HeroAbilityPanel");
    HERO_STATS_PANEL = $("#HeroStatsPanel");
    HERO_SELECTION_BUTTON = $("#HeroSelectionButton");
    HEROES_TAKEN: string[] = [];
    HEROES_TAKEN_DATA: { heroName: string; PlayerID: PlayerID }[] = [];
    HERO_PIKER_PANEL_DATA = [
        {
            class: "trapper",
            title: $("#TrapperClassTitleText"),
            heroesPanel: $("#TrapperHeroPickerPanel")
        },
        {
            class: "assault",
            title: $("#AssaultClassTitleText"),
            heroesPanel: $("#AssaultHeroPickerPanel")
        },
        {
            class: "support",
            title: $("#SupportClassTitleText"),
            heroesPanel: $("#SupportHeroPickerPanel")
        },
        {
            class: "medic",
            title: $("#MedicClassTitleText"),
            heroesPanel: $("#MedicHeroPickerPanel")
        },
        {
            class: "monster",
            title: $("#MonsterClassTitleText"),
            heroesPanel: $("#MonsterHeroPickerPanel")
        }
    ];

    constructor() {
        this.SetupHeroesClassButton(true);
        this.FixUIDOTAInterface();

        GameEvents.Subscribe("hero_selection_client_event", (event) => {
            this.HEROES_TAKEN.push(event.HeroClass);
            this.HEROES_TAKEN_DATA.push({ heroName: event.HeroName, PlayerID: event.PlayerID as PlayerID });
            this.SetupHeroesClassButton(false);
        });
    }

    private FixUIDOTAInterface() {
        const hud = DotaHUD.Get();
        const ScreenContainer = hud.FindChildTraverse("ScreenContainer");
        if (ScreenContainer) {
            ScreenContainer.style.visibility = "collapse";
        }
        const PreMinimapContainer = hud.FindChildTraverse("PreMinimapContainer");
        if (PreMinimapContainer) {
            PreMinimapContainer.style.visibility = "collapse";
        }
        const BottomPanels = hud.FindChildTraverse("BottomPanels");
        if (BottomPanels) {
            BottomPanels.style.align = "right bottom";
            BottomPanels.style.padding = "10px";
            BottomPanels.style.width = "32%";
            BottomPanels.style.margin = "0";
        }
        const Chat = hud.FindChildTraverse("Chat");
        if (Chat) {
            Chat.style.width = "100%";
        }
        const Footer = hud.FindChildTraverse("Footer");
        if (Footer) {
            Footer.style.visibility = "collapse";
        }
        const FriendsAndFoes = hud.FindChildTraverse("FriendsAndFoes");
        if (FriendsAndFoes) {
            FriendsAndFoes.style.visibility = "collapse";
        }
        const DireTeamPlayers = hud.FindChildTraverse("DireTeamPlayers");
        if (DireTeamPlayers) {
            DireTeamPlayers.style.visibility = "collapse";
        }
        const RadiantTeamPlayers = hud.FindChildTraverse("RadiantTeamPlayers");
        if (RadiantTeamPlayers) {
            RadiantTeamPlayers.style.visibility = "collapse";
        }
    }

    private SetupHeroesClassButton(preLoad: boolean) {
        this.HERO_PIKER_PANEL_DATA.forEach((data) => {
            data.heroesPanel.RemoveAndDeleteChildren();
            for (const [heroName, value] of Object.entries(HeroesData[data.class])) {
                const heroImageContainer = $.CreatePanel("Panel", data.heroesPanel, "HeroImageContainer");
                const panel = $.CreatePanel("DOTAHeroImage", heroImageContainer, "HeroImage");
                panel.heroname = heroName;
                panel.heroimagestyle = "portrait";
                panel.SetPanelEvent("onactivate", () => {
                    this.SetupHeroImageButton(heroName, value.abilities, value.stats, value.aboutHero);
                    this.SetupHeroSelectionButton(heroName, data.class);
                    Game.EmitSound("Item.PickUpGemShop");
                });
                if (this.HEROES_TAKEN.includes(data.class)) {
                    panel.SetHasClass("Block", true);
                    const findData = this.HEROES_TAKEN_DATA.find((hero) => hero.heroName === heroName);
                    if (findData != undefined) {
                        if (findData.heroName == heroName) {
                            const avatar = $.CreatePanel("Panel", heroImageContainer, "PlayerInfoPanel");
                            avatar.BLoadLayoutSnippet("PlayerInfoSnippet");

                            const data = Game.GetPlayerInfo(findData.PlayerID);
                            (avatar.FindChildTraverse("Avatar") as AvatarImage).steamid = data.player_steamid;
                        }
                    }
                }
            }
            Game.EmitSound("Item.PickUpGemShop");
        });

        if (preLoad == false) {
            return;
        }

        let index = 0;

        if (Players.GetTeam(Game.GetLocalPlayerID()) == DotaTeam.BADGUYS) {
            index = 4;
            $("#HuntersClassPanel").SetHasClass("Collapse", true);
            $("#MonsterClassPanel").SetHasClass("Collapse", false);
        }

        const [heroName, value] = Object.entries(HeroesData[this.HERO_PIKER_PANEL_DATA[index].class])[0];
        this.SetupHeroSelectionButton(heroName, this.HERO_PIKER_PANEL_DATA[index].class);
        this.SetupHeroImageButton(heroName, value.abilities, value.stats, value.aboutHero);
        this.CreateStatsPanel(value.stats);
    }

    private SetupHeroImageButton(heroName: string, abilities: AbilitiesData, stats: StatsData, aboutHero: AboutHeroData) {
        this.CreteScenePanel(heroName);
        this.CreteAbilityPanel(abilities);
        this.CreateAbilityPreview(abilities[0].abilityPreview);
        this.CreateStatsPanel(stats);
        this.CreateHeroeAboutPanel(aboutHero);
    }

    private SetupHeroSelectionButton(heroName: string, HeroClass: string) {
        this.HERO_SELECTION_BUTTON.BLoadLayoutSnippet("HeroSelectionButtonSnippet");
        this.HERO_SELECTION_BUTTON.SetPanelEvent("onactivate", () => {
            if (!this.HEROES_TAKEN.includes(HeroClass)) {
                GameEvents.SendCustomGameEventToServer("hero_selection_event", { HeroName: heroName, PlayerID: Game.GetLocalPlayerID() });
                GameEvents.SendCustomGameEventToAllClients("hero_selection_client_event", {
                    HeroClass: HeroClass,
                    HeroName: heroName,
                    PlayerID: Game.GetLocalPlayerID()
                });
                //this.MAIN_PANEL.SetHasClass("Hidden", true);
            }
        });
    }

    private CreteAbilityPanel(abilities: AbilitiesData) {
        this.HERO_ABILITY_PANEL.RemoveAndDeleteChildren();
        for (const [_, value] of Object.entries(abilities)) {
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

        panel.style.width = "1000px";
        panel.style.height = "600px";
        panel.style.align = "center center";
    }

    private CreateStatsPanel(stats: StatsData) {
        $("#DerivedStatsContainer").RemoveAndDeleteChildren();
        for (const [key, value] of Object.entries(stats)) {
            const panel = this.HERO_STATS_PANEL.FindChildTraverse(key + "Label");
            if (panel) {
                panel.text = String(value).replace(/,/g, " / ");
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
        $("#HeroPersonality").text = $.Localize(aboutHero.personality);
    }

    private CreteScenePanel(HeroName: string) {
        if (this.OLD_HERO_NAME != HeroName) {
            this.OLD_HERO_NAME = HeroName;
            if ($("#HeroModelContainer").FindChildTraverse("HeroModel") != undefined) {
                ($("#HeroModelContainer").FindChildTraverse("HeroModel") as Panel).DeleteAsync(0);
            }
            (this.HERO_MODEL_PANEL.FindChildTraverse("HeroName") as Panel).text = $.Localize("#" + HeroName);
            $.CreatePanel("DOTAScenePanel", $("#HeroModelContainer"), "HeroModel", {
                unit: HeroName,
                particleonly: "false",
                yawmin: "-90",
                yawmax: "90",
                camera: "default_camera",
                drawbackground: "false",
                rendershadows: "true",
                deferredalpha: "false",
                rotateonmousemove: "false",
                rotateonhover: "false"
            });
        }
    }
}

new HeroSelection();
