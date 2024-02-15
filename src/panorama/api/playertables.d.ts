declare interface CustomUIConfig {
    PlayerTables: PlayerTables;
}

declare interface PlayerTables {
    GetTableValue<T extends PlayerTableObject>(tableName: string, key: string): T | undefined;
    GetAllTableValues<T extends PlayerTableObject>(tableName: string): T | undefined;
    SubscribeNetTableListener(
        tableName: string,
        callback: (tableName: string, changes: PlayerTableObject, deletions: PlayerTableObject) => void
    ): number;
    UnsubscribeNetTableListener(callbackId: number): void;
}

// eslint-disable-next-line no-var
declare var PlayerTables: PlayerTables;
