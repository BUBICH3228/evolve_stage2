interface PanelWithSubscription extends Panel {
    subscription: number;
}

interface Panel {
    text: string;
    /**
     * contains the WorldPanel configuration
     */
    WorldPanel?: WorldPanel;
}

interface WorldPanel {
    /**
     * The panorama layout file to display in this worldpanel.
     */
    layout: string;
    /**
     * Mutually exclusive with "entity".  Position is the world vector position to display the worldpanel at.
     */
    position: [number, number, number] | undefined;
    /**
     * Mutually exclusive with "position".  Entity is the entity (hscript or index) which the worldpanel will track for its position.
     */
    entity: EntityIndex | undefined;
    /**
     * A (default is 0) screen pixel offset to apply to the worldpanel (in the x direction)
     */
    offsetX: number;
    /**
     * A (default is 0) screen pixel offset to apply to the worldpanel (in the y direction)
     */
    offsetY: number;
    /**
     * An (default is HA_CENTER) alignment for the worldpanel to use when adjusting the panel size. HA_CENTER, HA_LEFT, HA_RIGHT are valid options
     */
    hAlign: WorldPanelHorizontalAlign;
    /**
     * An (default is VA_BOTTOM) alignment for the worldpanel to use when adjusting the panel size. VA_BOTTOM, VA_CENTER, VA_TOP are valid options
     */
    vAlign: WorldPanelVerticalAlign;
    /**
     * A (default is 0) height offset to use for the entity world panel (see: "HealthBarOffset" in unit KV definition)
     */
    entityHeight: number;
    /**
     * true if this worldpanel has edgelocking/padding and is touching the edge/padded edge of the screen.  false otherwise.  Updates every frame.
     */
    IsOnEdge: () => boolean;
    /**
     * true if this worldpanel has no edgelocking/padding and is completely off screen.  false otherwise.  Updates every frame.
     */
    IsOffScreen: () => boolean;
    GetData<T extends object>(): T;
}

interface CustomUIConfig {
    ScreenWidth: number;
    ScreenHeight: number;
}
