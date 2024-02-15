import { QuestAction } from "./quest_action";
export class UseTeleportScrollQuestAction extends QuestAction {
    constructor(args) {
        super(args);
    }
    GetType() {
        return 3 /* PlayerQuestActionType.TALK_TO_NPC */;
    }
    GetRequiredProgress() {
        return this.teleportScrollsToUse;
    }
}
export const IsUseTeleportScrollQuestAction = (b) => {
    const convertedAction = b;
    return convertedAction.teleportScrollsToUse !== undefined;
};
