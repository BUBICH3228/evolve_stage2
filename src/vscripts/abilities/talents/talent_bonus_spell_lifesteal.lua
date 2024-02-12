require("abilities/talents/base/talent_base_class")

talent_bonus_spell_lifesteal_base = class(talent_base_class)

function talent_bonus_spell_lifesteal_base:GetIntrinsicModifierName()
    return "modifier_talent_bonus_spell_lifesteal_base"
end

modifier_talent_bonus_spell_lifesteal_base = class({
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
            MODIFIER_EVENT_ON_TAKEDAMAGE,
            MODIFIER_PROPERTY_MOUNTAIN_SPELL_LIFESTEAL
        }
    end,
    GetModifierSpellLifesteal = function(self)
        return self.bonusSpellLifesteal
    end,
    GetAttributes = function()
        return MODIFIER_ATTRIBUTE_MULTIPLE
    end
})

function modifier_talent_bonus_spell_lifesteal_base:OnCreated()
    self.parent = self:GetParent()
	self:OnRefresh()
end

function modifier_talent_bonus_spell_lifesteal_base:OnRefresh()
    self.ability = self:GetAbility() or self.ability
    if(not self.ability or self.ability:IsNull()) then
        return
    end
    self.bonusSpellLifesteal = self.ability:GetSpecialValueFor("value")
end

LinkLuaModifier("modifier_talent_bonus_spell_lifesteal_base", "abilities/talents/talent_bonus_spell_lifesteal", LUA_MODIFIER_MOTION_NONE)
LinkLuaAbility(talent_bonus_spell_lifesteal_base, "abilities/talents/talent_bonus_spell_lifesteal")