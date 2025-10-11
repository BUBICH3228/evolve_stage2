/* eslint-disable @typescript-eslint/no-unused-vars */
class Minimap {
    MINIMAP_PANEL: HUDOverlayMap = $("#Map") as HUDOverlayMap;
    constructor() {
        this.ReplacingMinimap();
        GameEvents.Subscribe("change_hero", () => {
            this.ReplacementDOTAHeroImage();
        });
    }

    private ReplacingMinimap() {
        this.MINIMAP_PANEL.SetFixedOffset(0, 0);
        this.MINIMAP_PANEL.fixedoffsetenabled = true;
        this.MINIMAP_PANEL.mapscale = 1.7;
        this.MINIMAP_PANEL.SetFixedBackgroundTexturePosition(32768, 0, 0);
        this.MINIMAP_PANEL.maptexture = "materials/overviews/wraith_trap_map_tga_1d8098dc.vtex";
    }

    private ReplacementDOTAHeroImage() {
        const playersID = Game.GetAllPlayerIDs();
        const panel = this.MINIMAP_PANEL.Children();
        let counter = 0;
        panel.forEach((panel) => {
            if (panel.paneltype == "DOTAHeroImage") {
                const data = Game.GetPlayerInfo(counter as PlayerID);
                (panel as HeroImage)["heroid"] = data.player_selected_hero_id;
                panel.style.height = "16px";
                panel.style.width = "16px";
                counter++;
            }
        });
    }
}

new Minimap();
