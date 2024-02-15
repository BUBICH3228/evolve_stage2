import { QuestID, QuestsList } from "../common/data/quests";
import { IsPlayerCanTakeQuest } from "../common/quests/common";
import { PlayerQuestActionType } from "../common/quests/enums/player_quest_action_type";
import { PlayerQuestHistoryState } from "../common/quests/enums/player_quest_history_state";
import { PlayerQuest } from "../common/quests/player_quest";
import { PlayerQuestAction } from "../common/quests/player_quest_action";
import {
    GetQuestsPlayerTableNameForPlayer,
    PlayerQuestsTablePlayerQuests,
    PlayerQuestsTableRow
} from "../common/quests/playertables/player_quests_table";
import { TSUtils } from "./ts_utils";

// eslint-disable-next-line no-var
var PlayerTables = GameUI.CustomUIConfig().PlayerTables;

declare global {
    interface CustomUIConfig {
        Quests: Quests;
    }
}

declare interface Quests {
    IsPlayerHaveQuest: (questId: QuestID) => boolean;
    IsPlayerCanTakeQuest: (questId: QuestID) => boolean;
    GetPlayerQuest: (questId: QuestID) => PlayerQuest | undefined;
    GetPlayerQuests: () => PlayerQuestsTablePlayerQuests;
    GetPlayerQuestHistoryState: (questId: QuestID) => PlayerQuestHistoryState;
    ListenToLocalPlayerQuestsChangedEvent: (callback: () => void) => void;
    GetLocalizationForQuestAction: (action: PlayerQuestAction) => string;
    GetLocalizationForQuestName: (questId: QuestID) => string;
    GetLocalizationForQuestDescription: (questId: QuestID) => string;
    GetNpcsWithAvailableQuests: () => NpcsWithQuests;
}

type QuestsInternalDataCallback = () => void;
type QuestsWithInternalData = Quests & {
    _callbacks: QuestsInternalDataCallback[];
    _questsData: PlayerQuestsTableRow;
    _questIds: QuestID[];
};

type NpcsWithQuests = {
    [key: string]: QuestID[];
};

// eslint-disable-next-line no-var
var Quests: QuestsWithInternalData = {
    _callbacks: [],
    _questsData: {
        playerQuests: {},
        playerQuestsHistory: {}
    },
    _questIds: [],
    IsPlayerHaveQuest: (questId: QuestID) => {
        return Quests.GetPlayerQuest(questId) != undefined;
    },
    IsPlayerCanTakeQuest: (questId: QuestID) => {
        const playerHero = Players.GetPlayerHeroEntityIndex(Game.GetLocalPlayerID());
        if (playerHero < 0) {
            return false;
        }
        const playerLevel = Entities.GetLevel(playerHero);

        return IsPlayerCanTakeQuest(playerLevel, Quests._questsData.playerQuests, Quests._questsData.playerQuestsHistory, questId);
    },
    GetPlayerQuest: (questId: QuestID) => {
        return Quests._questsData.playerQuests[questId];
    },
    GetPlayerQuests: () => {
        return Quests._questsData.playerQuests;
    },
    GetPlayerQuestHistoryState: (questId: QuestID) => {
        return Quests._questsData.playerQuestsHistory[questId] ?? PlayerQuestHistoryState.UNKNOWN;
    },
    ListenToLocalPlayerQuestsChangedEvent: (callback: () => void) => {
        Quests._callbacks.push(callback);
        callback();
    },
    GetLocalizationForQuestAction: (action: PlayerQuestAction) => {
        let localization = "Missing localization";
        switch (action.type) {
            case PlayerQuestActionType.KILL_ENEMIES:
                localization = $.Localize("#ui_quests_action_kill_enemies");
                localization = Utils.ReplaceAll(localization, "%UNIT_NAME%", $.Localize("#" + action.unitName));
                break;
            case PlayerQuestActionType.COLLECT_GOLD:
                localization = $.Localize("#ui_quests_action_collect_gold");
                break;
            case PlayerQuestActionType.DEAL_DAMAGE:
                localization = $.Localize("#ui_quests_action_deal_damage");
                break;
            case PlayerQuestActionType.TALK_TO_NPC:
                localization = $.Localize("#ui_quests_action_talk_to_npc");
                localization = Utils.ReplaceAll(localization, "%NPC_NAME%", $.Localize("#" + action.talkNpcName));
                break;
            case PlayerQuestActionType.REACH_HERO_LEVEL:
                localization = $.Localize("#ui_quests_action_reach_hero_level");
                localization = Utils.ReplaceAll(localization, "%HERO_LEVEL%", action.requiredHeroLevel?.toString() ?? "-1");
                break;
            default:
                break;
        }

        return localization;
    },
    GetLocalizationForQuestName: (questId: QuestID) => {
        return $.Localize("#ui_quests_" + QuestsList[questId].name);
    },
    GetLocalizationForQuestDescription: (questId: QuestID) => {
        return $.Localize("#ui_quests_" + QuestsList[questId].name + "_description");
    },
    GetNpcsWithAvailableQuests: () => {
        const result: NpcsWithQuests = {};

        Quests._questIds.forEach((questId) => {
            result[QuestsList[questId].npcName] ??= [];
            if (Quests.IsPlayerCanTakeQuest(questId)) {
                result[QuestsList[questId].npcName].push(questId);
            }
        });

        return result;
    }
};

