import { QuestAction } from "./quest_action";
export class ReachHeroLevelQuestAction extends QuestAction {
    constructor(args) {
        super(args);
    }
    GetType() {
        return 4 /* PlayerQuestActionType.REACH_HERO_LEVEL */;
    }
    GetRequiredProgress() {
        return this.requiredHeroLevel;
    }
}
export const IsReachHeroLevelQuestAction = (b) => {
    const convertedAction = b;
    return convertedAction.requiredHeroLevel !== undefined;
};
