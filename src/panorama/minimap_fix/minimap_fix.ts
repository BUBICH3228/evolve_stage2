// eslint-disable-next-line no-var
var DotaHUD = GameUI.CustomUIConfig().DotaHUD;

class Minimap {
    MINIMAP_PANEL: HUDOverlayMap = $("#Map") as HUDOverlayMap;
    constructor() {
        this.ReplacingMinimap();
    }

    private ReplacingMinimap() {
        this.MINIMAP_PANEL.fixedoffsetenabled = true;
        this.MINIMAP_PANEL.SetFixedOffset(0, 0);
        this.MINIMAP_PANEL.mapscale = 1;
        this.MINIMAP_PANEL.SetFixedBackgroundTexturePosition(32768, 0, 0);
        this.MINIMAP_PANEL.maptexture = "materials/overviews/wraith_trap_map_tga_1d8098dc.vtex";
    }
}

new Minimap();
