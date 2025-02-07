import { Settings } from "./data/game_settings";
import { reloadable } from "./libraries/tstl-utils";

@reloadable
export class GameSettings {
    static _isLoaded: null | boolean;
    constructor() {
        this.Initialize();
    }

    private Initialize() {
        ListenToGameEvent("game_rules_state_change", () => this.OnGameRulesStateChange(), undefined);
        const timeTxt = string.gsub(string.gsub(GetSystemTime(), ":", "")[0], "0", "");
        math.randomseed(Number(timeTxt));
    }

    private OnGameRulesStateChange() {
        const newState = GameRules.State_Get();
        if (newState == GameState.PRE_GAME) {
            //const customBuybackCooldown = Settings.server.custom_buyback_cooldown;
            //const customBuybackCost = Settings.server.custom_buyback_cost;
            //const isCustomBuybackCostEnabled = Settings.server.custom_buyback_cost_enabled;
            //const isCustomBuybackCooldownEnabled = Settings.server.custom_buyback_cooldown_enabled;
            //for (let i = 1; PlayerResource.GetPlayerCountForTeam(DotaTeam.GOODGUYS); i++) {
            //    const playerID = PlayerResource.GetNthPlayerIDOnTeam(DotaTeam.GOODGUYS, i);
            //    if (playerID > -1) {
            //        if (isCustomBuybackCooldownEnabled) {
            //            PlayerResource.SetCustomBuybackCooldown(playerID, customBuybackCooldown);
            //        }
            //        if (isCustomBuybackCostEnabled) {
            //            PlayerResource.SetCustomBuybackCost(playerID, customBuybackCost);
            //        }
            //    }
            //}
            this.SetIsLoaded(true);
            this.SendSettingsToAllClients();
        }
    }

