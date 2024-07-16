import { PlayerQuest } from "../common/quests/player_quest";
import { QuestID, QuestsList } from "../common/data/quests";
import { PlayerQuestAction } from "../common/quests/player_quest_action";
import { PlayerQuestHistoryState } from "../common/quests/enums/player_quest_history_state";
import {
    PlayerQuestsTablePlayerQuests,
    PlayerQuestsTableRow,
    GetQuestsPlayerTableNameForPlayer,
    PlayerQuestsTablePlayerQuestsHistory
} from "../common/quests/playertables/player_quests_table";
import {
    IsPlayerCanTakeQuest,
    IsPlayerQuestActionCompleted,
    IsPlayerQuestCompleted,
    QuestDirectionData,
    QuestDirectionType,
    pathToHasQuestParticle,
    questNpcInteractionRange
} from "../common/quests/common";
import { PlayerQuestActionType } from "../common/quests/enums/player_quest_action_type";
import { reloadable } from "./tstl-utils";
import { modifier_quest_npc } from "../modifiers/modifier_quest_npc";
import { Utility } from "./utility";

type QuestWorldPanels = Partial<Record<QuestID, WorldPanel[]>>;

@reloadable
export class Quests {
    private modifyGoldReasonsForGoldGainedEvent!: ModifyGoldReason[];
    private static _playerTablesInitialized: boolean;
    private _questNpcInteractionRangeSqr = questNpcInteractionRange * questNpcInteractionRange;
    private _npcsWithQuests: Record<string, boolean> = {};
    private static _infoTargetPositions: Partial<Record<string, Vector>> = {};
    private _questTimerTickInverval = 1;
    private static _questWorldPanels: Partial<Record<PlayerID, QuestWorldPanels>> = {};

    constructor() {
        this.modifyGoldReasonsForGoldGainedEvent = [
            ModifyGoldReason.BUILDING,
            ModifyGoldReason.HERO_KILL,
            ModifyGoldReason.CREEP_KILL,
            ModifyGoldReason.NEUTRAL_KILL
        ];

        ListenToGameEvent("entity_killed", (event) => this.OnEntityKilled(event), this);
        ListenToGameEvent("game_rules_state_change", () => this.OnGameRulesStateChanged(), this);

        CustomEvents.RegisterEventHandler(CustomEvent.CUSTOM_EVENT_ON_PRE_PLAYER_GAIN_GOLD, (data) =>
            this.OnPlayerGainedGold(data as ModifyGoldFilterEvent)
        );
        CustomEvents.RegisterEventHandler(CustomEvent.CUSTOM_EVENT_ON_PRE_TAKE_DAMAGE, (data) =>
            this.OnPlayerDealsDamage(data as CustomEventPreTakeDamageEvent)
        );

        CustomEvents.RegisterEventHandler(CustomEvent.CUSTOM_EVENT_ON_ADDON_PRECACHE, (data) => {
            const event = data as CustomEventAddonPrecacheEvent;
            PrecacheResource(PrecacheType.SOUNDFILE, "soundevents/custom/game_sounds_quests.vsndevts", event.context);
            PrecacheResource(PrecacheType.PARTICLE, pathToHasQuestParticle, event.context);
        });
        CustomEvents.RegisterEventHandler(CustomEvent.CUSTOM_EVENT_ON_PLAYER_SELECTED_UNIT, (data) => {
            const event = data as CustomEventPlayerSelectedUnitEvent;
            this.OnPlayerSelectedUnit(event);
        });

        CustomEvents.RegisterEventHandler(CustomEvent.CUSTOM_EVENT_ON_PLAYER_HERO_CHANGED, (data) => {
            const event = data as CustomEventPlayerHeroChangedEvent;
            this.OnPlayerHeroChanged(event);
        });
        Timers.CreateTimer(this._questTimerTickInverval, () => {
            try {
                this.OnQuestsTimerTick();
            } catch (e) {
                Utility.Debug_PrintError(e);
            }
            return this._questTimerTickInverval;
        });

        this.SetupListOfNpcsWithAnyQuests();

        Quests._playerTablesInitialized = false;
    }

    private OnGameRulesStateChanged(): void {
        const currentState = GameRules.State_Get();

        if (currentState >= GameState.PRE_GAME && !Quests._playerTablesInitialized) {
            this.ForEachPlayer((playerId) => {
                const playerTableName = GetQuestsPlayerTableNameForPlayer(playerId);
                PlayerTables.CreateTable(playerTableName, undefined, [playerId]);
            });
            this.SetupListOfInfoTargetPositions();
            this.SpawnQuestsNpcs();
            Quests._playerTablesInitialized = true;
        }
    }

