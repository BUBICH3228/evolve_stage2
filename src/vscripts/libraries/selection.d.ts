declare interface Selection {
    SetPlayerLastSelectedUnit(playerID: PlayerID, unit: CDOTA_BaseNPC): void;
    GetPlayerLastSelectedUnit(playerID: PlayerID): CDOTA_BaseNPC | undefined;
}

declare let Selection: Selection;
