legion_commander_moment_of_courage_custom = class({
	GetIntrinsicModifierName = function() 
		return "modifier_legion_commander_moment_of_courage_custom" 
	end,
	GetCastRange = function(self)
		return self:GetSpecialValueFor("radius")
	end
})

function legion_commander_moment_of_courage_custom:Precache(context)
    local caster = self:GetCaster()
    PrecacheResource("particle", ParticleManager:GetParticleReplacement("particles/units/heroes/hero_legion_commander/legion_commander_courage_tgt.vpcf", caster), context)
	PrecacheResource("particle", ParticleManager:GetParticleReplacement("particles/units/heroes/hero_legion_commander/legion_commander_courage_hit.vpcf", caster), context)
end

function legion_commander_moment_of_courage_custom:GetBehavior()
	if self:GetCaster():HasTalent("talent_legion_commander_moment_of_courage_custom_active") then
		return DOTA_ABILITY_BEHAVIOR_NO_TARGET
	end
	return self.BaseClass.GetBehavior(self)
end

modifier_legion_commander_moment_of_courage_custom = class({
	IsHidden = function() 
		return true 
	end,
	IsPurgable = function() 
		return false 
	end,
	IsPurgeException = function()
		return false
	end,
	DeclareFunctions = function() 
		return 
		{
			MODIFIER_EVENT_ON_ATTACK_START,
			MODIFIER_EVENT_ON_ATTACK
		} 
	end,
	RemoveOnDeath = function()
		return false
	end
})

function modifier_legion_commander_moment_of_courage_custom:OnCreated()
	self.parent = self:GetParent()
	self:OnRefresh()
end

function modifier_legion_commander_moment_of_courage_custom:OnRefresh()
	self.ability = self:GetAbility() or self.ability
	if (not self.ability or self.ability:IsNull()) then 
		return 
	end
	self.trigger_chance = self.ability:GetSpecialValueFor("trigger_chance")
	self.buff_duration = self.ability:GetSpecialValueFor("buff_duration")
end

function modifier_legion_commander_moment_of_courage_custom:OnAttack(kv)
	if(kv.attacker ~= self.parent or self.parent:HasTalent("talent_legion_commander_moment_of_courage_self_attacks") == false) then
		return
	end
	if(self:IsProc() == false) then
		return
	end
	self:PerformProc()
end

function modifier_legion_commander_moment_of_courage_custom:OnAttackStart(kv)
	if(kv.target ~= self.parent) then
		return
	end
	if(self:IsProc() == false) then
		return
	end
	if(CalculateDistance(self.parent, kv.attacker) > self.parent:Script_GetAttackRange()) then
		return
	end
	self:PerformProc(kv.attacker)
end

function modifier_legion_commander_moment_of_courage_custom:IsProc()
	if(self:IsProcDisabled() == true) then
		return false
	end
	if(not self.ability:IsCooldownReady()) then
		return false
	end
	if(self.parent:PassivesDisabled()) then
		return false
	end
	if(RollPseudoRandomPercentage(self.trigger_chance, self) == false) then
		return false
	end
	return true
end

function modifier_legion_commander_moment_of_courage_custom:SetIsProcDisabled(state)
	self._isProcDisabled = state
end

function modifier_legion_commander_moment_of_courage_custom:IsProcDisabled()
	return self._isProcDisabled or false
end

function modifier_legion_commander_moment_of_courage_custom:PerformProc(source)
	local target = source or self.parent:GetAttackTarget()
	if(target == nil) then
		return
	end
	self.parent:AddNewModifier(self.parent, self.ability, "modifier_legion_commander_moment_of_courage_custom_buff", {duration = self.buff_duration})
	if(self.parent:IsAttacking()) then
		self:SetIsProcDisabled(true)
		self.parent:PerformAttack(target, true, true, true, true, false, false, true)
		self:SetIsProcDisabled(false)
	end
	self.ability:UseResources(true,false, true, true)
end

modifier_legion_commander_moment_of_courage_custom_buff = class({
	IsHidden = function() 
		return true 
	end,
	IsPurgable = function() 
		return false 
	end,
	IsPurgeException = function()
		return false
	end,
	IsDebuff = function()
		return false
	end,
	DeclareFunctions = function() 
		return 
		{
			MODIFIER_PROPERTY_MOUNTAIN_LIFESTEAL,
			MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT,
			MODIFIER_PROPERTY_MOUNTAIN_BASE_ATTACK_TIME_CONSTANT
		} 
	end,
	GetModifierConstantBaseAttackTime = function() 
		return 0.01 
	end,
	GetModifierAttackSpeedBonus_Constant = function() 
		return 99999 
	end
})

function modifier_legion_commander_moment_of_courage_custom_buff:OnCreated()
	self.parent = self:GetParent()
	self:OnRefresh()
end

function modifier_legion_commander_moment_of_courage_custom_buff:OnRefresh()
	self.ability = self:GetAbility()
	if (not self.ability or self.ability:IsNull()) then 
		return 
	end
	self.hp_leech_percent = self.ability:GetSpecialValueFor("hp_leech_percent")
end

function modifier_legion_commander_moment_of_courage_custom_buff:GetModifierLifesteal(kv)
	EmitSoundOn("Hero_LegionCommander.Courage", self.parent)
	local forward, right, up = self.parent:GetForwardVector(), self.parent:GetRightVector(), self.parent:GetUpVector()
	local particle = ParticleManager:CreateParticle(
		ParticleManager:GetParticleReplacement("particles/units/heroes/hero_legion_commander/legion_commander_courage_tgt.vpcf", self.parent),
		PATTACH_CUSTOMORIGIN,
		nil
	)
	ParticleManager:SetParticleControlOrientation(particle, 0, forward, right, up)
	ParticleManager:SetParticleControlEnt(particle, 0, self.parent, PATTACH_POINT_FOLLOW, "attach_attack1", Vector(0, 0, 0), true)
	ParticleManager:DestroyAndReleaseParticle(particle, 2)
	particle = ParticleManager:CreateParticle(
		ParticleManager:GetParticleReplacement("particles/units/heroes/hero_legion_commander/legion_commander_courage_hit.vpcf", self.parent),
		PATTACH_CUSTOMORIGIN,
		nil
	)
	ParticleManager:SetParticleControlOrientation(particle, 0, forward, right, up)
	ParticleManager:SetParticleControlEnt(particle, 0, kv.target, PATTACH_POINT_FOLLOW, "attach_hitloc", Vector(0, 0, 0), true)
	ParticleManager:DestroyAndReleaseParticle(particle, 2)
	self:Destroy()
	return self.hp_leech_percent
end

LinkLuaModifier("modifier_legion_commander_moment_of_courage_custom", "abilities/heroes/legion_commander/moment_of_courage", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_legion_commander_moment_of_courage_custom_buff", "abilities/heroes/legion_commander/moment_of_courage", LUA_MODIFIER_MOTION_NONE)