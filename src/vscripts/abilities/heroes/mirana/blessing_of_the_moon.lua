mirana_blessing_of_the_moon_custom = class({
    GetIntrinsicModifierName = function()
        return "modifier_mirana_blessing_of_the_moon_custom_aura"
    end,
    GetCastRange = function(self)
        return self:GetSpecialValueFor("radius")
    end
})

modifier_mirana_blessing_of_the_moon_custom_aura = class({
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
    IsAura = function() 
        return true 
    end,
    GetAuraRadius = function(self) 
        return self.radius
    end,
    GetAuraSearchTeam = function(self) 
        return self.targetTeam
    end,
    GetAuraSearchType = function(self) 
        return self.targetType
    end,
    GetAuraSearchFlags = function(self)
        return self.targetFlags
    end,
    GetModifierAura = function() 
        return "modifier_mirana_blessing_of_the_moon_custom_aura_buff" 
    end,
	GetAuraDuration = function()
		return 0
	end,
    GetAttributes = function()
        return MODIFIER_ATTRIBUTE_IGNORE_INVULNERABLE
    end
})

function modifier_mirana_blessing_of_the_moon_custom_aura:OnCreated()
	self.parent = self:GetParent()
    self.ability = self:GetAbility()
    self:OnRefresh()
	if(not IsServer()) then
        return
	end
    self.targetTeam = DOTA_UNIT_TARGET_TEAM_FRIENDLY
    self.targetType = DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC
    self.targetFlags = DOTA_UNIT_TARGET_FLAG_NONE
end

function modifier_mirana_blessing_of_the_moon_custom_aura:OnRefresh()
    self.ability = self:GetAbility() or self.ability
    if(not self.ability or self.ability:IsNull() == true) then
        return
    end
    self.radius = self.ability:GetSpecialValueFor("radius")
end

function modifier_mirana_blessing_of_the_moon_custom_aura:GetAuraEntityReject(npc)
    if(self.parent:HasTalent("talent_mirana_blessing_of_the_moon_aura")) then
        return false
    end
    return npc ~= self.parent
end

modifier_mirana_blessing_of_the_moon_custom_aura_buff = class({
    IsHidden = function()
        return false
    end,
    IsPurgable = function()
        return false
    end,
    IsPurgeException = function()
        return false
    end,
    DeclareFunctions = function()
        return {
            MODIFIER_PROPERTY_PREATTACK_CRITICALSTRIKE,
            MODIFIER_PROPERTY_EVASION_CONSTANT,
            MODIFIER_PROPERTY_TOOLTIP
        }
    end
})

function modifier_mirana_blessing_of_the_moon_custom_aura_buff:OnCreated()
    self.ability = self:GetAbility()
    if(not self.ability) then
        self:Destroy()
        return
    end
    self.caster = self:GetCaster()
	self.parent = self:GetParent()
    self:OnRefresh()
    self.tooltipIndex = 0
	if(not IsServer()) then
        return
	end
    self.targetTeam = self.ability:GetAbilityTargetTeam()
    self.targetType = self.ability:GetAbilityTargetType()
    self.targetFlags = self.ability:GetAbilityTargetFlags()
    self:SetHasCustomTransmitterData(true)
    self.isFirstTick = true
    self:StartIntervalThink(0.05)
end

function modifier_mirana_blessing_of_the_moon_custom_aura_buff:OnRefresh()
    self.ability = self:GetAbility() or self.ability
    if(not self.ability or self.ability:IsNull() == true) then
        return
    end
    self.critChance = self.ability:GetSpecialValueFor("critical_strike_chance")
    self.critChanceNight = self.ability:GetSpecialValueFor("critical_strike_chance_night")
	self.critMultiplier = self.ability:GetSpecialValueFor("critical_strike_damage") / 100
	self.critMultiplierPerAgi = self.ability:GetSpecialValueFor("agility_pct_to_critical_strike_damage") / 10000
    self.bonusEvasion = self.ability:GetSpecialValueFor("bonus_evasion")
end

function modifier_mirana_blessing_of_the_moon_custom_aura_buff:OnIntervalThink()
    local isNight = self:IsNight()
    if(isNight ~= self.isNight) then
        self.isNight = isNight
        self:SendBuffRefreshToClients()
    end
    if(self.isFirstTick == true) then
        self:StartIntervalThink(1)
        self.isFirstTick = nil
    end
end

function modifier_mirana_blessing_of_the_moon_custom_aura_buff:IsNight()
    return GameRules:IsDaytime() == false
end

function modifier_mirana_blessing_of_the_moon_custom_aura_buff:GetModifierPreAttack_CriticalStrike(kv)	
	if(UnitFilter(kv.target, self.targetTeam, self.targetType, self.targetFlags, self.parent:GetTeamNumber()) ~= UF_SUCCESS) then
		return
	end
	if(self.parent:PassivesDisabled()) then
        return
    end
    local critChance = self:GetCritChancePct()
    if(RollPseudoRandomPercentage(critChance, self) == false) then
        return
    end
	return self:GetCritDamagePct()
end

function modifier_mirana_blessing_of_the_moon_custom_aura_buff:GetModifierEvasion_Constant()
    if(self.isNight == 1) then
        return self.bonusEvasion
    end
    return 0
end

function modifier_mirana_blessing_of_the_moon_custom_aura_buff:GetCritChancePct()
    if(self.isNight == 1) then
        return self.critChanceNight
    end
    return self.critChance
end

function modifier_mirana_blessing_of_the_moon_custom_aura_buff:GetCritDamagePct()
	return self:GetCritDamage() * 100
end

function modifier_mirana_blessing_of_the_moon_custom_aura_buff:GetCritDamage()
	return self.critMultiplier + (self.critMultiplierPerAgi * self.parent:GetAgility())
end

function modifier_mirana_blessing_of_the_moon_custom_aura_buff:OnTooltip()
    local result = 0
    if(self.tooltipIndex == 0) then
        result = self:GetCritChancePct()
    end
    if(self.tooltipIndex == 1) then
        result = self:GetCritDamagePct()
    end
    self.tooltipIndex = self.tooltipIndex + 1
    if(self.tooltipIndex > 1) then
        self.tooltipIndex = 0
    end
    return result
end

function modifier_mirana_blessing_of_the_moon_custom_aura_buff:AddCustomTransmitterData()
    return {
        isNight = self.isNight
    }
end

function modifier_mirana_blessing_of_the_moon_custom_aura_buff:HandleCustomTransmitterData(data)
    for k,v in pairs(data) do
        self[k] = v
    end
end

LinkLuaModifier("modifier_mirana_blessing_of_the_moon_custom_aura", "abilities/heroes/mirana/blessing_of_the_moon", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_mirana_blessing_of_the_moon_custom_aura_buff", "abilities/heroes/mirana/blessing_of_the_moon", LUA_MODIFIER_MOTION_NONE)