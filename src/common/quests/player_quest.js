import { QuestsList } from "../data/quests";
import { QuestActionToPlayerQuestAction } from "./common";
export class PlayerQuest {
    constructor(questId) {
        this.questId = questId;
        this.actions = [];
        const quest = QuestsList[questId];
        for (const [_, questAction] of Object.entries(quest.actions)) {
            this.actions.push(QuestActionToPlayerQuestAction(questAction));
        }
    }
}
