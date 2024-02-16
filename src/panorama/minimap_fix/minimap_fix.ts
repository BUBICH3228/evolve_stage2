// eslint-disable-next-line no-var
var DotaHUD = GameUI.CustomUIConfig().DotaHUD;

class Minimap {
    MINIMAP_PANEL: HUDOverlayMap = $("#Map") as HUDOverlayMap;
    constructor() {
        this.ReplacingMinimap();
    }

    private ReplacingMinimap() {
        this.MINIMAP_PANEL.fixedoffsetenabled = true;
        this.MINIMAP_PANEL.SetFixedOffset(128, -1024);
        this.MINIMAP_PANEL.mapscale = 1;
        this.MINIMAP_PANEL.SetFixedBackgroundTexturePosition(32768, 128, -1024);
        this.MINIMAP_PANEL.maptexture = "materials/overviews/wraith_trap_map_tga_1d8098dc.vtex";
        const panel = this.MINIMAP_PANEL.Children()[0] as any;
        panel["heroid"] = 137;
    }
}

new Minimap();
