import { PlayerQuestActionType } from "../enums/player_quest_action_type";
import { QuestAction, QuestActionConstructorArgs } from "./quest_action";

export class CollectGoldQuestAction extends QuestAction {
    readonly requiredGold!: number;

    public constructor(args: QuestActionConstructorArgs<CollectGoldQuestAction, "requiredGold">) {
        super(args);
    }

    GetType(): PlayerQuestActionType {
        return PlayerQuestActionType.COLLECT_GOLD;
    }

    GetRequiredProgress(): number {
        return this.requiredGold;
    }
}

export const IsCollectGoldQuestAction = (b: QuestAction): b is CollectGoldQuestAction => {
    const convertedAction = b as CollectGoldQuestAction;

    return convertedAction.requiredGold !== undefined;
};