    private SetPlayerQuestActionCurrentProgress(action: PlayerQuestAction, progress: number) {
        action.currentProgress = Math.max(0, Math.min(progress, action.maxProgress));
    }

    private IncreasePlayerQuestActionCurrentProgress(action: PlayerQuestAction, progress: number) {
        this.SetPlayerQuestActionCurrentProgress(action, action.currentProgress + progress);
    }

    private OnQuestsTimerTick(): void {
        this.ForEachPlayer((playerId) => {
            const playerHero = PlayerResource.GetSelectedHeroEntity(playerId);
            if (playerHero != undefined) {
                const playerHeroLevel = playerHero.GetLevel();
                this.ForEachModifiablePlayerQuestActionOfPlayer(playerId, PlayerQuestActionType.REACH_HERO_LEVEL, (playerAction) => {
                    this.SetPlayerQuestActionCurrentProgress(playerAction, playerHeroLevel);
                });
            }
        });
    }

    private OnPlayerDealsDamage(event: CustomEventPreTakeDamageEvent): void {
        const attacker = event.attacker;
        const playerId = attacker.GetPlayerOwnerID();

        if (!PlayerResource.IsValidPlayerID(playerId)) {
            return;
        }
        this.ForEachModifiablePlayerQuestActionOfPlayer(playerId, PlayerQuestActionType.DEAL_DAMAGE, (playerAction) => {
            this.IncreasePlayerQuestActionCurrentProgress(playerAction, event.damage);
        });
    }

    private OnPlayerGainedGold(event: ModifyGoldFilterEvent): void {
        const isEventValid = this.modifyGoldReasonsForGoldGainedEvent.includes(event.reason_const);

        if (!isEventValid) {
            return;
        }

        const playerId = event.player_id_const;

        if (!PlayerResource.IsValidPlayerID(playerId)) {
            return;
        }

        this.ForEachModifiablePlayerQuestActionOfPlayer(playerId, PlayerQuestActionType.COLLECT_GOLD, (playerAction) => {
            this.IncreasePlayerQuestActionCurrentProgress(playerAction, event.gold);
        });
    }

    private OnEntityKilled(event: EntityKilledEvent): void {
        const attacker = EntIndexToHScript(event.entindex_attacker) as CDOTA_BaseNPC;
        const attackerPlayerId = attacker.GetPlayerOwnerID();

        if (!PlayerResource.IsValidPlayerID(attackerPlayerId)) {
            return;
        }

        const killed = EntIndexToHScript(event.entindex_killed) as CDOTA_BaseNPC;
        const killedUnitName = killed.GetUnitName();

        this.ForEachModifiablePlayerQuestActionOfPlayer(attackerPlayerId, PlayerQuestActionType.KILL_ENEMIES, (playerAction) => {
            if (playerAction.unitName == killedUnitName) {
                this.IncreasePlayerQuestActionCurrentProgress(playerAction, 1);
            }
        });
    }

    private OnPlayerSelectedUnit(event: CustomEventPlayerSelectedUnitEvent): void {
        const selectedNpc = event.unit;
        const playerHero = PlayerResource.GetSelectedHeroEntity(event.player_id);
        if (playerHero == undefined || selectedNpc == playerHero) {
            return;
        }
        if (selectedNpc.GetTeamNumber() != playerHero.GetTeamNumber()) {
            return;
        }
        if (Utility.CalculateDistanceSqr(selectedNpc, playerHero) > this._questNpcInteractionRangeSqr) {
            return;
        }

        const selectedUnitName = selectedNpc.GetUnitName();

        this.ForEachModifiablePlayerQuestActionOfPlayer(event.player_id, PlayerQuestActionType.TALK_TO_NPC, (playerAction) => {
            if (playerAction.talkNpcName == selectedUnitName) {
                this.IncreasePlayerQuestActionCurrentProgress(playerAction, 1);
            }
        });

        if (!this.IsNpcHaveAnyQuests(selectedNpc)) {
            return;
        }

        const player = PlayerResource.GetPlayer(event.player_id);
        if (player != undefined) {
            CustomGameEventManager.Send_ServerToPlayer(player, "quests_quest_npc_selected", {
                entity_index: selectedNpc.entindex()
            });
        }
    }

