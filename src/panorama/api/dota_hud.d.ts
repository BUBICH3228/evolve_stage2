declare interface CustomUIConfig {
    DotaHUD: DotaHUD;
}

declare interface DotaHUD {
    Get: () => Panel;
    ShowError: (message: string) => void;
    ListenToMouseEvent: (callback: (event: MouseEvent, clickBehavior: MouseButton | MouseScrollDirection) => void) => void;
    IsCursorOverPanel: (panel: Panel) => boolean;
    GetScreenWidth: () => number;
    GetScreenHeight: () => number;
}

// eslint-disable-next-line no-var
declare var DotaHUD: DotaHUD;
