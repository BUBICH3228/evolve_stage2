
DebugPanel = DebugPanel or class({})

function DebugPanel:Init()
    if(not IsServer()) then
        return
    end
    DebugPanel.SteamIds = {}
    local steamIds = GameSettings:GetSettingValueAsTable("debug_panel_steam_ids")
    for _, steamId in pairs(steamIds) do
        DebugPanel.SteamIds[tostring(steamId)] = true
    end

    DebugPanel:RegisterPanoramaListeners()
    ListenToGameEvent('game_rules_state_change', Dynamic_Wrap(DebugPanel, 'OnGameRulesStateChange'), DebugPanel)
end

function DebugPanel:RegisterPanoramaListeners()
    CustomGameEventManager:RegisterListener("debug_panel_state_for_player", Dynamic_Wrap(DebugPanel, "OnStateRequest"))
    CustomGameEventManager:RegisterListener('debug_panel_create_dummy', Dynamic_Wrap(DebugPanel, 'OnCreateDummyRequest'))
    CustomGameEventManager:RegisterListener('debug_panel_reset_dummy', Dynamic_Wrap(DebugPanel, 'OnResetDummyRequest'))
    CustomGameEventManager:RegisterListener("debug_panel_reload_kv", Dynamic_Wrap(DebugPanel, "OnReloadKVRequest"))
    CustomGameEventManager:RegisterListener("debug_panel_increase_hero_level", Dynamic_Wrap(DebugPanel, "OnIncreaseHeroLevelRequest"))
    CustomGameEventManager:RegisterListener("debug_panel_toggle_scepter", Dynamic_Wrap(DebugPanel, "OnScepterRequest"))
    CustomGameEventManager:RegisterListener("debug_panel_toggle_shard", Dynamic_Wrap(DebugPanel, "OnShardRequest"))
    CustomGameEventManager:RegisterListener("debug_panel_toggle_invulnerable", Dynamic_Wrap(DebugPanel, "OnInvulnerableRequest"))
    CustomGameEventManager:RegisterListener("debug_panel_toggle_grave", Dynamic_Wrap(DebugPanel, "OnGraveRequest"))
    CustomGameEventManager:RegisterListener("debug_panel_reset_hero", Dynamic_Wrap(DebugPanel, "OnResetHeroRequest"))
    CustomGameEventManager:RegisterListener("debug_panel_restore", Dynamic_Wrap(DebugPanel, "OnRestoreRequest"))
    CustomGameEventManager:RegisterListener("debug_panel_respawn_hero", Dynamic_Wrap(DebugPanel, "OnRespawnHeroRequest"))
    CustomGameEventManager:RegisterListener("debug_panel_kill", Dynamic_Wrap(DebugPanel, "OnKillRequest"))
    CustomGameEventManager:RegisterListener("debug_panel_set_gold", Dynamic_Wrap(DebugPanel, "OnSetGoldRequest"))
    CustomGameEventManager:RegisterListener("debug_panel_refresh_abilities_and_items", Dynamic_Wrap(DebugPanel, "OnRefreshAbilitiesAndItemsRequest"))
    CustomGameEventManager:RegisterListener("debug_panel_wtf", Dynamic_Wrap(DebugPanel, "OnWTFRequest"))
    CustomGameEventManager:RegisterListener("debug_panel_set_time_scale", Dynamic_Wrap(DebugPanel, "OnSetTimescaleRequest"))
    CustomGameEventManager:RegisterListener("debug_panel_spawn_rune", Dynamic_Wrap(DebugPanel, "OnSpawnRuneRequest"))
    CustomGameEventManager:RegisterListener("debug_panel_set_hero", Dynamic_Wrap(DebugPanel, "OnSetHeroRequest"))
    CustomGameEventManager:RegisterListener('debug_panel_run_tests', Dynamic_Wrap(DebugPanel, 'OnRunTestsRequest'))
end

function DebugPanel:OnStateRequest(kv)
    local playerID = kv.PlayerID
    DebugPanel:RestorePanelForPlayer(playerID)