    private OnPlayerHeroChanged(event: CustomEventPlayerHeroChangedEvent): void {
        const playerId = event.hero.GetPlayerOwnerID();
        for (const [questId, quest] of Object.entries(QuestsList)) {
            if (quest.addQuestOnHeroSelected == true) {
                Quests.AddQuestToPlayer(playerId, questId);
            }
        }
    }

    private SetupListOfNpcsWithAnyQuests() {
        for (const [_, quest] of Object.entries(QuestsList)) {
            this._npcsWithQuests[quest.npcName] = true;
        }
    }

    private SetupListOfInfoTargetPositions() {
        for (const [_, quest] of Object.entries(QuestsList)) {
            for (const [_, action] of Object.entries(quest.actions)) {
                if (action.infoTargetName != undefined && Quests._infoTargetPositions[action.infoTargetName] == undefined) {
                    const infoTarget = Entities.FindByName(undefined, action.infoTargetName);
                    if (infoTarget == undefined) {
                        Utility.Debug_PrintError("Can't find info target named ", action.infoTargetName, " on map!");
                    } else {
                        Quests._infoTargetPositions[action.infoTargetName] = infoTarget.GetAbsOrigin();
                    }
                }
            }
        }
    }

    private static GetInfoTargetPosition(infoTargetName: string): Vector | undefined {
        return Quests._infoTargetPositions[infoTargetName];
    }

    private SpawnQuestsNpcs() {
        for (const [npcName, _] of Object.entries(this._npcsWithQuests)) {
            const infoTarget = Entities.FindByName(undefined, npcName);

            if (infoTarget != undefined) {
                const position = GetGroundPosition(infoTarget.GetAbsOrigin(), undefined);
                const angle = infoTarget.GetForwardVector();
                const npc = CreateUnitByName(
                    npcName,
                    position,
                    false,
                    undefined,
                    undefined,
                    GameSettings.GetSettingValueAsTeamNumber("players_team")
                );
                if (npc != undefined) {
                    Timers.CreateTimer(0.05, () => {
                        npc.SetForwardVector(angle);
                        npc.AddNewModifier(npc, undefined, modifier_quest_npc.name, { duration: -1 });
                    });
                }
            } else {
                Utility.Debug_PrintError("Can't find info target named ", npcName, "!");
            }
        }
    }

    private IsNpcHaveAnyQuests(npc: CDOTA_BaseNPC) {
        return this._npcsWithQuests[npc.GetUnitName()] != undefined;
    }

    private IsPlayerQuestActionCanBeModified(playerQuest: PlayerQuest, action: PlayerQuestAction): boolean {
        if (action.requiredCompletedQuestActions.length == 0) {
            return true;
        }

        let isActionCanBeModified = true;

        action.requiredCompletedQuestActions.forEach((actionIndex) => {
            const requiredAction = playerQuest.actions[actionIndex];
            if (requiredAction == undefined) {
                return false;
            }
            isActionCanBeModified =
                isActionCanBeModified && IsPlayerQuestActionCompleted(requiredAction.currentProgress, requiredAction.maxProgress);
        });

        return isActionCanBeModified;
    }

    private ForEachModifiablePlayerQuestActionOfPlayer(
        playerId: PlayerID,
        type: PlayerQuestActionType,
        callback: (action: PlayerQuestAction) => void
    ): void {
        const playerQuests = Quests.GetPlayerQuests(playerId);

        for (const [_, playerQuest] of Object.entries(playerQuests)) {
            if (playerQuest != undefined) {
                for (const playerAction of playerQuest.actions) {
                    if (playerAction.type == type && this.IsPlayerQuestActionCanBeModified(playerQuest, playerAction)) {
                        try {
                            callback(playerAction);
                        } catch (e) {
                            Utility.Debug_PrintError(e);
                        }
                    }
                }
            }
        }
        this.UpdatePlayerQuestsDataForClient(playerId, playerQuests);
        for (const [_, playerQuest] of Object.entries(playerQuests)) {
            if (playerQuest != undefined) {
                this.TryFinishPlayerQuest(playerId, playerQuest.questId);
            }
        }
    }

    private ForEachPlayer(callback: (playerId: PlayerID) => void): void {
        const playersTeam = GameSettings.GetSettingValueAsTeamNumber("players_team");
        const playersInPlayerTeam = PlayerResource.GetPlayerCountForTeam(playersTeam);

        for (let i = 0; i < playersInPlayerTeam; i++) {
            const playerId = PlayerResource.GetNthPlayerIDOnTeam(playersTeam, i + 1);
            try {
                callback(playerId);
            } catch (e) {
                Utility.Debug_PrintError(e);
            }
        }
    }

