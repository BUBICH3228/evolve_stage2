legion_commander_press_the_attack_custom = class({})

function legion_commander_press_the_attack_custom:Precache(context)
    local caster = self:GetCaster()
    PrecacheResource("particle", ParticleManager:GetParticleReplacement("particles/units/heroes/hero_legion_commander/legion_commander_press.vpcf", caster), context)
end

function legion_commander_press_the_attack_custom:GetBehavior()
    if(self:GetCaster():HasTalent("talent_legion_commander_press_the_attack_aoe")) then
        return DOTA_ABILITY_BEHAVIOR_POINT + DOTA_ABILITY_BEHAVIOR_AOE + DOTA_ABILITY_BEHAVIOR_UNIT_TARGET
    end
    return self.BaseClass.GetBehavior(self)
end

function legion_commander_press_the_attack_custom:GetAOERadius()
	return self:GetSpecialValueFor("aoe_radius")
end

function legion_commander_press_the_attack_custom:OnAbilityUpgrade(upgradeAbility)
	local abilityName = upgradeAbility:GetAbilityName()
	if(abilityName ~= "talent_legion_commander_press_the_attack_passive"
	and abilityName ~= "legion_commander_press_the_attack_custom") then
		return
	end
	local caster = self:GetCaster()
	if(caster:IsAlive()) then
		self:ApplyPermamentBuffTalentEffect(caster)
	else
		Timers:CreateTimer(1, function()
			if(caster:IsAlive() == false) then
				return 1
			end
			self:ApplyPermamentBuffTalentEffect(caster)
		end)
	end
end

function legion_commander_press_the_attack_custom:ApplyPermamentBuffTalentEffect(caster)
	if(self:GetLevel() > 0 and caster:HasTalent("talent_legion_commander_press_the_attack_passive")) then
		caster:AddNewModifier(caster, self, "modifier_legion_commander_press_the_attack_custom", {duration = -1})
	end
end

function legion_commander_press_the_attack_custom:OnSpellStart()
    if(not IsServer()) then
        return
    end
	
	local caster = self:GetCaster()
	local target = self:GetCursorTarget()

	local duration = self:GetSpecialValueFor("duration")

	if caster:HasTalent("talent_legion_commander_press_the_attack_aoe") then
		local allies = FindUnitsInRadius(
			caster:GetTeamNumber(),
			self:GetCursorPosition(),
			nil,
			self:GetSpecialValueFor("aoe_radius"),
			self:GetAbilityTargetTeam(),
			self:GetAbilityTargetType(),
			self:GetAbilityTargetFlags(),
			FIND_ANY_ORDER,
			false
		)
		for _, ally in pairs(allies) do
			self:StartPressTheAttack(caster, ally, duration)
		end
	else
		self:StartPressTheAttack(caster, target, duration)
	end
end

function legion_commander_press_the_attack_custom:StartPressTheAttack(caster, target, duration)
	EmitSoundOn("Hero_LegionCommander.PressTheAttack", target)
	if(caster == target and caster:HasTalent("talent_legion_commander_press_the_attack_passive")) then
		return
	end
	duration = duration or self:GetSpecialValueFor("duration")
	target:AddNewModifier(caster, self, "modifier_legion_commander_press_the_attack_custom", {duration = duration})
	target:Purge(false, true, false, true, true)
end

modifier_legion_commander_press_the_attack_custom = class({
	IsPurgable = function() 
		return true 
	end,
	DeclareFunctions = function() 
		return 
		{
			MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT,
			MODIFIER_PROPERTY_HEALTH_REGEN_PERCENTAGE,
			MODIFIER_PROPERTY_MAGICAL_RESISTANCE_BONUS,
			MODIFIER_PROPERTY_MOUNTAIN_PHYSICAL_ARMOR_TOTAL_PERCENTAGE
		} 
	end,
	GetModifierAttackSpeedBonus_Constant = function(self) 
		return self.attack_speed_bonus 
	end,
	GetModifierHealthRegenPercentage = function(self) 
		return self.hp_regen_pct 
	end,
	GetModifierPhysicalArmorTotal_Percentage = function(self) 
		return self.bonus_armor_pct 
	end,
	GetModifierMagicalResistanceBonus = function(self) 
		return self.bonus_mag_res_pct 
	end,
	RemoveOnDeath = function(self)
		return self.parent:HasTalent("talent_legion_commander_press_the_attack_passive") == false
	end
})

function modifier_legion_commander_press_the_attack_custom:OnCreated()
	self.parent = self:GetParent()
	self:OnRefresh()
    if(not IsServer()) then
        return
    end
	local pfx = ParticleManager:CreateParticle(
		ParticleManager:GetParticleReplacement("particles/units/heroes/hero_legion_commander/legion_commander_press.vpcf", self.parent), 
		PATTACH_ABSORIGIN_FOLLOW, 
		self.parent
	)
	local origin = self.parent:GetAbsOrigin()
	ParticleManager:SetParticleControl(pfx, 0, origin)
	ParticleManager:SetParticleControl(pfx, 1, origin)
	ParticleManager:SetParticleControlEnt(pfx, 2, self.parent, PATTACH_POINT_FOLLOW, "attach_attack1", origin, true)
	ParticleManager:SetParticleControl(pfx, 3, origin)
	self:AddParticle(pfx, false, false, -1, true, false)
end

function modifier_legion_commander_press_the_attack_custom:OnRefresh()
	self.ability = self:GetAbility() or self.ability
	if (not self.ability or self.ability:IsNull()) then 
		return 
	end
	self.attack_speed_bonus = self.ability:GetSpecialValueFor("attack_speed_bonus")
	self.hp_regen_pct = self.ability:GetSpecialValueFor("hp_regen_pct")
	self.bonus_armor_pct = self.ability:GetSpecialValueFor("bonus_armor_pct")
	self.bonus_mag_res_pct = self.ability:GetSpecialValueFor("bonus_mag_res_pct")
end

LinkLuaModifier("modifier_legion_commander_press_the_attack_custom", "abilities/heroes/legion_commander/press_the_attack", LUA_MODIFIER_MOTION_NONE)