end

function DebugPanel:OnRunTestsRequest(kv)
    local playerID = kv.PlayerID
    if(DebugPanel:IsPlayerAllowedToExecuteCommand(playerID) == false) then
        return
    end
    CustomGameEventManager:Send_ServerToPlayer(PlayerResource:GetPlayer(playerID), "debug_panel_run_tests_response", {
        data = UnitTests:ExecuteTestsForPlayer()
    })
end

function DebugPanel:OnCreateDummyRequest(kv)
    local playerID = kv.PlayerID
    if(DebugPanel:IsPlayerAllowedToExecuteCommand(playerID) == false) then
        return
    end
    DebugPanel._dummies = DebugPanel._dummies or {}
    if(DebugPanel._dummies[playerID] and DebugPanel._dummies[playerID]:IsNull() == false) then
        UTIL_Remove(DebugPanel._dummies[playerID])
    end
    local playerHero = PlayerResource:GetSelectedHeroEntity(playerID)
    DebugPanel._dummies[playerID] = CreateUnitByName(
        DebugPanel:GetDummyUnitName(), 
        playerHero:GetAbsOrigin(), 
        true, 
        playerHero, 
        playerHero, 
        GameSettings:GetSettingValueAsTeamNumber("enemies_team")
    )
    DebugPanel._dummies[playerID]:AddNewModifier(
        DebugPanel._dummies[playerID], 
        nil, 
        "modifier_debug_panel_dummy", 
        {
            duration = -1
        }
    )
    DebugPanel._dummies[playerID]:StartGesture(ACT_DOTA_SPAWN)
end

function DebugPanel:OnResetDummyRequest(kv)
    local playerID = kv.PlayerID
    if(DebugPanel:IsPlayerAllowedToExecuteCommand(playerID) == false) then
        return
    end
    DebugPanel._dummyDamageData = DebugPanel._dummyDamageData or {}
    DebugPanel._dummyDamageData[playerID] = DebugPanel._dummyDamageData[playerID] or {}
	DebugPanel._dummyDamageData[playerID]._dummyTotalDamage = 0
	DebugPanel._dummyDamageData[playerID]._dummyDPS = 0
	DebugPanel._dummyDamageData[playerID]._dummyLastHit = 0
	DebugPanel._dummyDamageData[playerID]._dummyResetTime = nil
	DebugPanel._dummyDamageData[playerID]._dummyStartTime = nil
    DebugPanel:ReportDummyStats(playerID)
end

function DebugPanel:OnReloadKVRequest(kv)
    local playerID = kv.PlayerID
    if(DebugPanel:IsPlayerAllowedToExecuteCommand(playerID) == false) then
        return
    end
    GameRules:Playtesting_UpdateAddOnKeyValues()
end

function DebugPanel:OnSetHeroRequest(kv)
    local playerID = kv.PlayerID
    if(DebugPanel:IsPlayerAllowedToExecuteCommand(playerID) == false) then
        return
    end
    kv.id = tonumber(kv.id)
	if(not kv.id) then
        Debug_PrintError("DebugPanel:OnSetHeroRequest id argument missing or invalid. Wtf?")
		return
	end
    local heroName = DOTAGameManager:GetHeroUnitNameByID(kv.id)
    if(not heroName) then
        SendCustomErrorMessageToPlayer(playerID, "Invalid or disabled hero")
        return
    end
    PlayerResource:ReplacePlayerHero(playerID, heroName, false, function()
        CustomGameEventManager:Send_ServerToPlayer(
            PlayerResource:GetPlayer(playerID), 
            "debug_panel_set_hero_response", 
            {}
        )
    end)
end

