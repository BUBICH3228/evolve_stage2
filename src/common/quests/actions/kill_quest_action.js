import { QuestAction } from "./quest_action";
export class KillQuestAction extends QuestAction {
    constructor(args) {
        super(args);
    }
    GetType() {
        return 2 /* PlayerQuestActionType.KILL_ENEMIES */;
    }
    GetRequiredProgress() {
        return this.amount;
    }
}
export const IsKillQuestAction = (b) => {
    const convertedAction = b;
    return convertedAction.unitName !== undefined && convertedAction.amount != undefined;
};
