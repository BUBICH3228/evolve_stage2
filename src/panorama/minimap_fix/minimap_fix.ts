// eslint-disable-next-line no-var

class Minimap {
    MINIMAP_PANEL: HUDOverlayMap = $("#Map") as HUDOverlayMap;
    constructor() {
        this.ReplacingMinimap();
        GameEvents.Subscribe("fix_hero_minimap_icon", () => {
            this.ReplacementDOTAHeroImage();
        });
    }

    private ReplacingMinimap() {
        this.MINIMAP_PANEL.fixedoffsetenabled = true;
        this.MINIMAP_PANEL.SetFixedOffset(128, -1024);
        this.MINIMAP_PANEL.mapscale = 1;
        this.MINIMAP_PANEL.SetFixedBackgroundTexturePosition(32768, 128, -1024);
        this.MINIMAP_PANEL.maptexture = "materials/overviews/wraith_trap_map_tga_1d8098dc.vtex";
    }

    private ReplacementDOTAHeroImage() {
        const playersID = Game.GetAllPlayerIDs();
        playersID.forEach((playerID) => {
            const data = Game.GetPlayerInfo(playerID);
            const panel = this.MINIMAP_PANEL.Children()[data.player_id];
            (panel as HeroImage)["heroid"] = data.player_selected_hero_id;
            panel.style.height = "16px";
            panel.style.width = "16px";
        });
    }
}

new Minimap();
