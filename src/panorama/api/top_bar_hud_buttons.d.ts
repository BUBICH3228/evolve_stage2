declare interface CustomUIConfig {
    TopBarButtons: TopBarButtons;
}

declare interface TopBarButtons {
    IsInitialized: () => boolean;
    SetIsInitialized: (state: boolean) => void;
    ShowButton: (buttonId: TopBarButton, state: boolean) => void;
    FireButtonClickedEvent: (buttonId: TopBarButton) => void;
    ListenToButtonClickedEvent: (buttonId: TopBarButton, callback: () => void) => void;
    SetButton: (buttonId: TopBarButton, button: Panel) => void;
}

// eslint-disable-next-line no-var
declare var TopBarButtons: TopBarButtons;
