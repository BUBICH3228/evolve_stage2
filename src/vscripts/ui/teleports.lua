Teleports = Teleports or class({})

function Teleports:Init()
    if(Teleports:IsInitialized()) then
        return
    end
    Teleports:RegisterPanoramaListeners()
    Teleports:RegisterEventListeners()
    Teleports:LoadKeyValues()
    Teleports:LockTeleports()
    Teleports:SetIsInitialized(true)
end

function Teleports:RegisterPanoramaListeners()
    CustomGameEventManager:RegisterListener('teleports_player_selected_location', Dynamic_Wrap(Teleports, 'OnPlayerSelectedLocation'))
    CustomGameEventManager:RegisterListener('teleports_get_data', Dynamic_Wrap(Teleports, 'OnPlayerRequestedData'))
end

function Teleports:RegisterEventListeners()
	ListenToGameEvent('game_rules_state_change', Dynamic_Wrap(Teleports, 'OnGameRulesStateChange'), Teleports)
    CustomEvents:RegisterEventHandler(CUSTOM_EVENT_ON_PLAYER_HERO_CHANGED, function(data)
		Teleports:OnPlayerHeroChanged(data)
	end)
end

function Teleports:SetIsInitialized(state)
    Teleports._initialized = state
end

function Teleports:IsInitialized()
    return Teleports._initialized or false
end

function Teleports:OnGameRulesStateChange()
	local newState = GameRules:State_Get()
	if newState == DOTA_GAMERULES_STATE_PRE_GAME then
        Teleports:FindEntitiesForEachTeleport()
	end
end

function Teleports:OnPlayerHeroChanged(keys)
	local hero = keys.hero
    local tpScrollName = Teleports:GetTeleportItemName()
    if(hero:HasItemInInventory(tpScrollName) == false) then
        local tpScroll = hero:AddItemByName(tpScrollName)
        if(tpScroll) then
            tpScroll:SetDroppable(false)
            tpScroll:SetSellable(false)
            tpScroll:SetPurchaser(hero)
        end
    end
end

function Teleports:GetAllTeleports()
    return Teleports._kv
end

function Teleports:SearchEntityPositionByName(name)
    local entity = Entities:FindByName(nil, name)
    if(entity) then
        return entity:GetAbsOrigin()
    end
end

function Teleports:LoadKeyValues()
    local kv = LoadKeyValues("scripts/kv/teleports.kv")
    Teleports._kv = {}
    for teleportID, teleportData in pairs(kv) do
        Teleports._kv[tonumber(teleportID)] = {
            ["name"] = teleportData["name"],
            ["entity"] = teleportData["entity"],
            ["image"] = teleportData["image"],
            ["require_center_alignment"] = tonumber(teleportData["require_center_alignment"]) == 1,
            ["unlock_boss"] = teleportData["unlock_boss"]
        }
    end
end

function Teleports:LockTeleports()
    for id, data in pairs(Teleports:GetAllTeleports()) do
        if(data["unlock_boss"] ~= nil) then
            Teleports:SetIsTeleportLocked(id, true)
        end
    end
end

function Teleports:FindEntitiesForEachTeleport()
    for teleportID, teleportData in pairs(Teleports:GetAllTeleports()) do
        local position
        local entities = Entities:FindAllByClassname("info_target")
        local entityName = nil
        for _, entity in pairs(entities) do
            entityName = entity:GetName()
            if (string.find(entityName, teleportData["entity"])) then
                position = entity:GetAbsOrigin()
            end
        end
        if(position) then
            Teleports._kv[tonumber(teleportID)]["position"] = position
        else
            Debug_PrintError("[Teleports] Failed to find entity for teleport with id "..tostring(teleportID))
        end
    end
end

