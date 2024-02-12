legion_commander_duel_custom = class({
	GetIntrinsicModifierName = function() 
		return "modifier_legion_commander_duel_custom" 
	end,
	GetAOERadius = function(self)
		return self:GetSpecialValueFor("radius") 
	end
})

function legion_commander_duel_custom:Precache(context)
    local caster = self:GetCaster()
    PrecacheResource("particle", ParticleManager:GetParticleReplacement("particles/units/heroes/hero_legion_commander/legion_duel_ring.vpcf", caster), context)
	PrecacheResource("particle", "particles/custom/units/heroes/legion_commander/duel/duel_aoe.vpcf", context)
end

function legion_commander_duel_custom:GetBehavior()
	local caster = self:GetCaster()
	local behavior = DOTA_ABILITY_BEHAVIOR_UNIT_TARGET
	if self:GetCaster():HasScepter() then
		behavior = behavior + DOTA_ABILITY_BEHAVIOR_AOE + DOTA_ABILITY_BEHAVIOR_POINT
	end
	if caster:HasTalent("talent_legion_commander_duel_custom_aura") then
		behavior = behavior + DOTA_ABILITY_BEHAVIOR_AURA
	end
	return behavior
end

function legion_commander_duel_custom:OnSpellStart()
	if(not IsServer()) then
		return
	end
	local caster = self:GetCaster()
	local target = self:GetCursorTarget()
	local point = self:GetCursorPosition()

	local duration = self:GetSpecialValueFor("duration")
	
	caster:AddNewModifier(caster, self, "modifier_legion_commander_duel_custom_duel", {
		duration = duration,
		target = target and target:GetEntityIndex()
	})

	if(not caster:HasScepter()) then
		target:AddNewModifier(caster, self, "modifier_legion_commander_duel_custom_duel_enemy", {duration = duration})
	else
		CreateModifierThinker(caster, self, "modifier_legion_commander_duel_custom_thinker", {duration = duration}, point, caster:GetTeamNumber(), false)
	end
	EmitSoundOn("Hero_LegionCommander.Duel.Cast", caster)
end

modifier_legion_commander_duel_custom = class({
	IsHidden = function(self) 
		return self:GetModifierPreAttack_BonusDamage() == 0
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
			MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE,
			MODIFIER_PROPERTY_TOOLTIP
		} 
	end,
	GetModifierPreAttack_BonusDamage = function(self) 
		return self:GetStackCount()
	end,
	OnTooltip = function(self)
		return self:GetModifierPreAttack_BonusDamage()
	end,
	IsAura = function() 
		return true 
	end,
	GetAuraRadius = function(self) 
		return self.aura_radius
	end,
	GetAuraSearchTeam = function() 
		return DOTA_UNIT_TARGET_TEAM_FRIENDLY 
	end,
	GetAuraSearchType = function() 
		return DOTA_UNIT_TARGET_HERO 
	end,
	GetAuraSearchFlags = function() 
		return DOTA_UNIT_TARGET_FLAG_NONE
	end,
	GetModifierAura = function() 
		return "modifier_legion_commander_duel_custom_ally" 
	end,
	RemoveOnDeath = function()
		return false
	end
})

function modifier_legion_commander_duel_custom:OnCreated()
	self.caster = self:GetCaster()
	self.parent = self:GetParent()
	self:OnRefresh()
end

function modifier_legion_commander_duel_custom:OnRefresh()
	self.ability = self:GetAbility() or self.ability
	if (not self.ability or self.ability:IsNull()) then 
		return 
	end
	self.aura_radius = self.ability:GetSpecialValueFor("aura_radius")
end

function modifier_legion_commander_duel_custom:GetAuraEntityReject(npc)
	if(self.aura_radius > 0) then
		return self.parent == npc
	end
	return true
end

modifier_legion_commander_duel_custom_duel = class({
	IsHidden = function() 
		return false 
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
			MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE,
			MODIFIER_PROPERTY_INCOMING_DAMAGE_PERCENTAGE
		} 
	end,
	GetModifierIncomingDamage_Percentage = function(self)
		return self.incomingDamageReductionPct
	end
})

