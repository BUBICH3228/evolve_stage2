require("abilities/talents/base/talent_base_class")

talent_bonus_cleave_base = class(talent_base_class)

function talent_bonus_cleave_base:Precache(context)
	PrecacheResource("particle", "particles/items_fx/battlefury_cleave.vpcf", context)
end

function talent_bonus_cleave_base:GetIntrinsicModifierName()
    return "modifier_talent_bonus_cleave_base"
end

modifier_talent_bonus_cleave_base = class({
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
            MODIFIER_EVENT_ON_ATTACK_LANDED 
        }
    end,
    GetModifierAttackSpeedBonus_Constant = function(self)
        return self.bonusAttackSpeed
    end,
    GetAttributes = function()
        return MODIFIER_ATTRIBUTE_MULTIPLE
    end
})

function modifier_talent_bonus_cleave_base:OnCreated()
    self.parent = self:GetParent()
	self:OnRefresh()
    if(not IsServer()) then
        return
    end
    self.targetTeam = self.ability:GetAbilityTargetTeam()
	self.targetType = self.ability:GetAbilityTargetType()
	self.targetFlags = self.ability:GetAbilityTargetFlags()
end

function modifier_talent_bonus_cleave_base:OnRefresh()
    self.ability = self:GetAbility() or self.ability
    if(not self.ability or self.ability:IsNull()) then
        return
    end
    self.cleavePercent = self.ability:GetSpecialValueFor("value") / 100
    self.cleaveStartRadius = self.ability:GetSpecialValueFor("cleave_start_radius")
    self.cleaveEndRadius = self.ability:GetSpecialValueFor("cleave_end_radius")
    self.cleaveRange = self.ability:GetSpecialValueFor("cleave_range")
end

function modifier_talent_bonus_cleave_base:OnAttackLanded(kv)
    if(kv.attacker ~= self.parent) then
        return
    end
    if(UnitFilter(kv.target, self.targetTeam, self.targetType, self.targetFlags, self.parent:GetTeamNumber()) ~= UF_SUCCESS) then
        return
    end
    if(kv.attacker:GetAttackCapability() ~= DOTA_UNIT_CAP_MELEE_ATTACK) then
        return
    end
    DoCleaveAttack(
        self.parent, 
        kv.target, 
        self.ability, 
        kv.original_damage * self.cleavePercent, 
        self.cleaveStartRadius,
        self.cleaveEndRadius, 
        self.cleaveRange, 
        "particles/items_fx/battlefury_cleave.vpcf"
    )
end

LinkLuaModifier("modifier_talent_bonus_cleave_base", "abilities/talents/talent_bonus_cleave", LUA_MODIFIER_MOTION_NONE)
LinkLuaAbility(talent_bonus_cleave_base, "abilities/talents/talent_bonus_cleave")