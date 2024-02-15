if(IsClient()) then
    return
end

local CUSTOM_EVENTS = {
    CUSTOM_EVENT_ON_PRE_PLAYER_HERO_CHANGED = 1,
    CUSTOM_EVENT_ON_PLAYER_HERO_CHANGED = 2,
    CUSTOM_EVENT_ON_MODIFIER_DESTROYED = 3,
    CUSTOM_EVENT_ON_MODIFIER_ADDED = 4,
    CUSTOM_EVENT_ON_MODIFIER_REFRESHED = 5,
    CUSTOM_EVENT_ON_MODIFIER_STACKS_COUNT_CHANGED = 6,
    CUSTOM_EVENT_ON_RELOAD_KV = 7,
    CUSTOM_EVENT_ON_ADDON_PRECACHE = 8,
    CUSTOM_EVENT_ON_TALENT_LEARNED = 9,
    CUSTOM_EVENT_ON_DIFFICULTY_CHANGED = 10,
    CUSTOM_EVENT_ON_DIFFICULTY_SELECTED = 11,
    CUSTOM_EVENT_ON_PRE_TAKE_DAMAGE = 12,
    CUSTOM_EVENT_ON_PRE_PLAYER_GAIN_GOLD = 13,
    CUSTOM_EVENT_ON_PLAYER_SELECTED_UNIT = 14,
    CUSTOM_EVENT_ON_ORDER = 15
}

for k,v in pairs(CUSTOM_EVENTS) do
    _G[k] = v
end

if CustomEvents == nil then
	print ( '[EVENTS] creating CustomEvents' )
	CustomEvents = class({})
    CustomEvents.__events = {}
    for _,v in pairs(CUSTOM_EVENTS) do
        CustomEvents.__events[v] = {}
    end
end

local function IsValidEvent(enumValue)
	for _, v in pairs(CUSTOM_EVENTS) do
		if(v == enumValue) then
			return true
		end
	end
	return false
end

function CustomEvents:RegisterEventHandler(enumValue, func)
    if(IsValidEvent(enumValue) == false) then
        Debug_PrintError("CustomEvents:RegisterEventHandler attempt to register event handler for unknown event. Did you forget update enum? Got "..tostring(enumValue).."("..type(enumValue)..").")
        return
    end
    
    CheckType(func, "func", "function")

    table.insert(CustomEvents.__events[enumValue], func)
end

local function ErrorHandler(err)
    Debug_PrintError(err)
end

function CustomEvents:RunEventByName(enumValue, data) 
    if CustomEvents.__events[enumValue] then
        for _, eventHandler in ipairs(CustomEvents.__events[enumValue]) do
            xpcall(eventHandler, ErrorHandler, data)
        end
    end
end