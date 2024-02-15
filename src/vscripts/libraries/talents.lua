Talents = Talents or class({})

local TALENTS_TABLE_NAME = "talents_custom"

function Talents:Init()
    Talents:LoadKeyValues()
    Talents:RegisterEventHandlers()
end

function Talents:PostInit()
    Talents:RegisterPostInitEventHandlers()
end

function Talents:RegisterEventHandlers()
    if(not IsServer()) then
        return
    end
    ListenToGameEvent('game_rules_state_change', Dynamic_Wrap(Talents, 'OnGameRulesStateChange'), Talents)
end

function Talents:RegisterPostInitEventHandlers()
    if(not IsServer()) then
        return
    end
    CustomEvents:RegisterEventHandler(CUSTOM_EVENT_ON_PLAYER_HERO_CHANGED, function(data)
        Talents:OnPlayerHeroChanged(data)
    end)
    CustomEvents:RegisterEventHandler(CUSTOM_EVENT_ON_PRE_PLAYER_HERO_CHANGED, function(data)
		Talents:OnPrePlayerHeroChanged(data)
	end)
    CustomEvents:RegisterEventHandler(CUSTOM_EVENT_ON_MODIFIER_ADDED, function(data)
        Talents:OnModifierAdded(data)
    end)
    CustomEvents:RegisterEventHandler(CUSTOM_EVENT_ON_MODIFIER_DESTROYED, function(data)
        Talents:OnModifierDestroyed(data)
    end)
    CustomEvents:RegisterEventHandler(CUSTOM_EVENT_ON_RELOAD_KV, function(data)
        Talents:OnKeyValuesReloaded()
    end)
    CustomEvents:RegisterEventHandler(CUSTOM_EVENT_ON_TALENT_LEARNED, function(data)
        Talents:OnTalentLearned(data.hero, data.talent)
    end)
end

function Talents:OnGameRulesStateChange()
    local state = GameRules:State_Get()
    if(state >= DOTA_GAMERULES_STATE_HERO_SELECTION and not Talents._postInit) then
        Talents:PostInit()
        Talents._postInit = true
    end
end

function Talents:OnKeyValuesReloaded()
    Talents:LoadKeyValues()
end

function Talents:LoadKeyValues()
    local kv = GetAbilitiesKV()

    local abilitiesWithScepter = {}
    local abilitiesWithShard = {}
    for abilityName, data in pairs(kv) do
        if(type(data) == "table") then
            if(tonumber(data["HasShardUpgrade"]) == 1) then
                abilitiesWithShard[abilityName] = true
            end
            if(tonumber(data["HasScepterUpgrade"]) == 1) then
                abilitiesWithScepter[abilityName] = true
            end
        end
    end
    self._abilitiesWithScepter = abilitiesWithScepter
    self._abilitiesWithShard = abilitiesWithShard

    local parsedTalents = {}
    for talentName, data in pairs(kv) do
        if(type(data) == "table" 
        and data["ScriptFile"] 
        and data["ScriptFile"] == "abilities/talents/talent_base"
        and data["AbilityValues"]) then
            parsedTalents[talentName] = parsedTalents[talentName] or {}
            for k, v in pairs(data["AbilityValues"]) do
                parsedTalents[talentName][k] = tonumber(v)
            end
        end
    end
    local parsedAbilitySpecialTalents = {}
    for abilityName, data in pairs(kv) do
        if(type(data) == "table" and data["AbilityValues"]) then
            local isAbilityRequireTalentsFix = false
            parsedAbilitySpecialTalents[abilityName] = {}
            for specialName, specialValue in pairs(data["AbilityValues"]) do
                if(type(specialValue) == "table") then
                    parsedAbilitySpecialTalents[abilityName][specialName] = {}
                    local parsedAbilitySpecial = Talents:ParseTalentsForAbilitySpecial(
                        abilityName,
                        specialValue,
                        parsedTalents
                    )
                    if(parsedAbilitySpecial ~= nil) then
                        isAbilityRequireTalentsFix = true
                    end
                    parsedAbilitySpecialTalents[abilityName][specialName] = parsedAbilitySpecial
                end
            end
            if(isAbilityRequireTalentsFix == false) then
                parsedAbilitySpecialTalents[abilityName] = nil
            end
        end
    end
    self._abilitySpecialsWithTalents = parsedAbilitySpecialTalents
end

function Talents:IsAbilityHasShardUpgrade(abilityName)
    if(self._abilitiesWithShard[abilityName] ~= nil) then
        return true
    end
    return false
end

function Talents:IsAbilityHasScepterUpgrade(abilityName)
    if(self._abilitiesWithScepter[abilityName] ~= nil) then
        return true
    end
    return false
end

