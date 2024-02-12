import { PlayerQuestActionType } from "../enums/player_quest_action_type";
import { QuestAction, QuestActionConstructorArgs } from "./quest_action";

export class TalkToNpcQuestAction extends QuestAction {
    readonly npcName!: string;

    public constructor(args: QuestActionConstructorArgs<TalkToNpcQuestAction, "npcName">) {
        super(args);
    }

    GetType(): PlayerQuestActionType {
        return PlayerQuestActionType.TALK_TO_NPC;
    }

    GetRequiredProgress(): number {
        return 1;
    }
}

export const IsTalkToNpcQuestAction = (b: QuestAction): b is TalkToNpcQuestAction => {
    const convertedAction = b as TalkToNpcQuestAction;

    return convertedAction.npcName !== undefined;
};
