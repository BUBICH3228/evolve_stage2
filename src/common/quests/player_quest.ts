import { QuestID, QuestsList } from "../data/quests";
import { QuestActionToPlayerQuestAction } from "./common";
import { PlayerQuestAction } from "./player_quest_action";

export class PlayerQuest {
    readonly questId: QuestID;
    readonly actions: PlayerQuestAction[];

    constructor(questId: QuestID) {
        this.questId = questId;
        this.actions = [];
        const quest = QuestsList[questId];

        for (const [_, questAction] of Object.entries(quest.actions)) {
            this.actions.push(QuestActionToPlayerQuestAction(questAction));
        }
    }
}
