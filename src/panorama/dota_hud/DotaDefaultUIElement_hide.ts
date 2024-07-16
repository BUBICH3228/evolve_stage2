// eslint-disable-next-line no-var
var DotaHUD = GameUI.CustomUIConfig().DotaHUD;

class DotaDefaultUIElement_hide {
    constructor() {
        this.HideDotaDefaultUIElement();
        this.HideDefaultDOTATopBarButtons();
        this.HideDefaultDOTAMinimap();
        this.HideDefaultDOTAGlyphScanContainer();
        this.HideDefaultDOTATalenBranch();
        this.HideDefaultDOTALowerHudElement();
    }

    private HideDotaDefaultUIElement() {
        GameUI.SetDefaultUIEnabled(DefaultUiElement.TOP_HEROES, false);
        GameUI.SetDefaultUIEnabled(DefaultUiElement.TOP_MENU_BUTTONS, false);
        GameUI.SetDefaultUIEnabled(DefaultUiElement.TOP_BAR_BACKGROUND, false);
        GameUI.SetDefaultUIEnabled(DefaultUiElement.INVENTORY_SHOP, false);
        GameUI.SetDefaultUIEnabled(DefaultUiElement.AGHANIMS_STATUS, false);
        GameUI.SetDefaultUIEnabled(DefaultUiElement.AGHANIMS_STATUS, false);
        GameUI.SetDefaultUIEnabled(DefaultUiElement.QUICK_STATS, false);
        GameUI.SetDefaultUIEnabled(DefaultUiElement.KILLCAM, false);
        GameUI.SetDefaultUIEnabled(DefaultUiElement.CUSTOMUI_BEHIND_HUD_ELEMENTS, true);
        GameUI.SetDefaultUIEnabled(DefaultUiElement.INVENTORY_ITEMS, false);
        GameUI.SetDefaultUIEnabled(DefaultUiElement.INVENTORY_PANEL, false);
    }

    private HideDefaultDOTATopBarButtons() {
        const hud = DotaHUD.Get();
        const buttonsContainer = hud.FindChildTraverse("MenuButtons");
        if (buttonsContainer) {
            buttonsContainer.style.visibility = "collapse";
        } else {
            $.Msg("Seems valve break HideDefaultDOTATopBarButtons");
        }
    }

    private HideDefaultDOTAMinimap() {
        const hud = DotaHUD.Get();
        const minimap = hud.FindChildTraverse("minimap_container");
        if (minimap) {
            minimap.style.visibility = "collapse";
        } else {
            $.Msg("Seems valve break HideDefaultDOTAMinimap");
        }
    }

    private HideDefaultDOTAGlyphScanContainer() {
        const hud = DotaHUD.Get();
        const glyphScanContainer = hud.FindChildTraverse("GlyphScanContainer");
        if (glyphScanContainer) {
            glyphScanContainer.style.visibility = "collapse";
        } else {
            $.Msg("Seems valve break HideDefaultDOTAGlyphScanContainer");
        }
    }

    private HideDefaultDOTATalenBranch() {
        const hud = DotaHUD.Get();
        const statBranchDrawer = hud.FindChildTraverse("StatBranchDrawer");
        if (statBranchDrawer) {
            statBranchDrawer.style.visibility = "collapse";
        } else {
            $.Msg("Seems valve break HideDefaultDOTATalenBranch");
        }

        const statBranch = hud.FindChildTraverse("StatBranch");
        if (statBranch) {
            statBranch.style.visibility = "collapse";
        } else {
            $.Msg("Seems valve break HideDefaultDOTATalenBranch");
        }

        const levelStatsFrame = hud.FindChildTraverse("level_stats_frame");
        if (levelStatsFrame) {
            levelStatsFrame.style.visibility = "collapse";
        } else {
            $.Msg("Seems valve break HideDefaultDOTATalenBranch");
        }
    }

    private HideDefaultDOTALowerHudElement() {
        const hud = DotaHUD.Get();
        const buffContainer = hud.FindChildTraverse("BuffContainer");
        if (buffContainer) {
            buffContainer.style.visibility = "collapse";
        }
        const portraitGroup = hud.FindChildTraverse("PortraitGroup");
        if (portraitGroup) {
            portraitGroup.style.visibility = "collapse";
        }
        const statsContainer = hud.FindChildTraverse("stats_container");
        if (statsContainer) {
            statsContainer.style.visibility = "collapse";
        }
        const unitname = hud.FindChildTraverse("unitname");
        if (unitname) {
            unitname.style.visibility = "collapse";
        }
        const healthMana = hud.FindChildTraverse("health_mana");
        if (healthMana) {
            healthMana.style.visibility = "collapse";
        }
        const HUDSkinAbilityContainerBG = hud.FindChildTraverse("HUDSkinAbilityContainerBG");
        if (HUDSkinAbilityContainerBG) {
            HUDSkinAbilityContainerBG.style.visibility = "collapse";
        }
        const centerBg = hud.FindChildTraverse("center_bg");
        if (centerBg) {
            centerBg.style.visibility = "collapse";
        }
        const HUDSkinPortrait = hud.FindChildTraverse("HUDSkinPortrait");
        if (HUDSkinPortrait) {
            HUDSkinPortrait.style.visibility = "collapse";
        }
        const unitbadge = hud.FindChildTraverse("unitbadge");
        if (unitbadge) {
            unitbadge.style.visibility = "collapse";
        }
        const inventoryCompositionLayerContainer = hud.FindChildTraverse("inventory_composition_layer_container");
        if (inventoryCompositionLayerContainer) {
            inventoryCompositionLayerContainer.style.visibility = "collapse";
        }
        const leftFlare = hud.FindChildTraverse("left_flare");
        if (leftFlare) {
            leftFlare.style.visibility = "collapse";
        }
        const AbilityInsetShadowLeft = hud.FindChildrenWithClassTraverse("AbilityInsetShadowLeft")[0];
        if (AbilityInsetShadowLeft) {
            AbilityInsetShadowLeft.style.visibility = "collapse";
        }
        const AbilityInsetShadowRight = hud.FindChildrenWithClassTraverse("AbilityInsetShadowRight")[0];
        if (AbilityInsetShadowRight) {
            AbilityInsetShadowRight.style.visibility = "collapse";
        }
        const xp = hud.FindChildTraverse("xp");
        if (xp) {
            xp.style.visibility = "collapse";
        }
        const RootInnateDisplay = hud.FindChildrenWithClassTraverse("RootInnateDisplay")[0];
        if (RootInnateDisplay) {
            RootInnateDisplay.style.visibility = "collapse";
        }
        const AbilitiesAndStatBranch = hud.FindChildTraverse("AbilitiesAndStatBranch");
        if (AbilitiesAndStatBranch) {
            AbilitiesAndStatBranch.style.visibility = "visible";
        }
        const lowerHud = hud.FindChildTraverse("lower_hud");
        if (lowerHud) {
            lowerHud.style.visibility = "collapse";
        }
    }
}

new DotaDefaultUIElement_hide();
