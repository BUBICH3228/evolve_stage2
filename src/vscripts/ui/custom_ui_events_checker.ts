import { QuestID } from "../common/data/quests";
import { Quests } from "../libraries/quests";
import { reloadable } from "../libraries/tstl-utils";

@reloadable
export class CustomUiEventsChecker {
    constructor() {
        // Квесты
        CustomGameEventManager.RegisterListener("quests_quest_accepted", (_, event) => {
            Quests.AddQuestToPlayer(event.PlayerID, tonumber(event.quest_id) as QuestID);
        });
        CustomGameEventManager.RegisterListener("quests_quest_abandoned", (_, event) => {
            Quests.CancelPlayerQuest(event.PlayerID, tonumber(event.quest_id) as QuestID);
        });

        //Выбор команды
        CustomGameEventManager.RegisterListener("team_selection_results", (_, event) =>
            CustomEvents.RunEventByName(CustomEvent.CUSTOM_EVENT_ON_PLAYER_TEAM_SELECTED, { event })
        );
        //Выбор героя
        CustomGameEventManager.RegisterListener("hero_selection_event", (_, event) =>
            CustomEvents.RunEventByName(CustomEvent.CUSTOM_EVENT_ON_PLAYER_HERO_SELECTED, { event })
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
