KEYVALUES_VERSION = "1.00"

 -- Change to false to skip loading the base files
LOAD_BASE_FILES = true

--[[
    Simple Lua KeyValues library
    Author: Martin Noya // github.com/MNoya

    Installation:
    - require this file inside your code

    Usage:
    - Your npc custom files will be validated on require, error will occur if one is missing or has faulty syntax.
    - This allows to safely grab key-value definitions in npc custom abilities/items/units/heroes
    
        "some_custom_entry"
        {
            "CustomName" "Barbarian"
            "CustomKey"  "1"
            "CustomStat" "100 200"
        }

        With a handle:
            handle:GetKeyValue() -- returns the whole table based on the handles baseclass
            handle:GetKeyValue("CustomName") -- returns "Barbarian"
            handle:GetKeyValue("CustomKey")  -- returns 1 (number)
            handle:GetKeyValue("CustomStat") -- returns "100 200" (string)
            handle:GetKeyValue("CustomStat", 2) -- returns 200 (number)
        
        Same results with strings:
            GetKeyValue("some_custom_entry")
            GetKeyValue("some_custom_entry", "CustomName")
            GetKeyValue("some_custom_entry", "CustomStat")
            GetKeyValue("some_custom_entry", "CustomStat", 2)

    - Ability Special value grabbing:

        "some_custom_ability"
        {
            "AbilitySpecial"
            {
                "01"
                {
                    "var_type"    "FIELD_INTEGER"
                    "some_key"    "-3 -4 -5"
                }
            }
        }

        With a handle:
            ability:GetAbilitySpecial("some_key") -- returns based on the level of the ability/item

        With string:
            GetAbilitySpecial("some_custom_ability", "some_key")    -- returns "-3 -4 -5" (string)
            GetAbilitySpecial("some_custom_ability", "some_key", 2) -- returns -4 (number)

    Notes:
    - In case a key can't be matched, the returned value will be nil
    - Don't identify your custom units/heroes with the same name or it will only grab one of them.
]]

KeyValues = KeyValues or class({})

local split = function(inputstr, sep)
    if sep == nil then sep = "%s" end
    local t={} ; i=1
    for str in string.gmatch(inputstr, "([^"..sep.."]+)") do
        t[i] = str
        i = i + 1
    end
    return t
end

function KeyValues:Init()
    KeyValues:LoadGameKeyValues()
    KeyValues:RegisterEventHandlers()
end

function KeyValues:RegisterEventHandlers()
    if(not IsServer()) then
        return
    end
    CustomEvents:RegisterEventHandler(CUSTOM_EVENT_ON_RELOAD_KV, function(data)
        KeyValues:LoadGameKeyValues()
    end)
end

-- Load all the necessary key value files
function KeyValues:LoadGameKeyValues()
    local scriptPath ="scripts/npc/"
    local override = LoadKeyValues(scriptPath.."npc_abilities_override.txt")
    local files = { AbilityKV = {base="npc_abilities",custom="npc_abilities_custom"},
                    ItemKV = {base="items",custom="npc_items_custom"},
                    UnitKV = {base="npc_units",custom="npc_units_custom"},
                    HeroKV = {base="npc_heroes",custom="npc_heroes_custom"}
                  }

    -- Load and validate the files
    for k,v in pairs(files) do
        local file = {}
        if LOAD_BASE_FILES then
            file = LoadKeyValues(scriptPath..v.base..".txt")
        end

        -- Replace main game keys by any match on the override file
        for k,v in pairs(override) do
            if file[k] then
                file[k] = v
            end
        end

        local custom_file = LoadKeyValues(scriptPath..v.custom..".txt")
        if custom_file then
            for k,v in pairs(custom_file) do
                file[k] = v
            end
        else
            Debug_PrintError("[KeyValues] Critical Error on "..v.custom..".txt")
            return
        end
        
        KeyValues[k] = file
    end   

    -- Merge All KVs
    KeyValues.All = {}
    for name,path in pairs(files) do
        for key,value in pairs(KeyValues[name]) do
            if not KeyValues.All[key] then
                KeyValues.All[key] = value
            end
        end
    end

    KeyValues.ItemsAndAbilitiesKV = {}
    -- Merge abilities and items KV
    for key,value in pairs(KeyValues["AbilityKV"]) do
        if not KeyValues.ItemsAndAbilitiesKV[key] then
            KeyValues.ItemsAndAbilitiesKV[key] = value
        end
    end

    for key,value in pairs(KeyValues["ItemKV"]) do
        if not KeyValues.ItemsAndAbilitiesKV[key] then
            KeyValues.ItemsAndAbilitiesKV[key] = value
        end
    end

    -- Merge units and heroes (due to them sharing the same class CDOTA_BaseNPC)
    for key,value in pairs(KeyValues.HeroKV) do
        if not KeyValues.UnitKV[key] then
            KeyValues.UnitKV[key] = value
        else
            if type(KeyValues.All[key]) == "table" then
                Debug_PrintError("[KeyValues] Warning: Duplicated unit/hero entry for "..key)
            end
        end
    end
end

-- Global functions
-- Key is optional, returns the whole table by omission
-- Level is optional, returns the whole value by omission
function GetKeyValue(name, key, level, tbl)
    local t = tbl or KeyValues.All[name]
    if key and t then
        if t[key] and level then
            local s = split(t[key])
            if s[level] then return tonumber(s[level]) or s[level] -- Try to cast to number
            else return tonumber(s[#s]) or s[#s] end
        else return t[key] end
    else return t end
end

function GetUnitKV(unitName, key, level)
    return GetKeyValue(unitName, key, level, KeyValues.UnitKV[unitName])
end

function GetUnitsKV()
    return KeyValues.UnitKV
end

function GetAbilityKV(abilityName, key, level)
    return GetKeyValue(abilityName, key, level, KeyValues.AbilityKV[abilityName])
end

function GetAbilitiesKV()
    return KeyValues.AbilityKV
end

function GetItemKV(itemName, key, level)
    return GetKeyValue(itemName, key, level, KeyValues.ItemKV[itemName])
end

function GetItemsKV()
    return KeyValues.ItemKV
end

function GetAbilitiesAndItemsKV()
    return KeyValues.ItemsAndAbilitiesKV
end

if(not KeyValues._init) then
    KeyValues:Init()
    KeyValues._init = true
end