function Talents:GetDefaultSpecialOperation()
    return "+"
end

function Talents:IsValidSpecialOperation(operation)
    if(operation == "+" or operation == "-") then
        return true
    end
    if(operation == "x" or operation == "/") then
        return true
    end
    return false
end

function Talents:CalculateOperation(initialValue, bonusValue, operation)
    if(operation == "x") then
        initialValue = initialValue * bonusValue
    elseif(operation == "/") then
        initialValue = initialValue / bonusValue
    else
        initialValue = initialValue + bonusValue
    end
    return initialValue
end

function Talents:ParseTalentsForAbilitySpecial(abilityName, data, parsedTalents)
    local isAtLeastOneTalentForSpecialExists = false
    local parsedSpecials = {}
    for talentName, talentValue in pairs(data) do
        if(parsedTalents[talentName]) then
            local operation = string.sub(talentValue, 1, 1)
            local value = string.sub(talentValue, 2, string.len(talentValue))
            if(Talents:IsValidSpecialOperation(operation) == false) then
                operation = Talents:GetDefaultSpecialOperation()
                value = talentValue
            end
            local parsedValue = tonumber(value)
            if(parsedValue == nil) then
                if(parsedTalents[talentName] and parsedTalents[talentName][value]) then
                    value = parsedTalents[talentName][value] or 0
                else
                    Debug_PrintError("AbilityValue "..tostring(talentValue).." for talent named "..tostring(talentName)
                    .." not exists, but defined in ability "..tostring(abilityName)..".")
                    operation = Talents:GetDefaultSpecialOperation()
                    value = 0
                end
            end
            if(operation == "-") then
                value = value * -1
            end
            table.insert(parsedSpecials, {
                value = value,
                operation = operation,
                talent = talentName
            })
            isAtLeastOneTalentForSpecialExists = true
        end
    end
    if(isAtLeastOneTalentForSpecialExists) then
        return parsedSpecials
    end
    return nil
end

function Talents:GetAllAbilitySpecialsWithTalents()
    return self._abilitySpecialsWithTalents
end

function Talents:GetHeroAbilityTalentsForSpecial(abilityName, specialName)
    local result = {}
    local data = Talents:GetAllAbilitySpecialsWithTalents()
    if(data[abilityName] ~= nil and data[abilityName][specialName] ~= nil) then
        for _, talentName in pairs(data[abilityName][specialName]) do
            table.insert(result, talentName)
        end
    end
    return result
end

function Talents:GetAbilitySpecialValueAfterTalentsModifiers(hero, abilityName, specialName, baseSpecialValue)
    local result = baseSpecialValue
    local talentsForThisSpecial = Talents:GetHeroAbilityTalentsForSpecial(abilityName, specialName)
    for _, data in pairs(talentsForThisSpecial) do
        if(Talents:IsTalentLearned(hero, data["talent"])) then
            result = Talents:CalculateOperation(result, data["value"], data["operation"])
        end
    end
    return result
end

function Talents:OnTalentLearned(playerHero, talent)
    local talentName = talent:GetAbilityName()
    local data = Talents:GetAllAbilitySpecialsWithTalents()

    for i = 0, playerHero:GetAbilityCount() - 1 do
        local ability = playerHero:GetAbilityByIndex(i)
        if(ability) then
            if(ability:IsAttributeBonus() == false) then
                local abilityName = ability:GetAbilityName()
                if(data[abilityName]) then
                    for _, abilityValuesWithTalents in pairs(data[abilityName]) do
                        for _, abilityValuesData in pairs(abilityValuesWithTalents) do
                            local talent = abilityValuesData["talent"]
                            if(talent == talentName and ability:GetLevel() > 0) then
                                ability:RefreshIntrinsicModifier()
                            end
                        end
                    end
                end
            end
            if(ability and ability.OnAbilityUpgrade) then
                ability:OnAbilityUpgrade(talent)
            end
        end
    end
end

function Talents:RemoveTalentsForHero(hero)
    CheckType(hero, "hero", "unit")

    local data = CustomNetTables:GetTableValue(TALENTS_TABLE_NAME, "hero_talents") or {}
    local entIndex = tostring(hero:entindex())
    data[entIndex] = nil

    CustomNetTables:SetTableValue(TALENTS_TABLE_NAME, "hero_talents", data)
end

function Talents:SetIsTalentLearned(hero, talentName, state)
    CheckType(hero, "hero", "unit")
    CheckType(talentName, "talentName", "string")
    CheckType(state, "state", "boolean")

    local data = CustomNetTables:GetTableValue(TALENTS_TABLE_NAME, "hero_talents") or {}
    local entIndex = tostring(hero:entindex())
    data[entIndex] = data[entIndex] or {}
    data[entIndex][talentName] = state

    CustomNetTables:SetTableValue(TALENTS_TABLE_NAME, "hero_talents", data)
