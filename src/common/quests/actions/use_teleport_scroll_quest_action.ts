import { PlayerQuestActionType } from "../enums/player_quest_action_type";
import { QuestAction, QuestActionConstructorArgs } from "./quest_action";

export class UseTeleportScrollQuestAction extends QuestAction {
    readonly teleportScrollsToUse!: number;

    public constructor(args: QuestActionConstructorArgs<UseTeleportScrollQuestAction, "teleportScrollsToUse">) {
        super(args);
    }

    GetType(): PlayerQuestActionType {
        return PlayerQuestActionType.TALK_TO_NPC;
    }

    GetRequiredProgress(): number {
        return this.teleportScrollsToUse;
    }
}

export const IsUseTeleportScrollQuestAction = (b: QuestAction): b is UseTeleportScrollQuestAction => {
    const convertedAction = b as UseTeleportScrollQuestAction;

    return convertedAction.teleportScrollsToUse !== undefined;
};
