modifier_custom_properties = class({
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
            MODIFIER_PROPERTY_STATS_STRENGTH_BONUS,
			MODIFIER_PROPERTY_STATS_AGILITY_BONUS,
			MODIFIER_PROPERTY_STATS_INTELLECT_BONUS,
            MODIFIER_PROPERTY_PHYSICAL_ARMOR_BONUS,
            MODIFIER_PROPERTY_BASE_ATTACK_TIME_CONSTANT,
            MODIFIER_EVENT_ON_ATTACK_LANDED,
            MODIFIER_EVENT_ON_TAKEDAMAGE,
        }
    end
})

function modifier_custom_properties:OnCreated()
    self.parent = self:GetParent()
    self.bonusStrengthPctValue = self.bonusStrengthPctValue or 0
    self.bonusAgilityPctValue = self.bonusAgilityPctValue or 0
    self.bonusIntellectPctValue = self.bonusIntellectPctValue or 0
    self.bonusArmorPctValue = self.bonusArmorPctValue or 0
    self._ignoreThisBATBonus = true
    self.bonusBat = self.bonusBat or self.parent:GetBaseAttackTime()
    self._ignoreThisBATBonus = nil

    self.teamNumber = self.parent:GetTeamNumber()
    self.isHero = self.parent:IsHero()

    if(not IsServer()) then
        return
    end
    self:SetHasCustomTransmitterData(true)
    self._isFirstTick = true
    self:StartIntervalThink(0.05)
end

function modifier_custom_properties:OnRefresh()
    if(not IsServer()) then
        return
    end
    self:OnIntervalThink()
end

function modifier_custom_properties:OnIntervalThink()
    local precision = 0.01
    local propertiesRequireUpdate = 0
    local propertiesAmount = _GetCustomPropertiesThatCustomStatsImplementCount()
    local propertiesWithoutValue = 0

    if(self.isHero == false) then
        propertiesAmount = propertiesAmount - _GetCustomHeroOnlyPropertiesThatCustomStatsImplementCount()
    end

    local customProperiesPropertiesRequireUpdate, customProperiesPropertiesWithoutValue = self:CalculateCustomStats(precision)
    propertiesRequireUpdate = propertiesRequireUpdate + customProperiesPropertiesRequireUpdate
    propertiesWithoutValue = propertiesWithoutValue + customProperiesPropertiesWithoutValue

    local heroOnlyPropertiesRequireUpdate, heroOnlyPropertiesWithoutValue = self:CalculateHeroOnlyCustomStats(precision)
    propertiesRequireUpdate = propertiesRequireUpdate + heroOnlyPropertiesRequireUpdate
    propertiesWithoutValue = propertiesWithoutValue + heroOnlyPropertiesWithoutValue

    if(propertiesWithoutValue == propertiesAmount and self.isHero == false) then
        self:Destroy()
        return
    end

    if(self._isFirstTick or propertiesRequireUpdate > 0) then
        self:SendBuffRefreshToClients()
    end

    if(self._isFirstTick) then
        self:StartIntervalThink(1)
        self._isFirstTick = nil
    end
end

function modifier_custom_properties:CalculateCustomStats(precision)
    local propertiesRequireUpdate = 0
    local propertiesWithoutValue = 0
    local eventData = {}

    -- Armor %
    local bonusArmorPercent = ModifierProperties:GetModifiersPropertyAdditive(self.parent, MODIFIER_PROPERTY_MOUNTAIN_PHYSICAL_ARMOR_TOTAL_PERCENTAGE, eventData)
    local armorWithoutBonus = self.parent:GetPhysicalArmorValue(false) - self.bonusArmorPctValue
    local newBonusArmorPctValue = self:RountToInteger(armorWithoutBonus * (bonusArmorPercent / 100))
    if(math.abs(newBonusArmorPctValue - self.bonusArmorPctValue) > precision) then
        propertiesRequireUpdate = propertiesRequireUpdate + 1
    end
    if(math.abs(newBonusArmorPctValue - 0) < precision) then
        propertiesWithoutValue = propertiesWithoutValue + 1
    end
    self.bonusArmorPctValue = newBonusArmorPctValue

    -- BAT stacking
    self._ignoreThisBATBonus = true
    local batValue = self.parent:GetBaseAttackTime()
    self._ignoreThisBATBonus = nil
    local batBonusConstant = ModifierProperties:GetModifiersPropertyAdditive(self.parent, MODIFIER_PROPERTY_MOUNTAIN_BASE_ATTACK_TIME_BONUS_CONSTANT, eventData)
    local batBonusPercent = 1 + ModifierProperties:GetModifiersPropertyAdditive(self.parent, MODIFIER_PROPERTY_MOUNTAIN_BASE_ATTACK_TIME_BONUS_PERCENTAGE, eventData)
    local batBonusValue = ModifierProperties:GetModifiersPropertyLowestValue(self.parent, MODIFIER_PROPERTY_MOUNTAIN_BASE_ATTACK_TIME_CONSTANT, eventData)
    
    if(batBonusValue ~= nil and batBonusValue < batValue) then
        batValue = batBonusValue
    end

    batValue = math.max(0.03, (batValue + batBonusConstant) * batBonusPercent)

    if(math.abs(batValue - self.bonusBat) > precision) then
        propertiesRequireUpdate = propertiesRequireUpdate + 3
    end
    if(math.abs(batValue - 0) < precision) then
        propertiesWithoutValue = propertiesWithoutValue - 3
    end
    self.bonusBat = batValue

    return propertiesRequireUpdate, propertiesWithoutValue
