Selection = Selection or class({})

function Selection:Init()
    Selection._lastPlayerSelectedUnits = {}
    Selection:RegisterPanoramaListeners()
end

function Selection:RegisterPanoramaListeners()
    CustomGameEventManager:RegisterListener('selection_player_update', Dynamic_Wrap(Selection, 'OnPlayerSelectedUnit'))
end

function Selection:OnPlayerSelectedUnit(kv)
    CheckType(kv.PlayerID, "kv.PlayerID", "number")
    CheckType(kv.unit, "kv.unit", "number")
    
    if (kv.unit < 0) then
        return
    end

    local unit = EntIndexToHScript(kv.unit)
    if(not unit) then
        Debug_PrintError("Selection:OnPlayerSelectedUnit seems valve break something. Wtf?")
        return
    end
    Selection:SetPlayerLastSelectedUnit(kv.PlayerID, unit)
    CustomEvents:RunEventByName(CUSTOM_EVENT_ON_PLAYER_SELECTED_UNIT, {
        unit = unit,
        player_id = kv.PlayerID
    })
end

function Selection:SetPlayerLastSelectedUnit(playerID, unit)
    CheckType(playerID, "playerID", "number")
    CheckType(unit, "unit", "unit")
    Selection._lastPlayerSelectedUnits[playerID] = unit
end

function Selection:GetPlayerLastSelectedUnit(playerID)
    CheckType(playerID, "playerID", "number")
    if(Selection._lastPlayerSelectedUnits[playerID] ~= nil and Selection._lastPlayerSelectedUnits[playerID]:IsNull() == false) then
        return Selection._lastPlayerSelectedUnits[playerID]
    end
    return nil
end

if(not Selection._init) then
    Selection:Init()
    Selection._init = true
end