declare interface PlayerTables {
    CreateTable(tableName: string, tableContents?: object, pids?: PlayerID[] | true): void;
    DeleteTable(tableName: string): void;
    TableExists(tableName: string): boolean;
    SetPlayerSubscriptions(tableName: string, pids: PlayerID[]): void;
    AddPlayerSubscription(tableName: string, pid: PlayerID): void;
    RemovePlayerSubscription(tableName: string, pid: PlayerID): void;
    GetTableValue<T extends PlayerTableObjectRow>(tableName: string, key: string): T | undefined;
    GetAllTableValues<T extends PlayerTableObject>(tableName: string): T | undefined;
    DeleteTableKey(tableName: string, key: string): void;
    DeleteTableKeys(tableName: string, keys: string[]): void;
    SetTableValue<T extends PlayerTableObjectRow>(tableName: string, key: string, value: T): void;
    SetTableValues(tableName: string, changes: PlayerTableObject): void;
}

declare let PlayerTables: PlayerTables;
