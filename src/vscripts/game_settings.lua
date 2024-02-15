_G.GameSettings = GameSettings or class({})

-- This function initializes the game mode and is called before anyone loads into the game
-- It can be used to pre-initialize any values/tables that will be needed later
function GameSettings:Init()
	ListenToGameEvent('game_rules_state_change', Dynamic_Wrap(self, 'OnGameRulesStateChange'), self)
	-- Change random seed
	local timeTxt = string.gsub(string.gsub(GetSystemTime(), ':', ''), '0','')
	math.randomseed(tonumber(timeTxt))

	local sharedGameSettings = LoadKeyValues("scripts/kv/game_settings.kv")

	local serverOnlyGameSettings = LoadKeyValues("scripts/kv/game_settings_server_only.kv")

	local finalServerGameSettings = {}

	for k,v in pairs(sharedGameSettings) do
		finalServerGameSettings[k] = v
	end

	for k,v in pairs(serverOnlyGameSettings) do
		finalServerGameSettings[k] = v
	end
	
	GameSettings._clientKV = sharedGameSettings
	GameSettings._kv = finalServerGameSettings
end

function GameSettings:LoadSettings(gme)
	local expTableFromSettings = GameSettings:GetSettingValueAsTable("custom_exp_table")
	local maxLevel = 0
	for _, _ in pairs(expTableFromSettings) do
		maxLevel = maxLevel + 1
	end
	maxLevel = maxLevel + 1

	gme:SetAllowNeutralItemDrops(false)
	gme:DisableClumpingBehaviorByDefault(true)
	gme:SetFreeCourierModeEnabled(GameSettings:GetSettingValueAsBoolean("free_couriers_enabled"))
	gme:SetRecommendedItemsDisabled(GameSettings:GetSettingValueAsBoolean("recommended_builds_disabled"))
	gme:SetCameraDistanceOverride(GameSettings:GetSettingValueAsNumber("camera_distance_override"))
	gme:SetCustomBuybackCostEnabled(GameSettings:GetSettingValueAsBoolean("custom_buyback_cost_enabled"))
	gme:SetCustomBuybackCooldownEnabled(GameSettings:GetSettingValueAsBoolean("custom_buyback_cooldown_enabled"))
	gme:SetBuybackEnabled(GameSettings:GetSettingValueAsBoolean("buyback_enabled"))
	gme:SetTopBarTeamValuesOverride(GameSettings:GetSettingValueAsBoolean("use_custom_top_bar_values"))
	gme:SetTopBarTeamValuesVisible(GameSettings:GetSettingValueAsBoolean("top_bar_visible"))
	gme:SetUseCustomHeroLevels(GameSettings:GetSettingValueAsBoolean("use_custom_hero_levels"))
	gme:SetCustomHeroMaxLevel(maxLevel)

	local customExpTable = {}
	customExpTable[0] = 0
	for i=1, maxLevel - 1, 1 do
		local levelIndex = tostring(i)
		customExpTable[i] = customExpTable[i-1] + expTableFromSettings[levelIndex]
	end
	gme:SetCustomXPRequiredToReachNextLevel(customExpTable)

	gme:SetTowerBackdoorProtectionEnabled(GameSettings:GetSettingValueAsBoolean("enable_tower_backdoor_protection"))

	gme:SetFogOfWarDisabled(GameSettings:GetSettingValueAsBoolean("disable_fog_of_war_entirely"))
	gme:SetUnseenFogOfWarEnabled(GameSettings:GetSettingValueAsBoolean("use_unseen_fog_of_war"))
	gme:SetGoldSoundDisabled(GameSettings:GetSettingValueAsBoolean("disable_gold_sounds"))
	gme:SetRemoveIllusionsOnDeath(GameSettings:GetSettingValueAsBoolean("remove_illusions_on_death"))
	gme:SetGiveFreeTPOnDeath(GameSettings:GetSettingValueAsBoolean("give_free_tp_on_death"))
	gme:SetTPScrollSlotItemOverride(GameSettings:GetSettingValueAsString("tp_scroll_item_slot_override"))
	gme:SetFixedRespawnTime(GameSettings:GetSettingValueAsNumber("hero_respawn_time"))

	gme:SetCustomAttributeDerivedStatValue(DOTA_ATTRIBUTE_STRENGTH_DAMAGE, GameSettings:GetSettingValueAsNumber("dota_attribute_attack_damage_per_strength"))
	gme:SetCustomAttributeDerivedStatValue(DOTA_ATTRIBUTE_STRENGTH_HP, GameSettings:GetSettingValueAsNumber("dota_attribute_health_per_strength"))
	gme:SetCustomAttributeDerivedStatValue(DOTA_ATTRIBUTE_STRENGTH_HP_REGEN, GameSettings:GetSettingValueAsNumber("dota_attribute_health_regeneneration_per_strength"))

	gme:SetCustomAttributeDerivedStatValue(DOTA_ATTRIBUTE_AGILITY_DAMAGE, GameSettings:GetSettingValueAsNumber("dota_attribute_attack_damage_per_agility"))
	gme:SetCustomAttributeDerivedStatValue(DOTA_ATTRIBUTE_AGILITY_ARMOR, GameSettings:GetSettingValueAsNumber("dota_attribute_armor_per_agility"))
	gme:SetCustomAttributeDerivedStatValue(DOTA_ATTRIBUTE_AGILITY_ATTACK_SPEED, GameSettings:GetSettingValueAsNumber("dota_attribute_attack_speed_per_agility"))

	gme:SetCustomAttributeDerivedStatValue(DOTA_ATTRIBUTE_INTELLIGENCE_DAMAGE, GameSettings:GetSettingValueAsNumber("dota_attribute_attack_damage_per_intelligence"))
	gme:SetCustomAttributeDerivedStatValue(DOTA_ATTRIBUTE_INTELLIGENCE_MANA, GameSettings:GetSettingValueAsNumber("dota_attribute_mana_per_intelligence"))
	gme:SetCustomAttributeDerivedStatValue(DOTA_ATTRIBUTE_INTELLIGENCE_MANA_REGEN, GameSettings:GetSettingValueAsNumber("dota_attribute_mana_regeneration_per_intelligence"))

	gme:SetCustomAttributeDerivedStatValue(DOTA_ATTRIBUTE_ALL_DAMAGE, GameSettings:GetSettingValueAsNumber("dota_attribute_attack_damage_per_all"))

	GameRules:LockCustomGameSetupTeamAssignment(GameSettings:GetSettingValueAsBoolean("gamesetup_lock"))
	GameRules:SetCustomGameSetupAutoLaunchDelay(GameSettings:GetSettingValueAsNumber("gamesetup_time"))
	GameRules:SetHeroRespawnEnabled(GameSettings:GetSettingValueAsBoolean("enable_hero_respawn"))
	GameRules:SetUseUniversalShopMode(GameSettings:GetSettingValueAsBoolean("universal_shop_mode"))
	GameRules:SetSameHeroSelectionEnabled(GameSettings:GetSettingValueAsBoolean("allow_same_hero_selection"))
	GameRules:SetHeroSelectionTime(GameSettings:GetSettingValueAsNumber("hero_selection_time"))
	GameRules:SetStrategyTime(GameSettings:GetSettingValueAsNumber("hero_strategy_time"))	
	GameRules:SetShowcaseTime(GameSettings:GetSettingValueAsNumber("hero_showcase_time"))	
	GameRules:SetPreGameTime(GameSettings:GetSettingValueAsNumber("pre_game_time"))
	GameRules:SetPostGameTime(GameSettings:GetSettingValueAsNumber("post_game_time"))
	GameRules:SetTreeRegrowTime(GameSettings:GetSettingValueAsNumber("tree_regrow_time"))
	GameRules:SetUseCustomHeroXPValues (GameSettings:GetSettingValueAsBoolean("use_custom_xp_values"))
	GameRules:SetRuneSpawnTime(GameSettings:GetSettingValueAsNumber("rune_spawn_time"))
	GameRules:SetUseBaseGoldBountyOnHeroes(GameSettings:GetSettingValueAsBoolean("use_standard_hero_gold_bounty"))
	GameRules:SetHeroMinimapIconScale(GameSettings:GetSettingValueAsNumber("minimap_icon_scale"))
	GameRules:SetCreepMinimapIconScale(GameSettings:GetSettingValueAsNumber("minimap_creep_icon_scale"))
	GameRules:SetRuneMinimapIconScale(GameSettings:GetSettingValueAsNumber("minimap_rune_icon_scale"))
	GameRules:SetStartingGold(GameSettings:GetSettingValueAsNumber("starting_gold"))
	GameRules:GetGameModeEntity():SetFreeCourierModeEnabled(false)
	GameRules:SetFilterMoreGold(true)
	for teamNumber, value in pairs(GameSettings:GetSettingValueAsTable("team_max_players")) do
		local parsedTeamNumber = _G[teamNumber]
		local parsedValue = tonumber(value)
		if(not parsedValue or not parsedTeamNumber) then
			print("teamNumber", tostring(teamNumber), type(teamNumber))
			print("value", tostring(value), type(value))
			Debug_PrintError("GameSettings:LoadSettings failed to read \"team_max_players\". Expected format: DOTATeam_t number")
		end
		GameRules:SetCustomGameTeamMaxPlayers(parsedTeamNumber, parsedValue)
	end

    for i = 0, DOTA_DEFAULT_MAX_TEAM_PLAYERS - 1 do
        local playerColor = PlayerResource:GetPlayerColor(i)
        PlayerResource:SetCustomPlayerColor(i, playerColor.x, playerColor.y, playerColor.z)
    end
