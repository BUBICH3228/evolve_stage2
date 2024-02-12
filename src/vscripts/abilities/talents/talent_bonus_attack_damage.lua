require("abilities/talents/base/talent_base_class")

talent_bonus_attack_damage_base = class(talent_base_class)

function talent_bonus_attack_damage_base:GetIntrinsicModifierName()
    return "modifier_talent_bonus_attack_damage"
end

modifier_talent_bonus_attack_damage = class({
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
            MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE 
        }
    end,
    GetModifierPreAttack_BonusDamage = function(self)
        return self.bonusAttackDamage
    end,
    GetAttributes = function()
        return MODIFIER_ATTRIBUTE_MULTIPLE
    end
})

function modifier_talent_bonus_attack_damage:OnCreated()
	self:OnRefresh()
end

function modifier_talent_bonus_attack_damage:OnRefresh()
    self.ability = self:GetAbility() or self.ability
    if(not self.ability or self.ability:IsNull()) then
        return
    end
    self.bonusAttackDamage = self.ability:GetSpecialValueFor("value")
end

LinkLuaModifier("modifier_talent_bonus_attack_damage", "abilities/talents/talent_bonus_attack_damage", LUA_MODIFIER_MOTION_NONE)
LinkLuaAbility(talent_bonus_attack_damage_base, "abilities/talents/talent_bonus_attack_damage")