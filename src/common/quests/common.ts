import { QuestID, QuestsList } from "../data/quests";
import { IsCollectGoldQuestAction } from "./actions/collect_gold_quest_action";
import { IsDealDamageQuestAction } from "./actions/deal_damage_quest_action";
import { IsKillQuestAction } from "./actions/kill_quest_action";
import { QuestAction } from "./actions/quest_action";
import { IsReachHeroLevelQuestAction } from "./actions/reach_hero_level_quest_action";
import { IsTalkToNpcQuestAction } from "./actions/talk_to_npc_quest_action";
import { IsUseTeleportScrollQuestAction } from "./actions/use_teleport_scroll_quest_action";
import { PlayerQuestHistoryState } from "./enums/player_quest_history_state";
import { PlayerQuestAction } from "./player_quest_action";
import { PlayerQuestsTablePlayerQuests } from "./playertables/player_quests_table";

export const pathToHasQuestParticle = "particles/custom/quests/has_quest.vpcf";
export const questNpcInteractionRange = 400;
export const enum QuestDirectionType {
    ARROW,
    WORLD_PANEL
}
export type QuestDirectionData = { questId: QuestID; action: PlayerQuestAction; type: QuestDirectionType };

export function IsPlayerCanTakeQuest(
    heroLevel: number,
    playerQuests: PlayerQuestsTablePlayerQuests,
    history: Partial<Record<QuestID, PlayerQuestHistoryState>>,
    questId: QuestID
) {
    if (playerQuests == undefined || history == undefined) {
        return false;
    }

    const quest = QuestsList[questId];

    if (quest.repeatable == false && history[questId] == PlayerQuestHistoryState.COMPLETED) {
        return false;
    }

    if (playerQuests[questId] != undefined) {
        return false;
    }

    const questRequirments = quest.requirments;

    if (questRequirments == undefined) {
        return true;
    }

    let canTakeQuest = true;

    if (questRequirments.requiredHeroLevel != undefined) {
        canTakeQuest = canTakeQuest && heroLevel >= questRequirments.requiredHeroLevel;
    }

    if (questRequirments.completedQuests != undefined) {
        for (const requiredQuestId of questRequirments.completedQuests) {
            canTakeQuest = canTakeQuest && history[requiredQuestId] == PlayerQuestHistoryState.COMPLETED;
        }
    }

    return canTakeQuest;
}

export function IsPlayerQuestCompleted(playerHasQuest: boolean, actions: PlayerQuestAction[]): boolean {
    if (!playerHasQuest) {
        return false;
    }

    let canTakeQuest = true;

    for (const questAction of actions) {
        canTakeQuest = canTakeQuest && IsPlayerQuestActionCompleted(questAction.currentProgress, questAction.maxProgress);
    }

    return canTakeQuest;
}

export function IsPlayerQuestActionCompleted(currentProgress: number, maxProgress: number) {
    return currentProgress == maxProgress;
}

export function QuestActionToPlayerQuestAction(questAction: QuestAction): PlayerQuestAction {
    let unitName: string | undefined = undefined;
    let requiredGold: number | undefined = undefined;
    let requiredDamageDone: number | undefined = undefined;
    let talkNpcName: string | undefined = undefined;
    let requiredHeroLevel: number | undefined = undefined;
    let teleportScrollsToUse: number | undefined = undefined;

    if (IsKillQuestAction(questAction)) {
        unitName = questAction.unitName;
    }

    if (IsCollectGoldQuestAction(questAction)) {
        requiredGold = questAction.requiredGold;
    }

    if (IsDealDamageQuestAction(questAction)) {
        requiredDamageDone = questAction.requiredDamageDone;
    }

    if (IsTalkToNpcQuestAction(questAction)) {
        talkNpcName = questAction.npcName;
    }

    if (IsReachHeroLevelQuestAction(questAction)) {
        requiredHeroLevel = questAction.requiredHeroLevel;
    }

    if (IsUseTeleportScrollQuestAction(questAction)) {
        teleportScrollsToUse = questAction.teleportScrollsToUse;
    }

    return {
        currentProgress: 0,
        maxProgress: questAction.GetRequiredProgress(),
        type: questAction.GetType(),
        requiredCompletedQuestActions: questAction.requiredCompletedQuestActions,
        unitName: unitName,
        requiredGold: requiredGold,
        requiredDamageDone: requiredDamageDone,
        talkNpcName: talkNpcName,
        requiredHeroLevel: requiredHeroLevel,
        infoTargetName: questAction.infoTargetName,
        teleportScrollsToUse: teleportScrollsToUse
    };
}
