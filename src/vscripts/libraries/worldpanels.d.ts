declare interface WorldPanelsConfig<T extends object> {
    /**
     * The panorama layout file to display in this worldpanel.
     */
    layout: string;
    /**
     * Mutually exclusive with "entity".  Position is the world vector position to display the worldpanel at.
     */
    position?: Vector;
    /**
     * Mutually exclusive with "position".  Entity is the entity (hscript or index) which the worldpanel will track for its position.
     */
    entity?: CDOTA_BaseNPC | EntityIndex;
    /**
     * An optional (default is 0) screen pixel offset to apply to the worldpanel (in the x direction)
     */
    offsetX?: number;
    /**
     * An optional (default is 0) screen pixel offset to apply to the worldpanel (in the y direction)
     */
    offsetY?: number;
    /**
     * An optional (default is "center") alignment for the worldpanel to use when adjusting the panel size. "center", "left", "right" are valid options
     */
    horizontalAlign?: WorldPanelHorizontalAlign;
    /**
     * An optional (default is "bottom") alignment for the worldpanel to use when adjusting the panel size. "bottom", "center", "top" are valid options
     */
    verticalAlign?: WorldPanelVerticalAlign;
    /**
     * An optional (default is 0) height offset to use for the entity world panel (see: "HealthBarOffset" in unit KV definition)
     */
    entityHeight?: number;
    /**
     *  An optional (default is to not lock to screen edge) padding percentage of the screen to limit the worldpanel to.
     */
    edgePadding?: number;
    /**
     * An optional (default is infinite) duration in GameTime seconds that the panel will exist for and then be automatically destroyed.
     */
    duration?: number;
    /**
     * An optional table of data which will be attached to the worldpanel so that valeus can be used in javascript through $.GetContextPanel().Data
     *
     * This table should only contain numeric, string, or table values (no entities/hscripts)
     */
    data?: T;
}

declare interface WorldPanel {
    SetPosition: (position: Vector) => void;
    SetEntity: (entity: CDOTA_BaseNPC) => void;
    SetHorizontalAlign: (align: WorldPanelHorizontalAlign) => void;
    SetVerticalAlign: (align: WorldPanelVerticalAlign) => void;
    SetOffsetX: (offsetX: number) => void;
    SetOffsetY: (offsetY: number) => void;
    SetEdgePadding: (edge: number) => void;
    SetEntityHeight: (entityHeight: number) => void;
    SetData: (data: object) => void;
    Delete: () => void;
}

declare interface WorldPanels {
    CreateWorldPanel<T extends object>(playerIDs: PlayerID | [PlayerID], config: WorldPanelsConfig<T>): WorldPanel;
    CreateWorldPanelForTeam<T extends object>(teamID: DotaTeam, config: WorldPanelsConfig<T>): WorldPanel;
    CreateWorldPanelForAll<T extends object>(config: WorldPanelsConfig<T>): WorldPanel;
}

declare let WorldPanels: WorldPanels;
