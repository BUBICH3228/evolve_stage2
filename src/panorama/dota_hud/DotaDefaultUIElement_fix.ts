// eslint-disable-next-line no-var
var DotaHUD = GameUI.CustomUIConfig().DotaHUD;

class DotaDefaultUIElement_fix {
    constructor() {
        this.FindAndFixLevelLabel();
        this.FindAndFixMinimap();
    }

    private FindAndFixLevelLabel() {
        const hud = DotaHUD.Get();
        const levelLabel = hud.FindChildTraverse("LevelLabel");
        if (levelLabel) {
            levelLabel.style.width = "50px";
        } else {
            $.Msg("Seems valve break FindAndFixLevelLabel");
        }
    }

    private FindAndFixMinimap() {
        const hud = DotaHUD.Get();
        const minimapBlock = hud.FindChildTraverse("minimap_block");
        if (minimapBlock) {
            minimapBlock.style.backgroundImage = "url('s2r://panorama/images/hud/reborn/bg_minimap_psd.vtex')";
            minimapBlock.style.height = "268px";
            const panel = $.CreatePanel("Panel", minimapBlock, "MapPanel");
            panel.BLoadLayout("file://{resources}/layout/custom_game/minimap_fix/minimap_fix.xml", false, false);
        } else {
            $.Msg("Seems valve break FindAndFixMinimap");
        }
    }
}

new DotaDefaultUIElement_fix();