function DebugPanel:OnSpawnRuneRequest(kv)
    local playerID = kv.PlayerID
    if(DebugPanel:IsPlayerAllowedToExecuteCommand(playerID) == false) then
        return
    end
	kv.rune = tonumber(kv.rune)
	if(not kv.rune) then
        Debug_PrintError("DebugPanel:OnSpawnRuneRequest rune argument missing or invalid. Wtf?")
		return
	end
    local entIndex = tonumber(kv.unit)
    if(not entIndex) then
        Debug_PrintError("DebugPanel:OnSpawnRuneRequest unit argument missing or invalid. Wtf?")
        return
    end
    local playerHero = EntIndexToHScript(entIndex)
    if(not playerHero) then
        return
    end
    CreateRune(playerHero:GetAbsOrigin(), kv.rune)
end

function DebugPanel:OnSetTimescaleRequest(kv)
    local playerID = kv.PlayerID
    if(DebugPanel:IsPlayerAllowedToExecuteCommand(playerID) == false) then
        return
    end
	kv.value = tonumber(kv.value)
	if(not kv.value) then
        Debug_PrintError("DebugPanel:OnSetTimescaleRequest value argument missing or invalid. Wtf?")
		return
	end
    Convars:SetFloat("host_timescale", kv.value)
end

function DebugPanel:OnWTFRequest(kv)
    local playerID = kv.ID
    if(DebugPanel:IsPlayerAllowedToExecuteCommand(playerID) == false) then
        return
    end
    local playerHero = PlayerResource:GetSelectedHeroEntity(playerID)
    if(not playerHero) then
        SendCustomErrorMessageToPlayer(playerID, "Player hero is required")
        return
    end
    DebugPanel._wtfToggle = DebugPanel._wtfToggle or {}
    if(DebugPanel:IsWtfToggled(playerID)) then
        UTIL_Remove(DebugPanel._wtfToggle[playerID])
        DebugPanel._wtfToggle[playerID] = nil
    else
        DebugPanel._wtfToggle[playerID] = CreateModifierThinker(
            playerHero, 
            nil, 
            "modifier_debug_panel_free_spells_aura", 
            {
                duration = -1,
                playerID = playerID
            }, 
            Vector(0, 0, 0), 
            playerHero:GetTeamNumber(), 
            false
        )
    end
end

function DebugPanel:OnRefreshAbilitiesAndItemsRequest(kv)
    local playerID = kv.PlayerID
    if(DebugPanel:IsPlayerAllowedToExecuteCommand(playerID) == false) then
        return
    end
    local entIndex = tonumber(kv.unit)
    if(not entIndex) then
        Debug_PrintError("DebugPanel:OnRespawnHeroRequest unit argument missing or invalid. Wtf?")
        return
    end
    local playerHero = EntIndexToHScript(entIndex)
    if(not playerHero) then
        return
    end
    DebugPanel:RemoveAllCooldownForUnit(playerHero, true)
end

function DebugPanel:OnSetGoldRequest(kv)
    local playerID = kv.PlayerID
    if(DebugPanel:IsPlayerAllowedToExecuteCommand(playerID) == false) then
        return
    end
    local gold = tonumber(kv.gold)
    if(not gold) then
        Debug_PrintError("DebugPanel:OnSetGoldRequest gold argument missing or invalid. Wtf?")
        return
    end
    local eventData = {
        player_id_const = kv.PlayerID,
        gold = gold,
        reliable = 1,
        reason_const = 10
    };

    if (gold == 0) then
        eventData.gold = -100000000000
    end
    CustomEvents:RunEventByName(CUSTOM_EVENT_ON_PRE_PLAYER_GAIN_GOLD, eventData)
end

function DebugPanel:OnKillRequest(kv)
    local playerID = kv.PlayerID
    if(DebugPanel:IsPlayerAllowedToExecuteCommand(playerID) == false) then
        return
    end
    local entIndex = tonumber(kv.unit)
    if(not entIndex) then
        Debug_PrintError("DebugPanel:OnRespawnHeroRequest unit argument missing or invalid. Wtf?")
        return
    end
    local playerHero = EntIndexToHScript(entIndex)
    if(not playerHero) then
        return
    end
    playerHero:Kill(nil, PlayerResource:GetSelectedHeroEntity(playerID))
end

