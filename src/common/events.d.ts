/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * This file contains types for the events you want to send between the UI (Panorama)
 * and the server (VScripts).
 *
 * IMPORTANT:
 *
 * The dota engine will change the type of event data slightly when it is sent, so on the
 * Panorama side your event handlers will have to handle NetworkedData<EventType>, changes are:
 *   - Booleans are turned to 0 | 1
 *   - Arrays are automatically translated to objects when sending them as event. You have
 *     to change them back into arrays yourself! Use TSUtils.ToArray(obj)
 */

// To declare an event for use, add it to this table with the type of its data

interface CustomGameEventDeclarations {
    mountain_dota_hud_show_hud_error: MountainDotaHUDShowHudError;
    quests_quest_finished: QuestFinishedEvent;
    quests_quest_abandoned: QuestAbandonedEvent;
    quests_quest_accepted: QuestAcceptedEvent;
    quests_quest_npc_selected: QuestNpcSelectedEvent;
    selection_player_update: SelectionPlayerUpdateEvent;
    custom_shop_purchase_neutral_item: CustomShopPurchaseOrTakeNeutralItem;
    custom_shop_put_item_neutral_stash: CustomShopPutItemNeutralStashData;
    custom_shop_take_neutral_item: CustomShopPurchaseOrTakeNeutralItem;
    custom_shop_get_data: any;
    custom_hero_stats_create_or_update: any;
    custom_hero_stats_timer: any;
    custom_hero_stats_change_stat: CustomHeroStatsChangeStat;
    custom_hero_stats_update_progress_bar: any;
    hero_gold_fix_update_label: any;
    hero_gold_fix_update_table: HeroGoldFixUpgateTable;
    load_top_table: any;
    CDOTA_BaseNPC_MidasData: CDOTA_BaseNPC_MidasData;
}

interface CDOTA_BaseNPC_MidasData extends CDOTA_BaseNPC {
    CurrentCharges: number;
}

interface HeroGoldFixUpgateTable {
    ID: PlayerID;
    PlayerID: PlayerID;
}

interface HeroGoldFixAutoUse {
    StatName: string;
    PlayerID: PlayerID;
}

interface CustomHeroStatsChangeStat {
    StatPerPoint: number;
    StatName: string;
    PlayerID: PlayerID;
    CountPoint: number;
    StatLimit: number;
}

interface MountainDotaHUDShowHudError {
    message: string;
}

interface QuestFinishedEvent {
    quest_id: number;
    abandoned: boolean;
}

interface QuestAbandonedEvent {
    quest_id: number;
}

interface QuestAcceptedEvent {
    quest_id: number;
}

interface QuestNpcSelectedEvent {
    entity_index: EntityIndex;
}

interface SelectionPlayerUpdateEvent {
    unit: EntityIndex;
}

interface CustomShopPurchaseOrTakeNeutralItem {
    data: {
        tier: number;
        itemName: string;
        itemCost: number;
    };
    PlayerID: PlayerID;
    hasPurchased: number;
}

interface CustomShopPutItemNeutralStashData {
    itemName: string;
}

interface ModifierUnitBossData {
    bossStats: { [key: string]: BossStatsData };
}

interface BossStatsData {
    StatusResistance: number;
    IgnoreMovespeedLimit: 0 | 1; // 0 == false, 1 == true
    MovespeedLimit: number;
    ProvidesFOWVision: 0 | 1; // 0 == false, 1 == true
    MaxDamagePctForPurge: number;
    AdditionalArmor: number;
    Unslowable: boolean;
    Items: { [key: number]: ItemData };
}

interface ItemData {
    ItemName: string;
    ItemLevel: number;
}
