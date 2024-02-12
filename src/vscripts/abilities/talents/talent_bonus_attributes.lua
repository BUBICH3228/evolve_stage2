talent_bonus_attributes_custom = class({
    GetIntrinsicModifierName = function()
        return "modifier_talent_bonus_attributes_custom"
    end,
    IsAttributeBonus = function()
        return true
    end
})

modifier_talent_bonus_attributes_custom = class({
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
	IsDebuff = function()
		return false
	end,
    DeclareFunctions = function()
        return 
        {
            MODIFIER_PROPERTY_MOUNTAIN_STATS_STRENGTH_BONUS_PERCENTAGE,
            MODIFIER_PROPERTY_MOUNTAIN_STATS_AGILITY_BONUS_PERCENTAGE,
            MODIFIER_PROPERTY_MOUNTAIN_STATS_INTELLECT_BONUS_PERCENTAGE
        }
    end,
    GetModifierBonusStats_Strength_Percentage = function(self)
        return self.bonusAllStatsPct
    end,
    GetModifierBonusStats_Agility_Percentage = function(self)
        return self.bonusAllStatsPct
    end,
    GetModifierBonusStats_Intellect_Percentage = function(self)
        return self.bonusAllStatsPct
    end
})

function modifier_talent_bonus_attributes_custom:OnCreated()
	self:OnRefresh()
end

function modifier_talent_bonus_attributes_custom:OnRefresh()
    self.ability = self:GetAbility() or self.ability
    if(not self.ability or self.ability:IsNull()) then
        return
    end
    self.bonusAllStatsPct = self.ability:GetSpecialValueFor("value")
end

LinkLuaModifier("modifier_talent_bonus_attributes_custom", "abilities/talents/talent_bonus_attributes", LUA_MODIFIER_MOTION_NONE)