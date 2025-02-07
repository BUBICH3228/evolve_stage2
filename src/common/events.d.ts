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
    team_selection_results: TeamSelectionResultsEvent;
    get_team_selection_results: any;
    show_team_selection_menu: ShowTeamSelectionMenuEvent;
    show_hero_selection_menu: ShowHeroSelectionMenuEvent;
    show_map_selection_menu: ShowMapSelectionMenuEvent;
    hero_selection_event: HeroSelectionEvent;
    fix_hero_minimap_icon: any;
    team_selection_event: TeamSelectionEvent;
    load_top_table: any;
}

interface TeamSelectionEvent {
    playerID: PlayerID;
    palyerTeam: string;
}

interface ShowMapSelectionMenuEvent {
    visibleState: boolean;
}

interface ShowTeamSelectionMenuEvent {
    visibleState: boolean;
}

interface ShowHeroSelectionMenuEvent {
    visibleState: boolean;
}

interface HeroSelectionEvent {
    HeroName: string | undefined;
    PlayerID?: PlayerID;
}

interface GetHeroAbilitiesEvent {
    heroname: string;
}

interface TeamSelectionResultsEvent {
    PlayerType: string;
    PlayerID?: PlayerID;
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
