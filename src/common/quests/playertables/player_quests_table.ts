import { QuestID } from "../../data/quests";
import { PlayerQuest } from "../player_quest";
import { PlayerQuestHistoryState } from "../enums/player_quest_history_state";

export type PlayerQuestsTablePlayerQuests = Partial<Record<QuestID, PlayerQuest>>;
export type PlayerQuestsTablePlayerQuestsHistory = Partial<Record<QuestID, PlayerQuestHistoryState>>;

export type PlayerQuestsTableRow = {
    playerQuests: PlayerQuestsTablePlayerQuests;
    playerQuestsHistory: PlayerQuestsTablePlayerQuestsHistory;
};

export type PlayerQuestsTable = { [key in PlayerID]?: PlayerQuestsTableRow };

export function GetQuestsPlayerTableNameForPlayer(playerId: PlayerID) {
    return "Quests_" + playerId;
}
