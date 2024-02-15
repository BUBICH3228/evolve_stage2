declare interface CustomUIConfig {
    GameSettings: GameSettings;
}

declare interface GameSettings {
    GetSettingValueAsNumber: (name: string) => number;
    GetSettingValueAsString: (name: string) => string;
    GetSettingValueAsBoolean: (name: string) => boolean;
    GetSettingValueAsTable: (name: string) => object;
    GetSettingValueAsTeamNumber: (name: string) => DotaTeam;
    ListenToGameSettingsLoadedEvent: (callback: () => void) => void;
}

// eslint-disable-next-line no-var
declare var GameSettings: GameSettings;