    private UpdatePlayerQuestsDataForClient(playerId: PlayerID, data: PlayerQuestsTablePlayerQuests) {
        const playerData = Quests.GetPlayerData(playerId);
        playerData.playerQuests = data;
        Quests.SetPlayerData(playerId, playerData);
    }

    private TryFinishPlayerQuest(playerId: PlayerID, questId: QuestID) {
        const playerQuest = Quests.GetPlayerQuest(playerId, questId);
        if (playerQuest == undefined) {
            return;
        }

        if (!IsPlayerQuestCompleted(true, playerQuest.actions)) {
            return;
        }

        this.GiveRewardForPlayerQuest(playerId, questId);
        Quests.RemoveQuestFromPlayer(playerId, questId, false);
        Quests.SetPlayerQuestHistoryState(playerId, questId, PlayerQuestHistoryState.COMPLETED);
    }

    public static CancelPlayerQuest(playerId: PlayerID, questId: QuestID) {
        Quests.RemoveQuestFromPlayer(playerId, questId, true);
    }

    private GiveRewardForPlayerQuest(playerId: PlayerID, questId: QuestID) {
        const player = PlayerResource.GetPlayer(playerId);

        // Как минимум шмотки требуют игрока в игре (проверяем и ждём реконнекта если надо)...
        if (player == undefined) {
            Timers.CreateTimer(
                1,
                () => {
                    this.GiveRewardForPlayerQuest(playerId, questId);
                },
                this
            );
            return;
        }

        const quest = QuestsList[questId];

        if (quest.rewards == undefined) {
            return;
        }

        const goldReward = quest.rewards?.gold;

        if (goldReward != undefined) {
            PlayerResource.ModifyGold(playerId, goldReward, true, ModifyGoldReason.UNSPECIFIED);
        }

        const heroExperienceReward = quest.rewards?.heroExperience;

        if (heroExperienceReward != undefined) {
            const playerHero = PlayerResource.GetSelectedHeroEntity(playerId);

            if (playerHero != undefined) {
                playerHero.AddExperience(heroExperienceReward, ModifyXpReason.UNSPECIFIED, false, true);
            }
        }

        const itemsReward = quest.rewards?.items;

        if (itemsReward != undefined) {
            const playerHero = PlayerResource.GetSelectedHeroEntity(playerId);

            if (playerHero != undefined) {
                const playerHeroPosition = playerHero.GetAbsOrigin();

                for (const itemName of itemsReward) {
                    const itemToAdd = CreateItem(itemName, player, player);

                    // Если прописали кривой предмет
                    if (itemToAdd != undefined) {
                        itemToAdd.SetPurchaser(playerHero);
                        const itemInPlayerInventory = playerHero.AddItem(itemToAdd);

                        // Если в игрока не влезло
                        if (itemInPlayerInventory == undefined) {
                            CreateItemOnPositionSync(playerHeroPosition, itemToAdd);
                        }
                    }
                }
            }
        }
    }

    public static AddQuestToPlayer(playerId: PlayerID, questId: QuestID): PlayerQuest | undefined {
        if (this.IsPlayerHaveQuest(playerId, questId)) {
            Utility.Debug_PrintError("Attempt to add already existing quest with id = ", questId);
            return;
        }

        const playerData = this.GetPlayerData(playerId);

        playerData.playerQuests[questId] = new PlayerQuest(questId);

        this.SetPlayerData(playerId, playerData);

        const playerQuest = this.GetPlayerQuest(playerId, questId)!;
        this.CreateWorldPanelsForPlayerQuestActions(playerId, playerQuest);

        return playerQuest;
    }

    private static CreateWorldPanelsForPlayerQuestActions(playerId: PlayerID, quest: PlayerQuest) {
        quest.actions.forEach((action) => {
            this.CreateWorldPanelForAction(playerId, quest.questId, action);
        });
    }