function modifier_legion_commander_duel_custom_duel:OnCreated(kv)
	self.parent = self:GetParent()
	self:OnRefresh()
	if(not IsServer()) then
		return
	end
	self.target = kv.target ~= nil and EntIndexToHScript(kv.target)

	local hasScepter = self.parent:HasScepter()
	self:CreateParticle(hasScepter, self.target)

	EmitSoundOn("Hero_LegionCommander.Duel", self.parent)
	local soundDuration = self.parent:GetSoundDuration("Hero_LegionCommander.Duel", self.parent:GetUnitName())
	Timers:CreateTimer(soundDuration, function()
		if(self and self:IsNull() == false) then
			StopSoundOn("Hero_LegionCommander.Duel", self.parent)
			EmitSoundOn("Hero_LegionCommander.Duel", self.parent)
			return soundDuration
		end
	end, self)
	if(hasScepter == true) then
		return
	end
	ExecuteOrderFromTable({
		UnitIndex = self.parent:entindex(),
		OrderType = DOTA_UNIT_ORDER_ATTACK_TARGET,
		TargetIndex = self.target:entindex()
	})
	self.parent:SetForceAttackTarget(self.target)
end

function modifier_legion_commander_duel_custom_duel:OnRefresh()
	self.ability = self:GetAbility() or self.ability
	if (not self.ability or self.ability:IsNull()) then 
		return 
	end
	self.incomingDamageReductionPct = self.ability:GetSpecialValueFor("duel_damage_reduction_pct") * -1
end

function modifier_legion_commander_duel_custom_duel:CheckState()
	if(self.parent:HasScepter()) then
		return {}
	end
	return {
		[MODIFIER_STATE_MUTED] = true,
		[MODIFIER_STATE_SILENCED] = true
	}
end

function modifier_legion_commander_duel_custom_duel:OnDestroy()
	if(not IsServer()) then
		return
	end
	StopSoundOn("Hero_LegionCommander.Duel", self.parent)
	self.parent:SetForceAttackTarget(nil)
end

function modifier_legion_commander_duel_custom_duel:CreateParticle(hasScepter, target)
	local pfx = -1
	local center = Vector(0, 0, 0)

	self.ability = self:GetAbility()

	if(hasScepter) then
		pfx = ParticleManager:CreateParticle(
			"particles/custom/units/heroes/legion_commander/duel/duel_aoe.vpcf", 
			PATTACH_CUSTOMORIGIN, 
			nil
		)
		ParticleManager:SetParticleControl(pfx, 10, Vector(self.ability:GetSpecialValueFor("radius"), 0, 0))
		ParticleManager:SetParticleControl(pfx, 11, Vector(self:GetDuration(), 0, 0))

		center = self.ability:GetCursorPosition()
	else
		pfx = ParticleManager:CreateParticle(
			ParticleManager:GetParticleReplacement("particles/units/heroes/hero_legion_commander/legion_duel_ring.vpcf", self.parent), 
			PATTACH_CUSTOMORIGIN, 
			nil
		)
		center = (self.parent:GetAbsOrigin() + self.target:GetAbsOrigin()) / 2
	end

	ParticleManager:SetParticleControl(pfx, 0, center)

	self:AddParticle(pfx, false, false, -1, false, false)
end

modifier_legion_commander_duel_custom_duel_enemy = class({
	IsHidden = function() 
		return false 
	end,
	IsPurgable = function() 
		return false 
	end,
	IsPurgeException = function()
		return false
	end,
	IsDebuff = function()
		return true
	end,
	DeclareFunctions = function() 
		return 
		{
			MODIFIER_EVENT_ON_DEATH
		} 
	end,
	CheckState = function()
		return {
			[MODIFIER_STATE_MUTED] = true,
			[MODIFIER_STATE_SILENCED] = true
		}
	end
})

function modifier_legion_commander_duel_custom_duel_enemy:OnCreated()
	self.ability = self:GetAbility()
	if(not self.ability) then
		self:Destroy()
		return
	end
	if(not IsServer()) then
		return
	end
	self.caster = self:GetCaster()
	if(self.caster:IsRealHero() == false) then
		self.caster = self.caster:GetOwnerEntity()
	end
	self.pressTheAttackAbility = self.caster:FindAbilityByName("legion_commander_press_the_attack_custom")
	self.parent = self:GetParent()
	self:OnRefresh()
	ExecuteOrderFromTable({
		UnitIndex = self.parent:entindex(),
		OrderType = DOTA_UNIT_ORDER_ATTACK_TARGET,
		TargetIndex = self.caster:entindex()
	})
	self.parent:SetForceAttackTarget(self.caster)
end

function modifier_legion_commander_duel_custom_duel_enemy:OnRefresh()
	self.ability = self:GetAbility() or self.ability
	if (not self.ability or self.ability:IsNull()) then 
		return 
	end
	self.reward_damage = self.ability:GetSpecialValueFor("reward_damage")
	self.reward_damage_boss = self.ability:GetSpecialValueFor("reward_damage_boss")
end

function modifier_legion_commander_duel_custom_duel_enemy:OnDestroy()
	if(not IsServer()) then
		return
	end
	self.parent:SetForceAttackTarget(nil)
end

