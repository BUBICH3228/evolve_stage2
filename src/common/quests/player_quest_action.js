export class PlayerQuestAction {
    constructor() {
        this.currentProgress = 0;
        this.maxProgress = 0;
        this.type = 2 /* PlayerQuestActionType.KILL_ENEMIES */;
        this.requiredCompletedQuestActions = [];
    }
}
