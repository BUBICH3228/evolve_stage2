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
        this.MINIMAP_PANEL.SetFixedOffset(0, 0);
        this.MINIMAP_PANEL.mapscale = 1;
        this.MINIMAP_PANEL.SetFixedBackgroundTexturePosition(32768, 0, 0);
        this.MINIMAP_PANEL.maptexture = "materials/overviews/wraith_trap_map_psd_29b7388b.vtex";
    }

    private ReplacementDOTAHeroImage() {
        const playersID = Game.GetAllPlayerIDs();
        playersID.forEach((playerID) => {
            const data = Game.GetPlayerInfo(playerID);
            const panel = this.MINIMAP_PANEL.Children()[data.player_id];
            (panel as HeroImage)["heroid"] = data.player_selected_hero_id;
            panel.style.height = "12px";
            panel.style.width = "12px";
        });
    }
}

new Minimap();
