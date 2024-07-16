// eslint-disable-next-line no-var
var Constants = GameUI.CustomUIConfig().Constants;

declare global {
    interface CustomUIConfig {
        TopBarButtons: TopBarButtons;
    }
}

declare interface TopBarButtons {
    IsInitialized: () => boolean;
    SetIsInitialized: (state: boolean) => void;
    ShowButton: (buttonId: number, state: boolean) => void;
    FireButtonClickedEvent: (buttonId: number) => void;
    ListenToButtonClickedEvent: (buttonId: number, callback: () => void) => void;
    SetButton: (buttonId: number, button: Panel) => void;
}

type TopBarButtonsWithInternalData = TopBarButtons & {
    _initialized: boolean;
    buttons: Panel[];
    callbacks: { [key: number]: (() => void)[] };
};

// eslint-disable-next-line no-var
var TopBarButtons: TopBarButtonsWithInternalData = {
    _initialized: false,
    buttons: [],
    callbacks: {},
    IsInitialized: () => {
        if (TopBarButtons._initialized != null) {
            return TopBarButtons._initialized;
        }
        return false;
    },
    SetIsInitialized: (state: boolean) => {
        TopBarButtons._initialized = state;
    },
    ShowButton: (buttonId: number, state: boolean) => {
        if (TopBarButtons.IsInitialized() == false) {
            $.Schedule(0.05, function () {
                TopBarButtons.ShowButton(buttonId, state);
            });
            return;
        }
        if (TopBarButtons.buttons[buttonId]) {
            TopBarButtons.buttons[buttonId].SetHasClass("Hidden", !state);
        }
    },
    FireButtonClickedEvent: (buttonId: number) => {
        if (TopBarButtons.callbacks[buttonId] == null) {
            return;
        }
        for (let i = 0; i < TopBarButtons.callbacks[buttonId].length; i++) {
            if (TopBarButtons.callbacks[buttonId][i] != null) {
                try {
                    TopBarButtons.callbacks[buttonId][i]();
                } catch (error) {
                    const exception = error as Error;
                    $.Msg("FireButtonClickedEvent callback error.");
                    $.Msg(exception);
                    $.Msg(exception.stack);
                }
            }
        }
    },
    ListenToButtonClickedEvent: (buttonId: number, callback: () => void) => {
        try {
            if (IsTopBarButtonEnumValueExists(buttonId) == false) {
                throw "Expected valid buttonId instead of " + buttonId + ". Are you forget to update Constants.TOP_BAR_BUTTONS?";
            }
            if (typeof callback !== "function") {
                throw "Expected callback as function.";
            }
        } catch (error) {
            const exception = error as Error;
            $.Msg("TopBarButtons.ListenToButtonClickedEvent throws error.");
            $.Msg(exception);
            $.Msg(exception.stack);
            return;
        }
        if (TopBarButtons.callbacks[buttonId] == null) {
            TopBarButtons.callbacks[buttonId] = [];
        }
        TopBarButtons.callbacks[buttonId].push(callback);
    },
    SetButton: (buttonId: number, panel: Panel) => {
        try {
            if (IsTopBarButtonEnumValueExists(buttonId) == false) {
                throw "Expected valid buttonId instead of " + buttonId + ". Are you forget to update Constants.TOP_BAR_BUTTONS?";
            }
        } catch (error) {
            const exception = error as Error;
            $.Msg("TopBarButtons.ListenToButtonClickedEvent throws error.");
            $.Msg(exception);
            $.Msg(exception.stack);
            return;
        }
        TopBarButtons.buttons[buttonId] = panel;
    }
};

function IsTopBarButtonEnumValueExists(buttonId: number) {
    let isExists = false;
    for (const [_, enumValue] of Object.entries(Constants.TOP_BAR_BUTTONS)) {
        if (enumValue == buttonId) {
            isExists = true;
            break;
        }
    }
    return isExists;
}

GameUI.CustomUIConfig().TopBarButtons = TopBarButtons;

export {};
