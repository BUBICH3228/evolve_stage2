// eslint-disable-next-line no-var
var Constants = GameUI.CustomUIConfig().Constants;
$.Msg("[HudButtons] Loaded");
declare global {
    interface CustomUIConfig {
        HudButtons: HudButtons;
    }
}

interface HudButtons {
    IsInitialized: () => boolean;
    SetIsInitialized: (state: boolean) => void;
    ShowButton: (buttonId: number, state: boolean) => void;
    FireButtonClickedEvent: (buttonId: number) => void;
    ListenToButtonClickedEvent: (buttonId: number, callbac: () => void) => void;
    SetButton: (buttonId: number, panel: Panel) => void;
}

type HudButtonsInternalDataCallback = () => void;
type HudButtonsWithInternalData = HudButtons & {
    _initialized: boolean;
    buttons: Panel[];
    callbacks: { [key: number]: HudButtonsInternalDataCallback[] };
};

// eslint-disable-next-line no-var
var HudButtons: HudButtonsWithInternalData = {
    _initialized: false,
    buttons: [],
    callbacks: {},
    IsInitialized: () => {
        if (HudButtons._initialized != null) {
            return HudButtons._initialized;
        }
        return false;
    },
    SetIsInitialized: (state: boolean) => {
        HudButtons._initialized = state;
    },
    ShowButton: (buttonId: number, state: boolean) => {
        if (HudButtons.IsInitialized() == false) {
            $.Schedule(0.05, function () {
                HudButtons.ShowButton(buttonId, state);
            });
            return;
        }
        if (HudButtons.buttons[buttonId]) {
            HudButtons.buttons[buttonId].SetHasClass("Hidden", !state);
        }
    },
    FireButtonClickedEvent: (buttonId: number) => {
        if (HudButtons.callbacks[buttonId] == null) {
            return;
        }
        for (let i = 0; i < HudButtons.callbacks[buttonId].length; i++) {
            if (HudButtons.callbacks[buttonId][i] != null) {
                try {
                    HudButtons.callbacks[buttonId][i]();
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
            if (IsHudButtonEnumValueExists(buttonId) == false) {
                throw "Expected valid buttonId instead of " + buttonId + ". Are you forget to update Constants.HUD_BUTTONS?";
            }
            if (typeof callback !== "function") {
                throw "Expected callback as function.";
            }
        } catch (error) {
            const exception = error as Error;
            $.Msg("HudButtons.ListenToButtonClickedEvent throws error.");
            $.Msg(exception);
            $.Msg(exception.stack);
            return;
        }
        if (HudButtons.callbacks[buttonId] == null) {
            HudButtons.callbacks[buttonId] = [];
        }
        HudButtons.callbacks[buttonId].push(callback);
    },
    SetButton: (buttonId: number, panel: Panel) => {
        try {
            if (IsHudButtonEnumValueExists(buttonId) == false) {
                throw "Expected valid buttonId instead of " + buttonId + ". Are you forget to update Constants.HUD_BUTTONS?";
            }
        } catch (error) {
            const exception = error as Error;
            $.Msg("HudButtons.ListenToButtonClickedEvent throws error.");
            $.Msg(exception);
            $.Msg(exception.stack);
            return;
        }
        HudButtons.buttons[buttonId] = panel;
    }
};

function IsHudButtonEnumValueExists(buttonId: number) {
    let isExists = false;
    for (const [_, enumValue] of Object.entries(Constants.HUD_BUTTONS)) {
        if (enumValue == buttonId) {
            isExists = true;
            break;
        }
    }
    return isExists;
}

GameUI.CustomUIConfig().HudButtons = HudButtons;

export {};
