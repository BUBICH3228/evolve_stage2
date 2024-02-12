declare interface GameSettings {
    IsLoaded(): boolean;
    LoadSettings(gme: CDOTABaseGameMode): void;
    GetSettingValueAsNumber(name: string): number;
    GetSettingValueAsString(name: string): string;
    GetSettingValueAsBoolean(name: string): boolean;
    GetSettingValueAsTable(name: string): LuaPairsIterable<string, string>;
    GetSettingValueAsTeamNumber(name: string): DotaTeam;
}

declare let GameSettings: GameSettings;