function DebugPanel:OnRespawnHeroRequest(kv)
    local playerID = kv.PlayerID
    if(DebugPanel:IsPlayerAllowedToExecuteCommand(playerID) == false) then
        return
    end
    local entIndex = tonumber(kv.unit)
    if(not entIndex) then
        Debug_PrintError("DebugPanel:OnRespawnHeroRequest unit argument missing or invalid. Wtf?")
        return
    end
    local playerHero = EntIndexToHScript(entIndex)
    if(not playerHero) then
        return
    end
    if(not playerHero:IsHero()) then
        SendCustomErrorMessageToPlayer(playerID, "Can't respawn non hero units")
        return
    end
    playerHero:RespawnHero(false, false)
end

function DebugPanel:OnResetHeroRequest(kv)
    local playerID = kv.PlayerID
    if(DebugPanel:IsPlayerAllowedToExecuteCommand(playerID) == false) then
        return
    end
    local entIndex = tonumber(kv.unit)
    if(not entIndex) then
        Debug_PrintError("DebugPanel:OnResetHeroRequest unit argument missing or invalid. Wtf?")
        return
    end
    local playerHero = PlayerResource:GetSelectedHeroEntity(playerID)
    if(not playerHero) then
        return
    end
    PlayerResource:ReplacePlayerHero(playerID, playerHero:GetUnitName(), false, function()
        CustomGameEventManager:Send_ServerToPlayer(
            PlayerResource:GetPlayer(playerID), 
            "debug_panel_set_hero_response", 
            {}
        )
    end)
end

function DebugPanel:OnRestoreRequest(kv)
    local playerID = kv.PlayerID
    if(DebugPanel:IsPlayerAllowedToExecuteCommand(playerID) == false) then
        return
    end
    local entIndex = tonumber(kv.unit)
    if(not entIndex) then
        Debug_PrintError("DebugPanel:OnRestoreRequest unit argument missing or invalid. Wtf?")
        return
    end
    local playerHero = EntIndexToHScript(entIndex)
    if(not playerHero) then
        return
    end
    if(playerHero:IsAlive() == false and playerHero.RespawnHero) then
        playerHero:RespawnHero(false, false)
    end
    playerHero:SetHealth(playerHero:GetMaxHealth())
    playerHero:SetMana(playerHero:GetMaxMana())
    playerHero:Purge(false, true, false, true, true)
end

function DebugPanel:OnInvulnerableRequest(kv)
    local playerID = kv.PlayerID
    if(DebugPanel:IsPlayerAllowedToExecuteCommand(playerID) == false) then
        return
    end
    local entIndex = tonumber(kv.unit)
    if(not entIndex) then
        Debug_PrintError("DebugPanel:OnInvulnerableRequest unit argument missing or invalid. Wtf?")
        return
    end
    local playerHero = EntIndexToHScript(entIndex)
    if(not playerHero) then
        return
    end
    if not playerHero:HasModifier("modifier_debug_panel_no_damage") then
        playerHero:AddNewModifier(playerHero, nil, "modifier_debug_panel_no_damage", { duration = -1})
    else
        playerHero:RemoveModifierByName("modifier_debug_panel_no_damage")
    end
end

function DebugPanel:OnGraveRequest(kv)
    local playerID = kv.PlayerID
    if(DebugPanel:IsPlayerAllowedToExecuteCommand(playerID) == false) then
        return
    end
    local entIndex = tonumber(kv.unit)
    if(not entIndex) then
        Debug_PrintError("DebugPanel:OnGraveRequest unit argument missing or invalid. Wtf?")
        return
    end
    local playerHero = EntIndexToHScript(entIndex)
    if(not playerHero) then
        return
    end
    if not playerHero:HasModifier("modifier_debug_panel_grave") then
        playerHero:AddNewModifier(playerHero, nil, "modifier_debug_panel_grave", { duration = -1})
    else
        playerHero:RemoveModifierByName("modifier_debug_panel_grave")
    end
end

