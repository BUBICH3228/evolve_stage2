require("abilities/talents/base/talent_base_class")

talent_bonus_magic_resistance = class(talent_base_class)

function talent_bonus_magic_resistance:GetIntrinsicModifierName()
    return "modifier_talent_bonus_magic_resistance"
end

modifier_talent_bonus_magic_resistance = class({
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
            MODIFIER_PROPERTY_MAGICAL_RESISTANCE_BONUS 
        }
    end,
    GetModifierMagicalResistanceBonus = function(self)
        return self.bonusMagicResistance
    end,
    GetAttributes = function()
        return MODIFIER_ATTRIBUTE_MULTIPLE
    end
})

function modifier_talent_bonus_magic_resistance:OnCreated()
	self:OnRefresh()
end

function modifier_talent_bonus_magic_resistance:OnRefresh()
    self.ability = self:GetAbility() or self.ability
    if(not self.ability or self.ability:IsNull()) then
        return
    end
    self.bonusMagicResistance = self.ability:GetSpecialValueFor("value")
end

LinkLuaModifier("modifier_talent_bonus_magic_resistance", "abilities/talents/talent_bonus_magic_resistance", LUA_MODIFIER_MOTION_NONE)
LinkLuaAbility(talent_bonus_magic_resistance, "abilities/talents/talent_bonus_magic_resistance")