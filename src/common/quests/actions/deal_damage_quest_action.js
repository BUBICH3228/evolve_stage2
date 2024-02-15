import { QuestAction } from "./quest_action";
export class DealDamageQuestAction extends QuestAction {
    constructor(args) {
        super(args);
    }
    GetType() {
        return 1 /* PlayerQuestActionType.DEAL_DAMAGE */;
    }
    GetRequiredProgress() {
        return this.requiredDamageDone;
    }
}
export const IsDealDamageQuestAction = (b) => {
    const convertedAction = b;
    return convertedAction.requiredDamageDone !== undefined;
};
