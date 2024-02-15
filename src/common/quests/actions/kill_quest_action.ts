import { PlayerQuestActionType } from "../enums/player_quest_action_type";
import { QuestAction, QuestActionConstructorArgs } from "./quest_action";

export class KillQuestAction extends QuestAction {
    readonly unitName!: string;
    readonly amount!: number;

    public constructor(args: QuestActionConstructorArgs<KillQuestAction, "unitName" | "amount">) {
        super(args);
    }

    GetType(): PlayerQuestActionType {
        return PlayerQuestActionType.KILL_ENEMIES;
    }

    GetRequiredProgress(): number {
        return this.amount;
    }
}

export const IsKillQuestAction = (b: QuestAction): b is KillQuestAction => {
    const convertedAction = b as KillQuestAction;

    return convertedAction.unitName !== undefined && convertedAction.amount != undefined;
};