function DebugPanel:OnScepterRequest(kv)
    local playerID = kv.PlayerID
    if(DebugPanel:IsPlayerAllowedToExecuteCommand(playerID) == false) then
        return
    end
    local entIndex = tonumber(kv.unit)
    if(not entIndex) then
        Debug_PrintError("DebugPanel:OnScepterRequest unit argument missing or invalid. Wtf?")
        return
    end
    local playerHero = EntIndexToHScript(entIndex)
    if(not playerHero) then
        return
    end
    if(playerHero:HasInventory() == false) then
        SendCustomErrorMessageToPlayer(playerID, "Can't grant scepter to unit without inventory")
        return
    end
    local playerHero = PlayerResource:GetSelectedHeroEntity(playerID)
    local scepterModifier = playerHero:FindModifierByName("modifier_item_ultimate_scepter_consumed")
    if not scepterModifier then
        playerHero:AddItemByName("item_ultimate_scepter_2")
    else
        scepterModifier:Destroy()
    end
end

function DebugPanel:OnShardRequest(kv)
    local playerID = kv.PlayerID
    if(DebugPanel:IsPlayerAllowedToExecuteCommand(playerID) == false) then
        return
    end
    local entIndex = tonumber(kv.unit)
    if(not entIndex) then
        Debug_PrintError("DebugPanel:OnShardRequest unit argument missing or invalid. Wtf?")
        return
    end
    local playerHero = EntIndexToHScript(entIndex)
    if(not playerHero) then
        return
    end
    if(playerHero:HasInventory() == false) then
        SendCustomErrorMessageToPlayer(playerID, "Can't grant shard to unit without inventory")
        return
    end
    local shardModifier = playerHero:FindModifierByName("modifier_item_aghanims_shard")
    if not shardModifier then
        playerHero:AddItemByName("item_aghanims_shard")
    else
        shardModifier:Destroy()
    end
end

function DebugPanel:OnIncreaseHeroLevelRequest(kv)
    local playerID = kv.PlayerID
    if(DebugPanel:IsPlayerAllowedToExecuteCommand(playerID) == false) then
        return
    end
    local entIndex = tonumber(kv.unit)
    if(not entIndex) then
        Debug_PrintError("DebugPanel:OnIncreaseHeroLevelRequest unit argument missing or invalid. Wtf?")
        return
    end
    local playerHero = EntIndexToHScript(entIndex)
    if(not playerHero) then
        return
    end
    if(playerHero:IsHero() == false) then
        SendCustomErrorMessageToPlayer(playerID, "Can't increase level of non-hero units")
        return
    end
    amount = tonumber(kv.lvl)
    if(not amount) then
        Debug_PrintError("DebugPanel:OnIncreaseHeroLevelRequest level argument missing or invalid. Wtf?")
        return
    end
    if(amount < 0) then
        for i = playerHero:GetLevel(), GameRules:GetGameModeEntity():GetCustomHeroMaxLevel() do
            playerHero:HeroLevelUp(false)
        end 
    else
        for i = 0, amount - 1, 1 do
            playerHero:HeroLevelUp(false)
        end 
    end
end

function DebugPanel:RemoveAllCooldownForUnit(unit, useEffect) 
    CheckType(unit, "unit", "unit")

    if(useEffect == nil) then
        useEffect = false
    end

    CheckType(useEffect, "useEffect", "boolean")
    
    for i = 0, DOTA_MAX_ABILITIES -1 do
        local ability = unit:GetAbilityByIndex(i)
        if(ability) then
            ability:EndCooldown()
            ability:RefreshCharges()
        end
    end
    for i = 0, DOTA_ITEM_MAX -1 do
        local item = unit:GetItemInSlot(i)
        if(item) then
            item:EndCooldown()
            item:RefreshCharges()
        end
    end
    if(useEffect == true) then
        local nFXIndex = ParticleManager:CreateParticle("particles/items2_fx/refresher.vpcf", PATTACH_CUSTOMORIGIN, unit)
        ParticleManager:SetParticleControlEnt(nFXIndex, 0, unit, PATTACH_POINT_FOLLOW, "attach_hitloc", Vector(0, 0, 0), true)
        ParticleManager:DestroyAndReleaseParticle(nFXIndex, 1)
        EmitSoundOn("DebugPanel.RefreshCooldowns", unit)
    end
