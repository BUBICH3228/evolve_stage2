import { PlayerQuestActionType } from "../enums/player_quest_action_type";
import { QuestAction, QuestActionConstructorArgs } from "./quest_action";

export class DealDamageQuestAction extends QuestAction {
    readonly requiredDamageDone!: number;

    public constructor(args: QuestActionConstructorArgs<DealDamageQuestAction, "requiredDamageDone">) {
        super(args);
    }

    GetType(): PlayerQuestActionType {
        return PlayerQuestActionType.DEAL_DAMAGE;
    }

    GetRequiredProgress(): number {
        return this.requiredDamageDone;
    }
}

export const IsDealDamageQuestAction = (b: QuestAction): b is DealDamageQuestAction => {
    const convertedAction = b as DealDamageQuestAction;

    return convertedAction.requiredDamageDone !== undefined;
};