end

function GameSettings:OnGameRulesStateChange()
	local newState = GameRules:State_Get()
	if newState == DOTA_GAMERULES_STATE_PRE_GAME then
		local playersTeam = GameSettings:GetSettingValueAsTeamNumber("players_team")
		local customBuybackCooldown = GameSettings:GetSettingValueAsNumber("custom_buyback_cooldown")
		local customBuybackCost = GameSettings:GetSettingValueAsNumber("custom_buyback_cost")
		local isCustomBuybackCostEnabled = GameSettings:GetSettingValueAsBoolean("custom_buyback_cost_enabled")
		local isCustomBuybackCooldownEnabled = GameSettings:GetSettingValueAsBoolean("custom_buyback_cooldown_enabled")
		for i=1,PlayerResource:GetPlayerCountForTeam(playersTeam) do
			local playerID = PlayerResource:GetNthPlayerIDOnTeam(playersTeam, i)
			if(playerID > -1) then
				if(isCustomBuybackCooldownEnabled) then
					PlayerResource:SetCustomBuybackCooldown(playerID, customBuybackCooldown)
				end		
				if(isCustomBuybackCostEnabled) then
					PlayerResource:SetCustomBuybackCost(playerID, customBuybackCost)
				end
			end
		end
		GameSettings:SetIsLoaded(true)
		GameSettings:SendSettingsToAllClients()
	end
