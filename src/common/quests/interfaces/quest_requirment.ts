import { QuestID } from "../../data/quests";

export interface QuestRequirment {
    requiredHeroLevel?: number;
    completedQuests?: QuestID[];
}
