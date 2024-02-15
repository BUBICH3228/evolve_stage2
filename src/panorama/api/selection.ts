declare global {
    interface CustomUIConfig {
        Selection: Selection;
    }
}

declare interface Selection {
    GetLocalPlayerSelectedUnit: () => EntityIndex;
    ListenToLocalPlayerSelectedUnit: (callback: SelectedUnitCallback) => void;
}

type SelectedUnitCallback = () => void;
type SelectionWithInternalData = Selection & {
    _callbacks: SelectedUnitCallback[];
};

// eslint-disable-next-line no-var
var Selection: SelectionWithInternalData = {
    _callbacks: [],
    GetLocalPlayerSelectedUnit: function (): EntityIndex {
        let selectedUnit = Players.GetQueryUnit(Game.GetLocalPlayerID());
        if (selectedUnit < 0) {
            selectedUnit = Players.GetLocalPlayerPortraitUnit();
        }
        return selectedUnit;
    },
    ListenToLocalPlayerSelectedUnit: function (callback: SelectedUnitCallback): void {
        Selection._callbacks.push(callback);
        callback();
    }
};

function FireLocalPlayerSelectedUnitEvent() {
    Selection._callbacks.forEach((callback) => {
        try {
            callback();
        } catch (error) {
            const exception = error as Error;
            $.Msg("FireLocalPlayerSelectedUnitEvent callback error.");
            $.Msg(exception);
            $.Msg(exception.stack);
        }
    });
}

function OnUpdateSelectedUnit() {
    FireLocalPlayerSelectedUnitEvent();
    GameEvents.SendCustomGameEventToServer("selection_player_update", {
        unit: Selection.GetLocalPlayerSelectedUnit()
    });
}

(function () {
    GameEvents.Subscribe("dota_player_update_selected_unit", OnUpdateSelectedUnit);
    GameEvents.Subscribe("dota_player_update_query_unit", OnUpdateSelectedUnit);
})();

GameUI.CustomUIConfig().Selection = Selection;

export {};