function Teleports:OnPlayerSelectedLocation(kv)
    if(Teleports:IsInitialized() == false) then
        Timers:CreateTimer(1, function()
            Teleports:OnPlayerSelectedLocation(kv)
        end)
        return
    end
    local playerID = tonumber(kv.PlayerID) or -1
    if(PlayerResource:IsValidPlayer(playerID) == false) then
        return
    end
    local teleportID = tonumber(kv.location)
    if(not teleportID) then
        return
    end
    local playerHero = PlayerResource:GetSelectedHeroEntity(playerID)
    if(not playerHero or playerHero:IsAlive() == false) then
        return
    end
    local teleportItemKV = GetAbilityKeyValuesByName(Teleports:GetTeleportItemName())
    if(not teleportItemKV) then
        return
    end
    if(Teleports:IsTeleportLocked(teleportID) == true) then
        PlayerResource:SendCustomErrorMessageToPlayer(playerID, "ui_teleports_locked_error")
        return
    end
    local teleportPosition = Teleports:GetTeleportPosition(teleportID)
    local teleportScrollItem = playerHero:FindItemInInventory(Teleports:GetTeleportItemName())
    if(teleportScrollItem) then
        teleportScrollItem:OnLocationSelected(teleportPosition)
    end
end

function Teleports:GetTeleportName(teleportID)
    teleportID = tonumber(teleportID) or -1
    return Teleports._kv[teleportID] and Teleports._kv[teleportID]["name"]
end

function Teleports:GetTeleportPosition(teleportID)
    teleportID = tonumber(teleportID) or -1
    return Teleports._kv[teleportID] and Teleports._kv[teleportID]["position"]
end

function Teleports:GetTeleportImage(teleportID)
    teleportID = tonumber(teleportID) or -1
    return Teleports._kv[teleportID] and Teleports._kv[teleportID]["image"]
end

function Teleports:GetTeleportUnlockBoss(teleportID)
    teleportID = tonumber(teleportID) or -1
    return Teleports._kv[teleportID] and Teleports._kv[teleportID]["unlock_boss"]
end

function Teleports:IsTeleportButtonRequireCenterAlignment(teleportID)
    teleportID = tonumber(teleportID) or -1
    if(Teleports._kv[teleportID] and Teleports._kv[teleportID]["require_center_alignment"] == true) then
        return true
    end
    return false
end

function Teleports:SetIsTeleportLocked(teleportID, state)
    teleportID = tonumber(teleportID) or -1
    
    CheckType(state, "state", "boolean")

    if(Teleports._kv[teleportID] == nil) then
        return
    end
    Teleports._lockedTeleports = Teleports._lockedTeleports or {}
    Teleports._lockedTeleports[teleportID] = state
    Teleports:SendDataToPlayerToAllPlayers()
end

function Teleports:IsTeleportLocked(teleportID)
    teleportID = tonumber(teleportID) or -1
    if(Teleports._lockedTeleports[teleportID] ~= nil) then
        return Teleports._lockedTeleports[teleportID]
    end
    return false
end

function Teleports:GetTeleportItemName()
    return GameSettings:GetSettingValueAsString("tp_scroll_item_slot_override")
end

function Teleports:OpenTeleportsWindowForPlayer(playerID)
    CustomGameEventManager:Send_ServerToPlayer(
        PlayerResource:GetPlayer(playerID), 
        "teleports_open_window", 
        {}
    )
end

function Teleports:OnPlayerRequestedData(kv)
    local playerID = tonumber(kv.PlayerID) or -1
    Teleports:SendDataToPlayer(playerID, clientData)
end

function Teleports:GetClientSideData()
    local data = {
        teleports = {}
    }
    for teleportID, _ in pairs(Teleports:GetAllTeleports()) do
        data["teleports"][teleportID] = {
            name = Teleports:GetTeleportName(teleportID),
            image = Teleports:GetTeleportImage(teleportID),
            require_center_alignment = Teleports:IsTeleportButtonRequireCenterAlignment(teleportID),
            locked = Teleports:IsTeleportLocked(teleportID),
            unlock_boss = Teleports:GetTeleportUnlockBoss(teleportID)
        }
    end
    return data
end

function Teleports:SendDataToPlayerToAllPlayers()
    local data = Teleports:GetClientSideData()
    CustomGameEventManager:Send_ServerToAllClients(
        "teleports_get_data_response", 
        data
    )
end

function Teleports:SendDataToPlayer(playerID)
    if(PlayerResource:IsValidPlayer(playerID) == false) then
        return
    end
    local data = Teleports:GetClientSideData()
    CustomGameEventManager:Send_ServerToPlayer(
        PlayerResource:GetPlayer(playerID), 
        "teleports_get_data_response", 
        data
    )
end

if(IsServer()) then
    Teleports:Init()
end