end

function modifier_custom_properties:CalculateHeroOnlyCustomStats(precision)
    local propertiesRequireUpdate = 0
    local propertiesWithoutValue = 0

    if(self.isHero == false) then
        return propertiesRequireUpdate, propertiesWithoutValue
    end

    local eventData = {}

    -- Strength %
    local bonusStrengthPercent = ModifierProperties:GetModifiersPropertyAdditive(self.parent, MODIFIER_PROPERTY_MOUNTAIN_STATS_STRENGTH_BONUS_PERCENTAGE, eventData)
    local heroStrength = self.parent:GetStrength() - self.bonusStrengthPctValue
    local newBonusStrengthPctValue = self:RountToInteger(heroStrength * (bonusStrengthPercent / 100))
    if(math.abs(newBonusStrengthPctValue - self.bonusStrengthPctValue) > precision) then
        propertiesRequireUpdate = propertiesRequireUpdate + 1
    end
    if(math.abs(newBonusStrengthPctValue - 0) < precision) then
        propertiesWithoutValue = propertiesWithoutValue + 1
    end
    self.bonusStrengthPctValue = newBonusStrengthPctValue

    -- Agility %
    local bonusAgilityPercent = ModifierProperties:GetModifiersPropertyAdditive(self.parent, MODIFIER_PROPERTY_MOUNTAIN_STATS_AGILITY_BONUS_PERCENTAGE, eventData)
    local heroAgiltiy = self.parent:GetAgility() - self.bonusAgilityPctValue
    local newBonusAgilityPctValue = self:RountToInteger(heroAgiltiy * (bonusAgilityPercent / 100))
    if(math.abs(newBonusAgilityPctValue - self.bonusAgilityPctValue) > precision) then
        propertiesRequireUpdate = propertiesRequireUpdate + 1
    end
    if(math.abs(newBonusAgilityPctValue - 0) < precision) then
        propertiesWithoutValue = propertiesWithoutValue + 1
    end
    self.bonusAgilityPctValue = newBonusAgilityPctValue

    -- Intellect %
    local bonusIntellectPercent = ModifierProperties:GetModifiersPropertyAdditive(self.parent, MODIFIER_PROPERTY_MOUNTAIN_STATS_INTELLECT_BONUS_PERCENTAGE, eventData)
    local heroIntellect = self.parent:GetIntellect(false) - self.bonusIntellectPctValue
    local newBonusIntellectPctValue = self:RountToInteger(heroIntellect * (bonusIntellectPercent / 100))
    if(math.abs(newBonusIntellectPctValue - self.bonusIntellectPctValue) > precision) then
        propertiesRequireUpdate = propertiesRequireUpdate + 1
    end
    if(math.abs(newBonusIntellectPctValue - 0) < precision) then
        propertiesWithoutValue = propertiesWithoutValue + 1
    end
    self.bonusIntellectPctValue = newBonusIntellectPctValue

    return propertiesRequireUpdate, propertiesWithoutValue
end

function modifier_custom_properties:RountToInteger(x)
    return x>=0 and math.floor(x+0.5) or math.ceil(x-0.5)
end

function modifier_custom_properties:AddCustomTransmitterData()
    return 
    {
        bonusStrengthPctValue = self.bonusStrengthPctValue,
        bonusAgilityPctValue = self.bonusAgilityPctValue,
        bonusIntellectPctValue = self.bonusIntellectPctValue,
        bonusArmorPctValue = self.bonusArmorPctValue,
        bonusBat = self.bonusBat
	}
end

