import { QuestAction } from "../actions/quest_action";
import { QuestRequirment } from "./quest_requirment";
import { QuestReward } from "./quest_reward";

export interface Quest {
    readonly name: string;
    readonly requirments?: QuestRequirment;
    readonly rewards?: QuestReward;
    readonly actions: { [key: number]: QuestAction };
    readonly repeatable: boolean;
    readonly npcName: string;
    readonly addQuestOnHeroSelected?: boolean;
}
