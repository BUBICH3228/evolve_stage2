modifier_heroes_passive_stats = class({
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
		return 
		{
			MODIFIER_PROPERTY_MANACOST_PERCENTAGE,
            MODIFIER_PROPERTY_SPELL_AMPLIFY_PERCENTAGE,
            MODIFIER_PROPERTY_MAGICAL_RESISTANCE_BONUS,
            MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT,
			MODIFIER_PROPERTY_MAGICAL_RESISTANCE_DIRECT_MODIFICATION
		}
	end,
	GetModifierIgnoreMovespeedLimit = function()
		return 1
	end
})

function modifier_heroes_passive_stats:OnCreated()
	self.parent = self:GetParent()

	self.bonusSpellAmpPerAttribute = self.bonusSpellAmpPerAttribute or 0
    self.bonusMagicalResistancePerAttribute = self.bonusMagicalResistancePerAttribute or 0
    self.bonusMoveSpeedPerAttribute = self.bonusMoveSpeedPerAttribute or 0
    self.bonusMoveSpeedMax = self.bonusMoveSpeedMax or 0
	self.maxManaDelimiter = self.maxManaDelimiter or 0
	self.manacostIncreaseMax = self.manacostIncreaseMax or 0

	if(not IsServer()) then
		return
	end
	self.dotaNegativeMagicResistancePerInt = GameRules:GetGameModeEntity():GetCustomAttributeDerivedStatValue(DOTA_ATTRIBUTE_INTELLIGENCE_MAGIC_RESIST) * -1
	self.bonusSpellAmpPerAttribute = GameSettings:GetSettingValueAsNumber("dota_attribute_spell_ampification_per_intelligence")
    self.bonusMagicalResistancePerAttribute = GameSettings:GetSettingValueAsNumber("dota_attribute_magic_resistance_per_strength")
    self.bonusMoveSpeedPerAttribute = GameSettings:GetSettingValueAsNumber("dota_attribute_move_speed_per_agility")
    self.bonusMoveSpeedMax = GameSettings:GetSettingValueAsNumber("dota_attribute_move_speed_max")
	self.maxManaDelimiter = GameSettings:GetSettingValueAsNumber("percentage_manacustom_delimiter") * -1
	self.manacostIncreaseMax = GameSettings:GetSettingValueAsNumber("percentage_manacustom_max_increase") * -1
	self.bonusMagicalResistanceMax = GameSettings:GetSettingValueAsNumber("dota_attribute_magic_resistance_per_strength_max")
	self.exceptionsList = {}
	local exceptions = GameSettings:GetSettingValueAsTable("percentage_manacustom_exceptions")
	for _, exception in pairs(exceptions) do
		self.exceptionsList[exception] = true
	end
	self:SetHasCustomTransmitterData(true)
    self:StartIntervalThink(0.05)
end

function modifier_heroes_passive_stats:OnIntervalThink()
	self:SendBuffRefreshToClients()
	self:StartIntervalThink(-1)
end

function modifier_heroes_passive_stats:GetModifierPercentageManacost(kv)
	if(not kv.ability or kv.ability:IsItem() or self.exceptionsList[kv.ability:GetAbilityName()]) then
		return 0
	end

	return math.max(self.manacostIncreaseMax, self.parent:GetMaxMana() / self.maxManaDelimiter)
end

function modifier_heroes_passive_stats:GetModifierSpellAmplify_Percentage()
    return self.parent:GetIntellect() * self.bonusSpellAmpPerAttribute
end

function modifier_heroes_passive_stats:GetModifierMagicalResistanceBonus()
    return math.min(self.parent:GetStrength() * self.bonusMagicalResistancePerAttribute, self.bonusMagicalResistanceMax)
end

function modifier_heroes_passive_stats:GetModifierMagicalResistanceDirectModification()
	return self.dotaNegativeMagicResistancePerInt * self.parent:GetIntellect()
end

function modifier_heroes_passive_stats:GetModifierMoveSpeedBonus_Constant()
    return self.parent:GetAgility() * self.bonusMoveSpeedPerAttribute
end

function modifier_heroes_passive_stats:AddCustomTransmitterData()
    return 
	{
        bonusSpellAmpPerAttribute = self.bonusSpellAmpPerAttribute,
        bonusMagicalResistancePerAttribute = self.bonusMagicalResistancePerAttribute,
		bonusMagicalResistanceMax = self.bonusMagicalResistanceMax,
        bonusMoveSpeedPerAttribute = self.bonusMoveSpeedPerAttribute,
        bonusMoveSpeedMax = self.bonusMoveSpeedMax,
		maxManaDelimiter = self.maxManaDelimiter,
		manacostIncreaseMax = self.manacostIncreaseMax,
		exceptionsList = self.exceptionsList,
		dotaNegativeMagicResistancePerInt = self.dotaNegativeMagicResistancePerInt
	}
end

function modifier_heroes_passive_stats:HandleCustomTransmitterData(data)
    for k,v in pairs(data) do
        self[k] = v
    end
end

LinkLuaModifier("modifier_heroes_passive_stats", "modifiers/modifier_heroes_passive_stats", LUA_MODIFIER_MOTION_NONE)