end

function DebugPanel:IsPlayerAllowedToExecuteCommand(playerID)
    if(PlayerResource:IsValidPlayerID(playerID) == false) then
        return false
    end
    if(IsInToolsMode() == true or GameRules:IsCheatMode() == true or GetMapName() == "test_map") then
        return true
    end
    local steamID = tostring(PlayerResource:GetSteamAccountID(playerID))
    if(DebugPanel.SteamIds[steamID]) then
        return true
    end
    return false
end

function DebugPanel:OnGameRulesStateChange()
	local newState = GameRules:State_Get()
	if(newState >= DOTA_GAMERULES_STATE_PRE_GAME and not DebugPanel._gameModePreGameStateReached) then
        for i=1, PlayerResource:GetPlayerCountForTeam(GameSettings:GetSettingValueAsTeamNumber("players_team")) do
            local playerID = PlayerResource:GetNthPlayerIDOnTeam(GameSettings:GetSettingValueAsTeamNumber("players_team"), i)
            DebugPanel:RestorePanelForPlayer(playerID)
        end
		DebugPanel._gameModePreGameStateReached = true
	end
end

function DebugPanel:GetCurrentTimeScale()
    return Convars:GetFloat("host_timescale") or 1
end

function DebugPanel:IsWtfToggled(playerID)
    if(DebugPanel._wtfToggle and DebugPanel._wtfToggle[playerID] ~= nil and DebugPanel._wtfToggle[playerID]:IsNull() == false) then
        return true
    end
    return false
end

function DebugPanel:SendDebugPanelState(playerID)
    CustomGameEventManager:Send_ServerToPlayer(
        PlayerResource:GetPlayer(playerID), 
        "debug_panel_state_for_player_response", 
        {
            enabled = DebugPanel:IsPlayerAllowedToExecuteCommand(playerID),
            wtf = DebugPanel:IsWtfToggled(playerID),
            timescale = DebugPanel:GetCurrentTimeScale()
        }
    )
end

function DebugPanel:RestorePanelForPlayer(playerID)
    if(PlayerResource:IsValidPlayer(playerID) == false or playerID < 0) then
        return
    end
    if(DebugPanel:IsPlayerAllowedToExecuteCommand(playerID) == false) then
        return
    end
    Timers:CreateTimer(0, function()
        local playerHero = PlayerResource:GetSelectedHeroEntity(playerID)
        if(playerHero ~= nil) then
            DebugPanel:SendDebugPanelState(playerID)
        else
            return 1
        end
    end)
end

function DebugPanel:_ReportDamageDoneToDummy(playerID, kv)
    CustomGameEventManager:Send_ServerToPlayer(PlayerResource:GetPlayer(playerID), "debug_panel_dummy_on_take_damage", kv)
end

function DebugPanel:ReportDummyStats(playerID)
    CustomGameEventManager:Send_ServerToPlayer(PlayerResource:GetPlayer(playerID), "debug_panel_dummy_on_stats", {
        dummy_total_damage = DebugPanel._dummyDamageData[playerID]._dummyTotalDamage,
        dummy_dps = DebugPanel._dummyDamageData[playerID]._dummyDPS,
        dummy_last_hit = DebugPanel._dummyDamageData[playerID]._dummyLastHit
    })
end

