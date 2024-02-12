declare interface Teleports {
    SetIsTeleportLocked(teleportID: number, state: boolean): void;
    IsTeleportLocked(teleportID: number): boolean;
    GetTeleportItemName(): string;
}

declare let Teleports: Teleports;
