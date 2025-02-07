import { reloadable } from "../libraries/tstl-utils";

@reloadable
export class CustomUiEventsChecker {
    constructor() {
        //Выбор команды
        CustomGameEventManager.RegisterListener("team_selection_results", (_, event) =>
            CustomEvents.RunEventByName(CustomEvent.CUSTOM_EVENT_ON_PLAYER_TEAM_SELECTED, event)
        );
        //Выбор героя
        CustomGameEventManager.RegisterListener("hero_selection_event", (_, event) =>
            CustomEvents.RunEventByName(CustomEvent.CUSTOM_EVENT_ON_PLAYER_HERO_SELECTED, event)
        );
    }
}

declare global {
    // eslint-disable-next-line no-var
    var _CustomUiEventsCheckerInitialized: boolean;
}

if (IsServer() && !_G._CustomUiEventsCheckerInitialized) {
    new CustomUiEventsChecker();
    _G._CustomUiEventsCheckerInitialized = true;
}
