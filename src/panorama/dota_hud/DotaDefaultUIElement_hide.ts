// eslint-disable-next-line no-var
var DotaHUD = GameUI.CustomUIConfig().DotaHUD;

class DotaDefaultUIElement_hide {
    constructor() {
        this.HideDotaDefaultUIElement();
        this.HideDefaultDOTATopBarButtons();
        this.HideDefaultDOTAMinimap();
        this.HideDefaultDOTAGlyphScanContainer();
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
        const minimap = hud.FindChildTraverse("minimap");
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
}

new DotaDefaultUIElement_hide();