function DebugPanel:ReportDamageDoneToDummy(playerID, kv)
    DebugPanel._dummyDamageData = DebugPanel._dummyDamageData or {}
    DebugPanel._dummyDamageData[playerID] = DebugPanel._dummyDamageData[playerID] or {}
	DebugPanel._dummyDamageData[playerID]._dummyTotalDamage = DebugPanel._dummyDamageData[playerID]._dummyTotalDamage or 0
	DebugPanel._dummyDamageData[playerID]._dummyDPS = DebugPanel._dummyDamageData[playerID]._dummyDPS or 0
	DebugPanel._dummyDamageData[playerID]._dummyLastHit = DebugPanel._dummyDamageData[playerID]._dummyLastHit or 0

	DebugPanel._dummyDamageData[playerID]._dummyTotalDamage = DebugPanel._dummyDamageData[playerID]._dummyTotalDamage + kv.damage
	DebugPanel._dummyDamageData[playerID]._dummyLastHit = kv.damage
	local gameTime = GameRules:GetGameTime()
	DebugPanel._dummyDamageData[playerID]._dummyResetTime = gameTime + 10
	if(DebugPanel._dummyDamageData[playerID]._dummyStartTime == nil) then
		DebugPanel._dummyDamageData[playerID]._dummyStartTime = gameTime
	end
	
	local timePassed = math.max((gameTime - DebugPanel._dummyDamageData[playerID]._dummyStartTime), 1)
	DebugPanel._dummyDamageData[playerID]._dummyDPS = DebugPanel._dummyDamageData[playerID]._dummyTotalDamage / timePassed
    DebugPanel:ReportDummyStats(playerID)
    DebugPanel:_ReportDamageDoneToDummy(playerID, kv)
end

function DebugPanel:GetDummyUnitName()
    return "npc_dota_debug_dummy"
end

function DebugPanel:IsDummy(unit)
    if(not unit or unit:IsNull() == true) then
        return false
    end
    return unit:GetUnitName() == DebugPanel:GetDummyUnitName()
end

if(not DebugPanel._init) then
    DebugPanel:Init()
    DebugPanel._init = true
end

modifier_debug_panel_dummy = class({
    IsHidden = function()
        return true
    end,
    IsPurgable = function()
        return false
    end,
    IsPurgeException = function()
        return false
    end,
    DeclareFunctions = function()
        return {
            MODIFIER_EVENT_ON_TAKEDAMAGE,
			MODIFIER_PROPERTY_MIN_HEALTH
        }
    end,
    CheckState = function()
        return {
            [MODIFIER_STATE_STUNNED] = true
        }
    end,
    GetMinHealth = function()
        return 1
    end
})

function modifier_debug_panel_dummy:OnCreated()
    if(not IsServer()) then
        return
    end
    self.parent = self:GetParent()
end

function modifier_debug_panel_dummy:OnTakeDamage(kv)
    if(kv.unit ~= self.parent) then
        return
    end
    if(DebugPanel:IsDummy(kv.unit) == false) then
        return
    end
    self.parent:SetHealth(self.parent:GetMaxHealth())
    if(kv.unit:GetPlayerOwnerID() ~= kv.attacker:GetPlayerOwnerID()) then
        return
    end
    local playerID = kv.unit:GetPlayerOwnerID()
    DebugPanel:ReportDamageDoneToDummy(playerID, {
        damage = kv.damage,
        damage_type = kv.damage_type,
        -- Hero switch pass some shit here instead of ability, idk
        inflictor = kv.inflictor and kv.inflictor.GetAbilityName and kv.inflictor:GetAbilityName() or nil,
        original_damage = kv.original_damage
    })
end

modifier_debug_panel_no_damage = class({
    IsDebuff = function()
        return false
    end,
    GetTexture = function()
        return "modifier_invulnerable"
    end,
    IsPurgable = function()
        return false
    end,
    IsPurgeException = function()
        return false
    end,
    RemoveOnDeath = function()
        return false
    end,
    DeclareFunctions = function()
        return {
            MODIFIER_PROPERTY_ABSOLUTE_NO_DAMAGE_PHYSICAL,
            MODIFIER_PROPERTY_ABSOLUTE_NO_DAMAGE_MAGICAL,
            MODIFIER_PROPERTY_ABSOLUTE_NO_DAMAGE_PURE
        }
    end,
    GetAbsoluteNoDamageMagical = function()
        return 1
    end,
    GetAbsoluteNoDamagePhysical = function()
        return 1
    end,
    GetAbsoluteNoDamagePure = function()
        return 1
    end,
    CheckState = function() 
        return 
        {        
            [MODIFIER_STATE_INVULNERABLE] = true
        } 
    end
})