end

function Talents:IsTalentLearned(hero, talentName)
    if(IsServer()) then
        return Talents:_IsTalentLearnedServer(hero, talentName)
    end

    CheckType(hero, "hero", "unit")
    CheckType(talentName, "talentName", "string")

    local entIndex = tostring(hero:entindex())
    local data = CustomNetTables:GetTableValue(TALENTS_TABLE_NAME, "hero_talents") or {}
    
    if(data[entIndex] ~= nil and data[entIndex][talentName] ~= nil) then
        return tonumber(data[entIndex][talentName]) == 1
    end
    return false
end

function Talents:_IsTalentLearnedServer(hero, talentName)
    hero._customDotaTalents = hero._customDotaTalents or {}
    if(hero._customDotaTalents[talentName]) then
        return hero._customDotaTalents[talentName]:GetLevel() > 0
    end
    local talent = hero:FindAbilityByName(talentName)
    if(talent == nil) then
        return false
    end
    hero._customDotaTalents[talentName] = talent
    return Talents:_IsTalentLearnedServer(hero, talentName)
end

function Talents:OnModifierAdded(kv)
    local modifier = kv.modifier
    local parent = modifier:GetParent()
    local savedScepterState = parent._savedTalentsScepterState
    local savedShardState = parent._savedTalentsShardState
    if(savedScepterState == nil) then
        parent._savedTalentsScepterState = parent:HasScepter()
        savedScepterState = parent._savedTalentsScepterState
    end
    if(savedShardState == nil) then
        parent._savedTalentsShardState = parent:HasShard()
        savedShardState = parent._savedTalentsShardState
    end
    local currentScepterState = parent:HasScepter()
    local currentShardState = parent:HasShard()
    local isRequireScepterUpdate = savedScepterState ~= currentScepterState
    local isRequireShardUpdate = savedShardState ~= currentShardState
    for i = 0, parent:GetAbilityCount() - 1 do
        local ability = parent:GetAbilityByIndex(i)
        if(ability and ability:IsAttributeBonus() == false) then
            if(isRequireScepterUpdate == true and Talents:IsAbilityHasScepterUpgrade(ability:GetAbilityName())) then
                ability:RefreshIntrinsicModifier()
            end
            if(isRequireShardUpdate == true and Talents:IsAbilityHasShardUpgrade(ability:GetAbilityName())) then
                ability:RefreshIntrinsicModifier()
            end
        end
    end
    parent._savedTalentsScepterState = currentScepterState
    parent._savedTalentsShardState = currentShardState
end

function Talents:OnModifierDestroyed(kv)
    Talents:OnModifierAdded(kv)
end

function Talents:OnPrePlayerHeroChanged(kv)
    local hero = kv.hero
    Talents:RemoveTalentsForHero(hero)
end

function Talents:OnPlayerHeroChanged(kv)
	local hero = kv.hero
    hero:AddNewModifier(hero, nil, "modifier_talents_ability_values_override", {duration = -1})
end

if(not Talents._init) then
    Talents:Init()
    Talents._init = true
end

modifier_talents_ability_values_override = class({
    IsHidden = function()
        return true
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
            MODIFIER_PROPERTY_OVERRIDE_ABILITY_SPECIAL,
            MODIFIER_PROPERTY_OVERRIDE_ABILITY_SPECIAL_VALUE
        }
    end
})

function modifier_talents_ability_values_override:OnCreated()
    self.parent = self:GetParent()
end

function modifier_talents_ability_values_override:GetModifierOverrideAbilitySpecial(params)
	if self.parent == nil or params.ability == nil then
		return 0
	end
    local abilityName = params.ability:GetAbilityName()
    local talentsData = Talents:GetAllAbilitySpecialsWithTalents()
    if(talentsData[abilityName] ~= nil and params.ability:IsAttributeBonus() == false) then
        return 1
    end
	return 0
end

function modifier_talents_ability_values_override:GetModifierOverrideAbilitySpecialValue(params)
	local szAbilityName = params.ability:GetAbilityName() 
    local szSpecialValueName = params.ability_special_value
    local szSpecialValueLevel = params.ability_special_level
    local baseSpecialValue = params.ability:GetLevelSpecialValueNoOverride(szSpecialValueName, szSpecialValueLevel, true)
    return Talents:GetAbilitySpecialValueAfterTalentsModifiers(self.parent, szAbilityName, szSpecialValueName, baseSpecialValue)
end

LinkLuaModifier("modifier_talents_ability_values_override", "libraries/talents", LUA_MODIFIER_MOTION_NONE)