    private static CreateWorldPanelForAction(playerId: PlayerID, questId: QuestID, action: PlayerQuestAction) {
        if (action.infoTargetName == undefined) {
            return;
        }
        const position = this.GetInfoTargetPosition(action.infoTargetName);

        if (position == undefined) {
            Utility.Debug_PrintError("Attempt to create world panel for invalid info target: ", action.infoTargetName);
            return;
        }

        const arrowWorldPanel = WorldPanels.CreateWorldPanelForAll<QuestDirectionData>({
            layout: "file://{resources}/layout/custom_game/quests/quest_direction_arrow.xml",
            position: position,
            edgePadding: 25,
            data: {
                questId: questId,
                action: action,
                type: QuestDirectionType.ARROW
            }
        });
        const worldPanel = WorldPanels.CreateWorldPanelForAll<QuestDirectionData>({
            layout: "file://{resources}/layout/custom_game/quests/quest_world_panel.xml",
            position: position,
            data: {
                questId: questId,
                action: action,
                type: QuestDirectionType.WORLD_PANEL
            }
        });

        Quests._questWorldPanels[playerId] ??= {};
        Quests._questWorldPanels[playerId]![questId] ??= [];
        Quests._questWorldPanels[playerId]![questId]!.push(arrowWorldPanel);
        Quests._questWorldPanels[playerId]![questId]!.push(worldPanel);
    }

    private static RemoveWorldPanelsForQuest(playerId: PlayerID, questId: QuestID) {
        if (Quests._questWorldPanels[playerId] == undefined) {
            return;
        }

        Quests._questWorldPanels[playerId]![questId]?.forEach((wp) => {
            wp.Delete();
        });
    }

    public static RemoveQuestFromPlayer(playerId: PlayerID, questId: QuestID, abandoned: boolean) {
        if (!this.IsPlayerHaveQuest(playerId, questId)) {
            return;
        }

        const playerData = this.GetPlayerData(playerId);

        playerData.playerQuests[questId] = undefined;

        this.SetPlayerData(playerId, playerData);

        this.RemoveWorldPanelsForQuest(playerId, questId);

        const player = PlayerResource.GetPlayer(playerId);
        if (player != undefined) {
            CustomGameEventManager.Send_ServerToPlayer(player, "quests_quest_finished", {
                quest_id: questId,
                abandoned: abandoned
            });
        }
    }

    public static IsPlayerCanTakeQuest(playerId: PlayerID, questId: QuestID): boolean {
        const playerHero = PlayerResource.GetSelectedHeroEntity(playerId);
        if (playerHero == undefined) {
            return false;
        }

        return IsPlayerCanTakeQuest(
            playerHero.GetLevel(),
            this.GetPlayerQuests(playerId),
            this.GetPlayerQuestsHistoryState(playerId),
            questId
        );
    }

    public static IsPlayerHaveQuest(playerId: PlayerID, questId: QuestID): boolean {
        return this.GetPlayerQuest(playerId, questId) != null;
    }

    public static GetPlayerQuests(playerId: PlayerID): PlayerQuestsTablePlayerQuests {
        return this.GetPlayerData(playerId)!.playerQuests;
    }

    public static GetPlayerQuest(playerId: PlayerID, questId: QuestID): PlayerQuest | undefined {
        return this.GetPlayerQuests(playerId)[questId];
    }

    private static SetPlayerData(playerId: PlayerID, data: PlayerQuestsTableRow): void {
        const playerTableName = GetQuestsPlayerTableNameForPlayer(playerId);
        PlayerTables.SetTableValues(playerTableName, data);
    }

    private static GetPlayerData(playerId: PlayerID): PlayerQuestsTableRow {
        const playerTableName = GetQuestsPlayerTableNameForPlayer(playerId);
        let playerData = PlayerTables.GetAllTableValues<PlayerQuestsTableRow>(playerTableName)!;

        if (playerData.playerQuests == undefined) {
            playerData = {
                playerQuests: {},
                playerQuestsHistory: {}
            };

            this.SetPlayerData(playerId, playerData);
        }

        return playerData;
    }

    private static SetPlayerQuestHistoryState(playerId: PlayerID, questId: QuestID, state: PlayerQuestHistoryState): void {
        const playerData = Quests.GetPlayerData(playerId);

        playerData.playerQuestsHistory[questId] = state;

        Quests.SetPlayerData(playerId, playerData);
    }

    private static GetPlayerQuestsHistoryState(playerId: PlayerID): PlayerQuestsTablePlayerQuestsHistory {
        const playerData = Quests.GetPlayerData(playerId);

        return playerData.playerQuestsHistory;
    }
}

declare global {
    // eslint-disable-next-line no-var
    var _questsInitialized: boolean;
}

if (IsServer() && !_G._questsInitialized) {
    new Quests();
    _G._questsInitialized = true;
}