function modifier_custom_properties:HandleCustomTransmitterData(data)
    for k,v in pairs(data) do
        self[k] = v
    end
end

function modifier_custom_properties:GetModifierBaseAttackTimeConstant()
    if(self._ignoreThisBATBonus) then
        return nil
    end
    return self.bonusBat
end

function modifier_custom_properties:GetModifierBonusStats_Strength()
    return self.bonusStrengthPctValue
end

function modifier_custom_properties:GetModifierBonusStats_Agility()
    return self.bonusAgilityPctValue
end

function modifier_custom_properties:GetModifierBonusStats_Intellect()
    return self.bonusIntellectPctValue
end

function modifier_custom_properties:GetModifierPhysicalArmorBonus()
    return self.bonusArmorPctValue
end

function modifier_custom_properties:OnAttackLanded(kv)
    if(kv.attacker ~= self.parent) then
        return
    end

    local filterResult = UnitFilter(
		kv.target, 
		DOTA_UNIT_TARGET_TEAM_ENEMY, 
		DOTA_UNIT_TARGET_BASIC + DOTA_UNIT_TARGET_HERO, 
		DOTA_UNIT_TARGET_FLAG_MAGIC_IMMUNE_ENEMIES, 
		self.teamNumber
	)
    if(filterResult ~= UF_SUCCESS) then
        return
    end

    local totalLifestealPct = ModifierProperties:GetModifiersPropertyAdditive(self.parent, MODIFIER_PROPERTY_MOUNTAIN_LIFESTEAL, kv) / 100

    if(totalLifestealPct > 0) then
        local totalLifesteal = kv.damage * totalLifestealPct
        self.parent:PerformLifesteal(kv.target, totalLifesteal, kv)
    end
end

function modifier_custom_properties:OnTakeDamage(kv)
    if(kv.attacker ~= self.parent) then
        return
    end

    if(kv.damage_category ~= DOTA_DAMAGE_CATEGORY_SPELL) then
        return
    end

    if(bit.band(kv.damage_flags, DOTA_DAMAGE_FLAG_REFLECTION) == DOTA_DAMAGE_FLAG_REFLECTION) then
        return
    end

    if(bit.band(kv.damage_flags, DOTA_DAMAGE_FLAG_NO_SPELL_LIFESTEAL) == DOTA_DAMAGE_FLAG_NO_SPELL_LIFESTEAL) then
        return
    end
    
    local filterResult = UnitFilter(
		kv.unit, 
		DOTA_UNIT_TARGET_TEAM_ENEMY, 
		DOTA_UNIT_TARGET_BASIC + DOTA_UNIT_TARGET_HERO, 
		DOTA_UNIT_TARGET_FLAG_MAGIC_IMMUNE_ENEMIES + DOTA_UNIT_TARGET_FLAG_DEAD, 
		self.teamNumber
	)

    if(filterResult ~= UF_SUCCESS) then
        return
    end

    local totalLifestealPct = ModifierProperties:GetModifiersPropertyAdditive(self.parent, MODIFIER_PROPERTY_MOUNTAIN_SPELL_LIFESTEAL, kv) / 100

    if(totalLifestealPct > 0) then
        local totalLifesteal = kv.damage * totalLifestealPct
        self.parent:PerformSpellLifesteal(kv.unit, kv.inflictor, totalLifesteal, kv)
    end
end

LinkLuaModifier("modifier_custom_properties", "modifiers/modifier_custom_properties", LUA_MODIFIER_MOTION_NONE)

function _GetCustomHeroOnlyPropertiesThatCustomStatsImplement()
    _G._modifierHeroOnlyCustomStatsImplementedProperties = _G._modifierHeroOnlyCustomStatsImplementedProperties or {
        ModifierProperties:GetModifierPropertyGetter(MODIFIER_PROPERTY_MOUNTAIN_STATS_STRENGTH_BONUS_PERCENTAGE),
        ModifierProperties:GetModifierPropertyGetter(MODIFIER_PROPERTY_MOUNTAIN_STATS_AGILITY_BONUS_PERCENTAGE),
        ModifierProperties:GetModifierPropertyGetter(MODIFIER_PROPERTY_MOUNTAIN_STATS_INTELLECT_BONUS_PERCENTAGE)
    }
    return _G._modifierHeroOnlyCustomStatsImplementedProperties
end

function _GetCustomHeroOnlyPropertiesThatCustomStatsImplementCount()
    if(_G._modifierCustomStatsImplementedPropertiesHeroOnlyCount ~= nil) then
        return _G._modifierCustomStatsImplementedPropertiesHeroOnlyCount
    end

    local customProperties = _GetCustomHeroOnlyPropertiesThatCustomStatsImplement()
    _G._modifierCustomStatsImplementedPropertiesHeroOnlyCount = #customProperties

    return _GetCustomHeroOnlyPropertiesThatCustomStatsImplementCount()
