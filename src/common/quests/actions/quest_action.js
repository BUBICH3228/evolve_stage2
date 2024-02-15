export class QuestAction {
    constructor(args) {
        this.requiredCompletedQuestActions = [];
        this.infoTargetName = undefined;
        Object.assign(this, args);
    }
}
