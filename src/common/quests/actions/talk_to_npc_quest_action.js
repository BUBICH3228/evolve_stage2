import { QuestAction } from "./quest_action";
export class TalkToNpcQuestAction extends QuestAction {
    constructor(args) {
        super(args);
    }
    GetType() {
        return 3 /* PlayerQuestActionType.TALK_TO_NPC */;
    }
    GetRequiredProgress() {
        return 1;
    }
}
export const IsTalkToNpcQuestAction = (b) => {
    const convertedAction = b;
    return convertedAction.npcName !== undefined;
};