function FirePlayerQuestsDataChangedEvent() {
    Quests._callbacks.forEach((callback) => {
        try {
            callback();
        } catch (error) {
            const exception = error as Error;
            $.Msg("FirePlayerQuestsDataChangedEvent callback error.");
            $.Msg(exception);
            $.Msg(exception.stack);
        }
    });
}

function ConvertPlayerQuest(quest: PlayerQuest): PlayerQuest {
    const playerQuestActions: PlayerQuestAction[] = [];

    for (const key of TSUtils.KeysOf(quest.actions)) {
        const playerQuestAction = quest.actions[key];

        const convertedPlayerQuestAction: PlayerQuestAction = {
            currentProgress: playerQuestAction.currentProgress,
            maxProgress: playerQuestAction.maxProgress,
            type: playerQuestAction.type,
            requiredCompletedQuestActions: TSUtils.ToArray<number>(playerQuestAction.requiredCompletedQuestActions),
            unitName: playerQuestAction.unitName,
            requiredGold: playerQuestAction.requiredGold,
            requiredDamageDone: playerQuestAction.requiredDamageDone,
            talkNpcName: playerQuestAction.talkNpcName,
            requiredHeroLevel: playerQuestAction.requiredHeroLevel,
            infoTargetName: playerQuestAction.infoTargetName,
            teleportScrollsToUse: playerQuestAction.teleportScrollsToUse
        };

        playerQuestActions.push(convertedPlayerQuestAction);
    }

    return {
        questId: quest.questId,
        actions: playerQuestActions
    };
}

function OnPlayerQuestsDataReceived() {
    const playerId = Game.GetLocalPlayerID();
    const tableName = GetQuestsPlayerTableNameForPlayer(playerId);
    const playerData = PlayerTables.GetAllTableValues<PlayerQuestsTableRow>(tableName);

    if (playerData == undefined) {
        return;
    }

    Quests._questsData.playerQuests = {};
    Quests._questsData.playerQuestsHistory = playerData.playerQuestsHistory;

    for (const key of TSUtils.KeysOf<QuestID>(playerData.playerQuests)) {
        Quests._questsData.playerQuests[key] = ConvertPlayerQuest(playerData.playerQuests[key]!);
    }
    FirePlayerQuestsDataChangedEvent();
}

function TryRegisterListener() {
    const localPlayerId = Players.GetLocalPlayer();
    if (localPlayerId < 0) {
        $.Schedule(0.25, TryRegisterListener);
        return;
    }
    const playerTableName = GetQuestsPlayerTableNameForPlayer(localPlayerId);
    PlayerTables.SubscribeNetTableListener(playerTableName, () => OnPlayerQuestsDataReceived());
}

(function () {
    Quests._questIds = TSUtils.KeysOf<QuestID>(QuestsList);
    TryRegisterListener();
})();

GameUI.CustomUIConfig().Quests = Quests;
