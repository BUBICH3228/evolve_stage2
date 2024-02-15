import { PlayerQuestActionType } from "../enums/player_quest_action_type";

type RequiredQuestActions = number[];
type BaseQuestActionConstructorArgs = { requiredCompletedQuestActions: RequiredQuestActions; infoTargetName: string | undefined };
export type QuestActionConstructorArgs<T extends QuestAction, K extends keyof T> = Pick<T, K> & Partial<T> & BaseQuestActionConstructorArgs;

export abstract class QuestAction {
    readonly requiredCompletedQuestActions: RequiredQuestActions = [];
    readonly infoTargetName: string | undefined = undefined;

    constructor(args: QuestActionConstructorArgs<QuestAction, "requiredCompletedQuestActions" | "infoTargetName">) {
        Object.assign(this, args);
    }

    abstract GetType(): PlayerQuestActionType;
    abstract GetRequiredProgress(): number;
}
