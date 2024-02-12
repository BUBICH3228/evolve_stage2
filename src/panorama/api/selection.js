/* eslint-disable no-undef */
"use strict";

var Selection = {};

Selection.GetLocalPlayerSelectedUnit = function () {
    let selectedUnit = Players.GetQueryUnit(Game.GetLocalPlayerID());
    if (selectedUnit < 0) {
        selectedUnit = Players.GetLocalPlayerPortraitUnit();
    }
    return selectedUnit;
};

GameUI.CustomUIConfig().Selection = Selection;

function OnUpdateSelectedUnit() {
    GameEvents.SendCustomGameEventToServer("selection_player_update", {
        unit: Selection.GetLocalPlayerSelectedUnit()
    });
}

(function () {
    GameEvents.Subscribe("dota_player_update_selected_unit", OnUpdateSelectedUnit);
    GameEvents.Subscribe("dota_player_update_query_unit", OnUpdateSelectedUnit);
})();
