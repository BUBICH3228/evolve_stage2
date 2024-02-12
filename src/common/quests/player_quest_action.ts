import { PlayerQuestActionType } from "./enums/player_quest_action_type";

export class PlayerQuestAction {
    public currentProgress = 0;
    public readonly maxProgress: number = 0;
    public readonly type: PlayerQuestActionType = PlayerQuestActionType.KILL_ENEMIES;
    public readonly requiredCompletedQuestActions: number[] = [];

    public readonly unitName: string | undefined;
    public readonly requiredGold: number | undefined;
    public readonly requiredDamageDone: number | undefined;
    public readonly talkNpcName: string | undefined;
    public readonly requiredHeroLevel: number | undefined;
    public readonly infoTargetName: string | undefined;
    public readonly teleportScrollsToUse: number | undefined;
}