function modifier_legion_commander_duel_custom_duel_enemy:OnDeath(keys)
	if keys.unit == self.parent then
		self:AddDuelVictoryBonus(self.caster, self.parent)
	end
	if keys.unit == self.caster then
		self:AddDuelVictoryBonus(keys.attacker, self.caster)
	end
end

function modifier_legion_commander_duel_custom_duel_enemy:AddDuelVictoryBonus(target, enemy)
	local bonusDamage = self.reward_damage
	if(enemy:IsBoss()) then
		bonusDamage = self.reward_damage_boss
	end
	local mod = target:AddNewModifier(target, self.ability, "modifier_legion_commander_duel_custom", nil)
	mod:SetStackCount(mod:GetStackCount() + bonusDamage)
	EmitSoundOn("Hero_LegionCommander.Duel.Victory", target)

	if(target == self.caster and self.pressTheAttackAbility and self.pressTheAttackAbility:GetLevel() > 0) then
		self.pressTheAttackAbility:StartPressTheAttack(self.caster, self.caster)
	end
	if(self.caster:HasScepter() == true) then
		return
	end
	self.caster:RemoveModifierByName("modifier_legion_commander_duel_custom_duel")
end

modifier_legion_commander_duel_custom_ally = class({
	IsHidden = function() 
		return false 
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
			MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE,
			MODIFIER_PROPERTY_TOOLTIP
		} 
	end,
	GetModifierPreAttack_BonusDamage = function(self) 
		return self:GetStackCount()
	end,
	OnTooltip = function(self)
		return self:GetModifierPreAttack_BonusDamage()
	end
})

function modifier_legion_commander_duel_custom_ally:OnCreated()
	self.ability = self:GetAbility()
	if(not self.ability) then
		self:Destroy()
		return
	end
	self.caster = self:GetCaster()
	self:OnRefresh()
	if(not IsServer()) then
		return
	end
	self.duelBonusDamageModifier = self.caster:FindModifierByName("modifier_legion_commander_duel_custom")
	self:StartIntervalThink(0.1)
end

function modifier_legion_commander_duel_custom_ally:OnRefresh()
	self.ability = self:GetAbility() or self.ability
	if (not self.ability or self.ability:IsNull()) then 
		return 
	end
	self.damage_share_pct = self.ability:GetSpecialValueFor("damage_share_pct") / 100
end

function modifier_legion_commander_duel_custom_ally:OnIntervalThink()
	self:SetStackCount(self.duelBonusDamageModifier:GetStackCount() * self.damage_share_pct)
end

modifier_legion_commander_duel_custom_thinker = class({
	IsPurgable = function() 
		return false 
	end,
	IsAura = function() 
		return true 
	end,
	GetAuraRadius = function(self) 
		return self.radius 
	end,
	GetAuraSearchTeam = function(self) 
		return self.targetTeam
	end,
	GetAuraSearchType = function(self) 
		return self.targetType
	end,
	GetAuraSearchFlags = function(self) 
		return self.targetFlags
	end,
	GetModifierAura = function() 
		return "modifier_legion_commander_duel_custom_duel_enemy" 
	end
})

function modifier_legion_commander_duel_custom_thinker:OnCreated()
	self.parent = self:GetParent()
	self.caster = self:GetCaster()
	self.ability = self:GetAbility()
	self.radius = self.ability:GetSpecialValueFor("radius")
	self.radiusSqr = self.radius ^ 2
	if(not IsServer()) then
		return
	end
	self.targetTeam = self.ability:GetAbilityTargetTeam() 
	self.targetType = self.ability:GetAbilityTargetType() 
	self.targetFlags = self.ability:GetAbilityTargetFlags() 
	self:StartIntervalThink(0.1)
end

function modifier_legion_commander_duel_custom_thinker:OnIntervalThink()
	if(CalculateDistanceSqr(self.parent, self.caster) > self.radiusSqr) then
		self.caster:RemoveModifierByName("modifier_legion_commander_duel_custom_duel")
		self:Destroy()
	end
end

function modifier_legion_commander_duel_custom_thinker:OnDestroy()
	if(not IsServer()) then
		return
	end
	UTIL_Remove(self.parent)
end

LinkLuaModifier("modifier_legion_commander_duel_custom", "abilities/heroes/legion_commander/duel", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_legion_commander_duel_custom_duel", "abilities/heroes/legion_commander/duel", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_legion_commander_duel_custom_duel_enemy", "abilities/heroes/legion_commander/duel", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_legion_commander_duel_custom_thinker", "abilities/heroes/legion_commander/duel", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_legion_commander_duel_custom_ally", "abilities/heroes/legion_commander/duel", LUA_MODIFIER_MOTION_NONE)