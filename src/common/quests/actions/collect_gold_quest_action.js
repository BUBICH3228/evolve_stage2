import { QuestAction } from "./quest_action";
export class CollectGoldQuestAction extends QuestAction {
    constructor(args) {
        super(args);
    }
    GetType() {
        return 0 /* PlayerQuestActionType.COLLECT_GOLD */;
    }
    GetRequiredProgress() {
        return this.requiredGold;
    }
}
export const IsCollectGoldQuestAction = (b) => {
    const convertedAction = b;
    return convertedAction.requiredGold !== undefined;
};
