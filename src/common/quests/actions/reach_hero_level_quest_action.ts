import { PlayerQuestActionType } from "../enums/player_quest_action_type";
import { QuestAction, QuestActionConstructorArgs } from "./quest_action";

export class ReachHeroLevelQuestAction extends QuestAction {
    readonly requiredHeroLevel!: number;

    public constructor(args: QuestActionConstructorArgs<ReachHeroLevelQuestAction, "requiredHeroLevel">) {
        super(args);
    }

    GetType(): PlayerQuestActionType {
        return PlayerQuestActionType.REACH_HERO_LEVEL;
    }

    GetRequiredProgress(): number {
        return this.requiredHeroLevel;
    }
}

export const IsReachHeroLevelQuestAction = (b: QuestAction): b is ReachHeroLevelQuestAction => {
    const convertedAction = b as ReachHeroLevelQuestAction;

    return convertedAction.requiredHeroLevel !== undefined;
};
