require("abilities/talents/base/talent_base_class")

talent_bonus_strength_base = class(talent_base_class)

function talent_bonus_strength_base:GetIntrinsicModifierName()
    return "modifier_talent_bonus_strength_base"
end

modifier_talent_bonus_strength_base = class({
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
        return {
            MODIFIER_PROPERTY_STATS_STRENGTH_BONUS 
        }
    end,
    GetModifierBonusStats_Strength = function(self)
        return self.bonusStrength
    end,
    GetAttributes = function()
        return MODIFIER_ATTRIBUTE_MULTIPLE
    end
})

function modifier_talent_bonus_strength_base:OnCreated()
	self:OnRefresh()
end

function modifier_talent_bonus_strength_base:OnRefresh()
    self.ability = self:GetAbility() or self.ability
    if(not self.ability or self.ability:IsNull()) then
        return
    end
    self.bonusStrength = self.ability:GetSpecialValueFor("value")
end

LinkLuaModifier("modifier_talent_bonus_strength_base", "abilities/talents/talent_bonus_strength", LUA_MODIFIER_MOTION_NONE)
LinkLuaAbility(talent_bonus_strength_base, "abilities/talents/talent_bonus_strength")