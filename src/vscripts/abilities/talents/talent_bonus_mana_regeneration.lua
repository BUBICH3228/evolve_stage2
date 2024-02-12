require("abilities/talents/base/talent_base_class")

talent_bonus_mana_regeneration_base = class(talent_base_class)

function talent_bonus_mana_regeneration_base:GetIntrinsicModifierName()
    return "modifier_talent_bonus_mana_regeneration_base"
end

modifier_talent_bonus_mana_regeneration_base = class({
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
            MODIFIER_PROPERTY_MANA_REGEN_CONSTANT 
        }
    end,
    GetModifierConstantManaRegen = function(self)
        return self.bonusManaRegeneration
    end,
    GetAttributes = function()
        return MODIFIER_ATTRIBUTE_MULTIPLE
    end
})

function modifier_talent_bonus_mana_regeneration_base:OnCreated()
	self:OnRefresh()
end

function modifier_talent_bonus_mana_regeneration_base:OnRefresh()
    self.ability = self:GetAbility() or self.ability
    if(not self.ability or self.ability:IsNull()) then
        return
    end
    self.bonusManaRegeneration = self.ability:GetSpecialValueFor("value")
end

LinkLuaModifier("modifier_talent_bonus_mana_regeneration_base", "abilities/talents/talent_bonus_mana_regeneration", LUA_MODIFIER_MOTION_NONE)
LinkLuaAbility(talent_bonus_mana_regeneration_base, "abilities/talents/talent_bonus_mana_regeneration")