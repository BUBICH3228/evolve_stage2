import { QuestID } from "../common/data/quests";
import { Quests } from "../libraries/quests";
import { reloadable } from "../libraries/tstl-utils";

@reloadable
export class QuestsUI {
    constructor() {
        CustomGameEventManager.RegisterListener("quests_quest_accepted", (_, event) => {
            Quests.AddQuestToPlayer(event.PlayerID, tonumber(event.quest_id) as QuestID);
        });
        CustomGameEventManager.RegisterListener("quests_quest_abandoned", (_, event) => {
            Quests.CancelPlayerQuest(event.PlayerID, tonumber(event.quest_id) as QuestID);
        });
    }
}

declare global {
    // eslint-disable-next-line no-var
    var _questsUIInitialized: boolean;
}

if (IsServer() && !_G._questsUIInitialized) {
    new QuestsUI();
    _G._questsUIInitialized = true;
}
