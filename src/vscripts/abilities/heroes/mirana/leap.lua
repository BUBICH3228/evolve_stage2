mirana_leap_custom = class({})

function mirana_leap_custom:GetCastRange()
    return self:GetSpecialValueFor("leap_distance")
end

function mirana_leap_custom:OnSpellStart()
    if(not IsServer()) then
        return
    end
    local caster = self:GetCaster()
    self:ApplyBuff(caster, caster)
    local arc = caster:AddNewModifier(
		caster,
		self,
		"modifier_generic_arc",
		{
			distance = self:GetCastRange(),
			speed = self:GetSpecialValueFor("leap_speed"),
			height = self:GetSpecialValueFor("leap_height"),
			fix_end = false,
			isForward = true
		}
	)
	arc:SetEndCallback(function()
        self:OnHeroLanded(caster)
	end)
	self:SetActivated(false)
    EmitSoundOn("Ability.Leap", caster)
end

function mirana_leap_custom:OnHeroLanded(caster)
    self:SetActivated(true)
    if(caster:HasShard() == false) then
        return
    end
    local allies = FindUnitsInRadius(
        caster:GetTeamNumber(), 
        caster:GetAbsOrigin(), 
        nil, 
        self:GetSpecialValueFor("shard_radius"), 
        self:GetAbilityTargetTeam(), 
        self:GetAbilityTargetType(), 
        self:GetAbilityTargetFlags(), 
        FIND_ANY_ORDER, 
        false
    )
    for _, ally in pairs(allies) do
        self:ApplyBuff(caster, ally)
    end
end

function mirana_leap_custom:ApplyBuff(caster, target)
    target:AddNewModifier(
		caster,
		self,
		"modifier_mirana_leap_custom_buff",
		{ 
            duration = self:GetSpecialValueFor("duration")
        }
	)
end

modifier_mirana_leap_custom_buff = class({
    IsHidden = function()
        return false
    end,
    IsDebuff = function()
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
            MODIFIER_PROPERTY_TOOLTIP,
            MODIFIER_PROPERTY_MOUNTAIN_STATS_AGILITY_BONUS_PERCENTAGE,
            MODIFIER_PROPERTY_MOUNTAIN_BASE_ATTACK_TIME_BONUS_CONSTANT
        }
    end,
    GetModifierBonusStats_Agility_Percentage = function(self)
        return self.bonusAgilityPct
    end,
    GetModifierBonusBaseAttackTimeConstant = function(self)
        return self.bonusBAT
    end,
    OnTooltip = function(self)
        return self:GetModifierBonusStats_Agility_Percentage()
    end
})

function modifier_mirana_leap_custom_buff:OnCreated()
	self:OnRefresh()
end

function modifier_mirana_leap_custom_buff:OnRefresh()
    self.ability = self:GetAbility() or self.ability
    if(not self.ability or self.ability:IsNull() == true) then
        return
    end
    self.bonusAgilityPct = self.ability:GetSpecialValueFor("bonus_agility_pct")
    self.bonusBAT = self.ability:GetSpecialValueFor("bonus_bat")
end

LinkLuaModifier("modifier_mirana_leap_custom_buff", "abilities/heroes/mirana/leap", LUA_MODIFIER_MOTION_NONE)