end

function GameSettings:SendSettingsToAllClients()
	PlayerTables:CreateTable("game_settings", GameSettings._clientKV, true)
end

function GameSettings:SetIsLoaded(state)
	CheckType(state, "state", "boolean")

	GameSettings._isLoaded = true
end

function GameSettings:IsLoaded()
	if(GameSettings._isLoaded ~= nil) then
		return GameSettings._isLoaded
	end
	return false
end

function GameSettings:GetSettingValueAsNumber(name)
	CheckType(name, "name", "string")

	local result = tonumber(GameSettings._kv[name]) 
	if(not result) then
		Debug_PrintError("GameSettings:GetSettingValueAsNumber \""..tostring(name).."\" not exists or not number.")
		return 0
	end

	return result
end

function GameSettings:GetSettingValueAsString(name)
	CheckType(name, "name", "string")

	local result = tostring(GameSettings._kv[name]) 
	if(not result) then
		Debug_PrintError("GameSettings:GetSettingValueAsString \""..tostring(name).."\" not exists or not string.")
		return 0
	end
	return result
end

function GameSettings:GetSettingValueAsBoolean(name)
	CheckType(name, "name", "string")

	local result = tonumber(GameSettings._kv[name]) 
	if(not result) then
		Debug_PrintError("GameSettings:GetSettingValueAsNumber \""..tostring(name).."\" not exists or not number.")
		return false
	end
	return result == 1
end

function GameSettings:GetSettingValueAsTable(name)
	CheckType(name, "name", "string")

	local result = GameSettings._kv[name]
	if(not result or type(result) ~= "table") then
		Debug_PrintError("GameSettings:GetSettingValueAsTable \""..tostring(name).."\" not exists or not table.")
		return {}
	end
	return result
end

function GameSettings:GetSettingValueAsTeamNumber(name)
	CheckType(name, "name", "string")
	
	local result = GameSettings._kv[name]
	if(not result or type(result) ~= "string") then
		Debug_PrintError("GameSettings:GetSettingValueAsTeamNumber \""..tostring(name).."\" not exists or not table.")
		return DOTA_TEAM_NOTEAM
	end
	if(_G[result]) then
		return _G[result]
	end
	return DOTA_TEAM_NOTEAM
end

if(IsServer() and not GameSettings._init) then
	GameSettings:Init()
	GameSettings._init = true
end