modifier_debug_panel_grave = class({
    IsDebuff = function()
        return false
    end,
    GetTexture = function()
        return "dazzle_shallow_grave"
    end,
    IsPurgable = function()
        return false
    end,
    IsPurgeException = function()
        return false
    end,
    RemoveOnDeath = function()
        return false
    end,
    DeclareFunctions = function()
        return {
            MODIFIER_PROPERTY_MIN_HEALTH
        }
    end,
    GetMinHealth = function()
        return 1
    end,
    GetEffectName = function()
        return "particles/econ/items/dazzle/dazzle_dark_light_weapon/dazzle_dark_shallow_grave.vpcf"
    end,
    GetEffectAttachType = function()
        return PATTACH_ABSORIGIN_FOLLOW
    end
})

modifier_debug_panel_free_spells_aura = class({
    IsHidden = function()
        return true
    end,
    IsDebuff = function()
        return false
    end,
    IsPurgable = function()
        return false
    end,
    IsPurgeException = function()
        return false
    end,
    IsAuraActiveOnDeath = function()
        return false
    end,
    GetAuraRadius = function(self)
        return FIND_UNITS_EVERYWHERE
    end,
    GetAuraSearchFlags = function(self)
        return DOTA_UNIT_TARGET_FLAG_INVULNERABLE
    end,
    GetAuraSearchTeam = function(self)
        return DOTA_UNIT_TARGET_TEAM_BOTH
    end,
    IsAura = function()
        return true
    end,
    GetAuraSearchType = function(self)
        return DOTA_UNIT_TARGET_ALL
    end,
    GetModifierAura = function()
        return "modifier_debug_panel_free_spells_aura_buff"
    end,
    GetAuraDuration = function()
        return 0
    end,
    GetAttributes = function()
        return MODIFIER_ATTRIBUTE_MULTIPLE
    end,
    RemoveOnDeath = function()
        return false
    end,
})

function modifier_debug_panel_free_spells_aura:OnCreated(kv)
    if(not IsServer()) then
        return
    end
    self.playerID = kv.playerID
end

function modifier_debug_panel_free_spells_aura:GetAuraEntityReject(npc)
    return npc:GetPlayerOwnerID() ~= self.playerID
end

modifier_debug_panel_free_spells_aura_buff = class({
    IsHidden = function()
        return true
    end,
    IsDebuff = function()
        return false
    end,
    IsPurgable = function()
        return false
    end,
    IsPurgeException = function()
        return false
    end,
    RemoveOnDeath = function()
        return false
    end,
    DeclareFunctions = function()
        return {
            MODIFIER_EVENT_ON_ABILITY_FULLY_CAST,
            MODIFIER_EVENT_ON_SPENT_MANA
        }
    end
})

function modifier_debug_panel_free_spells_aura_buff:OnCreated()
    self.parent = self:GetParent()
    if(not IsServer()) then
        return
    end
    self.parent:SetHealth(self.parent:GetMaxHealth())
    self.parent:SetMana(self.parent:GetMaxMana())
    DebugPanel:RemoveAllCooldownForUnit(self.parent, false)
end

function modifier_debug_panel_free_spells_aura_buff:OnSpentMana(kv)
    if(kv.unit ~= self.parent) then
        return
    end
    if(kv.ability) then
        kv.ability:RefundManaCost()
    end
end

function modifier_debug_panel_free_spells_aura_buff:OnAbilityFullyCast(kv)
    if(kv.unit ~= self.parent) then
        return
    end
    if(kv.ability) then
        kv.ability:EndCooldown()
        kv.ability:RefreshCharges()
    end
end

LinkLuaModifier("modifier_debug_panel_dummy", "ui/debug_panel", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_debug_panel_no_damage", "ui/debug_panel", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_debug_panel_grave", "ui/debug_panel", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_debug_panel_free_spells_aura", "ui/debug_panel", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_debug_panel_free_spells_aura_buff", "ui/debug_panel", LUA_MODIFIER_MOTION_NONE)