end


function _GetCustomPropertiesThatCustomStatsImplement()
    if(_G._modifierCustomStatsImplementedProperties == nil) then
        _G._modifierCustomStatsImplementedProperties = {
            ModifierProperties:GetModifierPropertyGetter(MODIFIER_PROPERTY_MOUNTAIN_PHYSICAL_ARMOR_TOTAL_PERCENTAGE),
            ModifierProperties:GetModifierPropertyGetter(MODIFIER_PROPERTY_MOUNTAIN_BASE_ATTACK_TIME_CONSTANT),
            ModifierProperties:GetModifierPropertyGetter(MODIFIER_PROPERTY_MOUNTAIN_BASE_ATTACK_TIME_BONUS_CONSTANT),
            ModifierProperties:GetModifierPropertyGetter(MODIFIER_PROPERTY_MOUNTAIN_BASE_ATTACK_TIME_BONUS_PERCENTAGE),
            ModifierProperties:GetModifierPropertyGetter(MODIFIER_PROPERTY_MOUNTAIN_LIFESTEAL),
            ModifierProperties:GetModifierPropertyGetter(MODIFIER_PROPERTY_MOUNTAIN_SPELL_LIFESTEAL)
        }
        for _, v in pairs(_GetCustomHeroOnlyPropertiesThatCustomStatsImplement()) do
            table.insert(_G._modifierCustomStatsImplementedProperties, v)
        end
    end
    return _G._modifierCustomStatsImplementedProperties
end

function _GetCustomPropertiesThatCustomStatsImplementCount()
    if(_G._modifierCustomStatsImplementedPropertiesCount ~= nil) then
        return _G._modifierCustomStatsImplementedPropertiesCount
    end

    local customProperties = _GetCustomPropertiesThatCustomStatsImplement()
    _G._modifierCustomStatsImplementedPropertiesCount = #customProperties

    return _GetCustomPropertiesThatCustomStatsImplementCount()
end

function _IsModifierHasCustomProperties(modifier)
    for _, getterName in pairs(_GetCustomPropertiesThatCustomStatsImplement()) do
        if(modifier[getterName]) then
            return true
        end
    end

    return false
end

function _RefreshCustomStatsForUnit(unit, checkModifierExistance)
    if(type(unit) ~= "table" or unit.GetUnitName == nil) then
        return
    end
    if(checkModifierExistance == nil) then
        checkModifierExistance = true
    end
    --local customStatsModifier = unit:GetCustomStatsModifier()
    if(checkModifierExistance == true) then
        return
    end
    if(unit:IsCustomStatsModifierJustAdded() == true) then
        return
    end
    unit:SetIsCustomStatsModifierJustAdded(true)
    customStatsModifier = unit:AddCustomStatsModifier()
    if(customStatsModifier and customStatsModifier:IsNull() == false) then
        customStatsModifier:ForceRefresh()
    end
    unit:SetIsCustomStatsModifierJustAdded(false)
end

function _OnCustomStatsRefreshRequired(modifier)
    if(not modifier or modifier:IsNull() == true) then
        return
    end
    if(modifier:GetName() == "modifier_custom_properties") then
        return
    end
    if(_IsModifierHasCustomProperties(modifier) == false) then
        return
    end
    local parent = modifier:GetParent()
    _RefreshCustomStatsForUnit(parent, false)
end

if(IsServer() and not _G._modifierCustomPropertiesInit) then
    CustomEvents:RegisterEventHandler(CUSTOM_EVENT_ON_MODIFIER_ADDED, function(kv)
        _OnCustomStatsRefreshRequired(kv.modifier)
    end)
    CustomEvents:RegisterEventHandler(CUSTOM_EVENT_ON_MODIFIER_DESTROYED, function(kv)
        _OnCustomStatsRefreshRequired(kv.modifier)
    end)
    CustomEvents:RegisterEventHandler(CUSTOM_EVENT_ON_MODIFIER_REFRESHED, function(kv)
        _OnCustomStatsRefreshRequired(kv.modifier)
    end)
    CustomEvents:RegisterEventHandler(CUSTOM_EVENT_ON_MODIFIER_STACKS_COUNT_CHANGED, function(kv)
        _OnCustomStatsRefreshRequired(kv.modifier)
    end)
    _G._modifierCustomPropertiesInit = true
end