    public static LoadSettings(gme: CDOTABaseGameMode) {
        const newXPTable = [];
        let needXP = 0;
        for (let index = 0; index < Settings.server.custom_exp_table.length; index++) {
            needXP += Settings.server.custom_exp_table[index];
            newXPTable[index] = needXP;
        }
        gme.SetAllowNeutralItemDrops(false);
        gme.DisableClumpingBehaviorByDefault(true);
        gme.SetFreeCourierModeEnabled(Settings.server.free_couriers_enabled);
        gme.SetRecommendedItemsDisabled(Settings.server.recommended_builds_disabled);
        gme.SetCameraDistanceOverride(Settings.server.camera_distance_override);
        gme.SetCustomBuybackCostEnabled(Settings.server.custom_buyback_cost_enabled);
        gme.SetCustomBuybackCooldownEnabled(Settings.server.custom_buyback_cooldown_enabled);
        gme.SetBuybackEnabled(Settings.server.buyback_enabled);
        gme.SetTopBarTeamValuesOverride(Settings.server.use_custom_top_bar_values);
        gme.SetTopBarTeamValuesVisible(Settings.server.top_bar_visible);
        gme.SetUseCustomHeroLevels(Settings.server.use_custom_hero_levels);
        gme.SetCustomHeroMaxLevel(Settings.server.custom_exp_table.length);
        gme.SetCustomXPRequiredToReachNextLevel(newXPTable);
        gme.SetTowerBackdoorProtectionEnabled(Settings.server.enable_tower_backdoor_protection);
        gme.SetFogOfWarDisabled(Settings.server.disable_fog_of_war_entirely);
        gme.SetUnseenFogOfWarEnabled(Settings.server.use_unseen_fog_of_war);
        gme.SetGoldSoundDisabled(Settings.server.disable_gold_sounds);
        gme.SetRemoveIllusionsOnDeath(Settings.server.remove_illusions_on_death);
        gme.SetGiveFreeTPOnDeath(Settings.server.give_free_tp_on_death);
        gme.SetTPScrollSlotItemOverride(Settings.server.tp_scroll_item_slot_override);
        gme.SetFixedRespawnTime(Settings.server.hero_respawn_time);
        gme.SetCustomAttributeDerivedStatValue(
            AttributeDerivedStats.STRENGTH_DAMAGE,
            Settings.client.dota_attribute_attack_damage_per_strength
        );
        gme.SetCustomAttributeDerivedStatValue(AttributeDerivedStats.STRENGTH_HP, Settings.client.dota_attribute_health_per_strength);
        gme.SetCustomAttributeDerivedStatValue(
            AttributeDerivedStats.STRENGTH_HP_REGEN,
            Settings.client.dota_attribute_health_regeneneration_per_strength
        );
        gme.SetCustomAttributeDerivedStatValue(
            AttributeDerivedStats.AGILITY_DAMAGE,
            Settings.client.dota_attribute_attack_damage_per_agility
        );
        gme.SetCustomAttributeDerivedStatValue(AttributeDerivedStats.AGILITY_ARMOR, Settings.client.dota_attribute_armor_per_agility);
        gme.SetCustomAttributeDerivedStatValue(
            AttributeDerivedStats.AGILITY_ATTACK_SPEED,
            Settings.client.dota_attribute_attack_speed_per_agility
        );
        gme.SetCustomAttributeDerivedStatValue(
            AttributeDerivedStats.INTELLIGENCE_DAMAGE,
            Settings.client.dota_attribute_attack_damage_per_intelligence
        );
        gme.SetCustomAttributeDerivedStatValue(
            AttributeDerivedStats.INTELLIGENCE_MANA,
            Settings.client.dota_attribute_mana_per_intelligence
        );
        gme.SetCustomAttributeDerivedStatValue(
            AttributeDerivedStats.INTELLIGENCE_MANA_REGEN,
            Settings.client.dota_attribute_mana_regeneration_per_intelligence
        );
        gme.SetCustomAttributeDerivedStatValue(AttributeDerivedStats.ALL_DAMAGE, Settings.client.dota_attribute_attack_damage_per_all);
        GameRules.LockCustomGameSetupTeamAssignment(Settings.server.gamesetup_lock);
        GameRules.SetCustomGameSetupAutoLaunchDelay(Settings.server.gamesetup_time);
        GameRules.SetHeroRespawnEnabled(Settings.server.enable_hero_respawn);
        GameRules.SetUseUniversalShopMode(Settings.server.universal_shop_mode);
        GameRules.SetSameHeroSelectionEnabled(Settings.server.allow_same_hero_selection);
        GameRules.SetHeroSelectionTime(Settings.server.hero_selection_time);
        GameRules.SetStrategyTime(Settings.server.hero_strategy_time);
        GameRules.SetShowcaseTime(Settings.server.hero_showcase_time);
        GameRules.SetPreGameTime(Settings.server.pre_game_time);
        GameRules.SetPostGameTime(Settings.server.post_game_time);
        GameRules.SetTreeRegrowTime(Settings.server.tree_regrow_time);
        GameRules.SetUseCustomHeroXPValues(Settings.server.use_custom_xp_values);
        GameRules.SetRuneSpawnTime(Settings.server.rune_spawn_time);
        GameRules.SetUseBaseGoldBountyOnHeroes(Settings.server.use_standard_hero_gold_bounty);
        GameRules.SetHeroMinimapIconScale(Settings.server.minimap_icon_scale);
        GameRules.SetCreepMinimapIconScale(Settings.server.minimap_creep_icon_scale);
        GameRules.SetRuneMinimapIconScale(Settings.server.minimap_rune_icon_scale);
        GameRules.SetStartingGold(Settings.server.starting_gold);
        GameRules.GetGameModeEntity().SetFreeCourierModeEnabled(false);
        GameRules.SetFilterMoreGold(true);
        SendToServerConsole("tv_delay " + Settings.server.game_tv_delay);
        for (const [teamNumber, value] of Object.entries(Settings.client.team_max_players)) {
            GameRules.SetCustomGameTeamMaxPlayers(teamNumber, Number(value));
        }
        for (let index = 0; index < DOTA_DEFAULT_MAX_TEAM_PLAYERS - 1; index++) {
            const playerColor = PlayerResource.GetPlayerColor(index as PlayerID);
            PlayerResource.SetCustomPlayerColor(index as PlayerID, playerColor.x, playerColor.y, playerColor.z);
        }
    }

    private SetIsLoaded(state: boolean) {
        GameSettings._isLoaded = state;
    }

    public static IsLoaded() {
        if (GameSettings._isLoaded != null) {
            return GameSettings._isLoaded;
        }
        return false;
    }

    private SendSettingsToAllClients() {
        PlayerTables.CreateTable("game_settings", Settings.client, true);
    }
}

declare global {
    // eslint-disable-next-line no-var
    var _GameSettingsInitialized: boolean;
}

if (IsServer() && !_G._GameSettingsInitialized) {
    new GameSettings();
    _G._GameSettingsInitialized = true;
}
