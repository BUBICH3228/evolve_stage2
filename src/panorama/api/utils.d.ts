declare interface CustomUIConfig {
    Utils: Utils;
}

declare interface Utils {
    GetPlayerColor: (pid: PlayerID) => string;
    FormatBigNumber: (number: number, digits?: number) => string;
    Round: (number: number) => number;
    FormatTime: (seconds: number) => string;
    ReplaceAll: (sourceString: string, oldValue: string, newValue: string) => string;
}

// eslint-disable-next-line no-var
declare var Utils: Utils;
