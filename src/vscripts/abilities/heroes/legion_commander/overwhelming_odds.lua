legion_commander_overwhelming_odds_custom = class({
	GetAOERadius = function(self)
		return self:GetSpecialValueFor("radius")
	end
})

function legion_commander_overwhelming_odds_custom:Precache(context)
    local caster = self:GetCaster()
    PrecacheResource("particle", ParticleManager:GetParticleReplacement("particles/units/heroes/hero_legion_commander/legion_commander_odds.vpcf", caster), context)
end

function legion_commander_overwhelming_odds_custom:OnSpellStart(target_point, isMulticastProc)
    if(not IsServer()) then
        return
    end
	local caster = self:GetCaster()
	local point = target_point or self:GetCursorPosition()

	local damage = self:GetSpecialValueFor("base_damage")
	local damage_per_boss = self:GetSpecialValueFor("damage_per_boss")
	local damage_per_unit = self:GetSpecialValueFor("damage_per_unit")
	local radius = self:GetSpecialValueFor("radius")
	local enemies = FindUnitsInRadius(
		caster:GetTeamNumber(),
		point,
		nil,
		radius,
		self:GetAbilityTargetTeam(),
		self:GetAbilityTargetType(),
		self:GetAbilityTargetFlags(),
		FIND_ANY_ORDER,
		false
	)

	EmitSoundOn("Hero_LegionCommander.Overwhelming.Cast", caster)
	EmitSoundOnLocationWithCaster(point, "Hero_LegionCommander.Overwhelming.Location", caster)

	local debuffDuration = self:GetSpecialValueFor("debuff_duration")

	for _, enemy in pairs(enemies) do
		if enemy:IsBoss() then
			damage = damage + damage_per_boss
			EmitSoundOn("Hero_LegionCommander.Overwhelming.Hero", enemy)
		else
			damage = damage + damage_per_unit
			EmitSoundOn("Hero_LegionCommander.Overwhelming.Creep", enemy)
		end
		enemy:AddNewModifier(caster, self, "modifier_legion_commander_overwhelming_odds_custom_debuff", { duration = debuffDuration })
	end

	local finalDamage = (damage * (1 + caster:GetSpellAmplification(false))) + caster:GetStrength() / 100 * self:GetSpecialValueFor("str_to_damage_pct")

	if(caster:HasTalent("talent_legion_commander_overwhelming_odds_attack_damage_pct")) then
		finalDamage = finalDamage + caster:GetAverageTrueAttackDamage(enemy) / 100 * self:GetSpecialValueFor("attack_damage_to_damage_pct")
	end

	local damageTable = {
		victim = nil,
		attacker = caster,
		ability = self,
		damage = finalDamage,
		damage_type = self:GetAbilityDamageType(),
		damage_flags = DOTA_DAMAGE_FLAG_NO_SPELL_AMPLIFICATION
	}

	for _, enemy in pairs(enemies) do
		damageTable.victim = enemy
		ApplyDamage(damageTable)
	end

	local pfx = ParticleManager:CreateParticle(
		ParticleManager:GetParticleReplacement("particles/units/heroes/hero_legion_commander/legion_commander_odds.vpcf", caster),
		PATTACH_WORLDORIGIN,
		caster
	)
	ParticleManager:SetParticleControl(pfx, 0, point)
	ParticleManager:SetParticleControl(pfx, 1, point)
	ParticleManager:SetParticleControl(pfx, 4, Vector(radius, radius, radius))
	ParticleManager:DestroyAndReleaseParticle(pfx, 2)
	if caster:HasTalent("talent_legion_commander_overwhelming_odds_multicast") and not isMulticastProc then
		local delay = self:GetSpecialValueFor("multicast_delay")
		for i = 1, self:GetSpecialValueFor("multicast_count") do
			Timers:CreateTimer(i * delay, function()
				self:OnSpellStart(point, true)
			end)
		end
	end
end

modifier_legion_commander_overwhelming_odds_custom_debuff = class({
	IsPurgable = function()
		return true
	end,
	IsDebuff = function()
		return true
	end,
	GetAttributes = function()
		return MODIFIER_ATTRIBUTE_MULTIPLE
	end
})

function modifier_legion_commander_overwhelming_odds_custom_debuff:OnCreated()
	self.ability = self:GetAbility()
	self.parent = self:GetParent()
	self:OnRefresh()
	if not IsServer() then return end
	self.caster = self:GetCaster()
	self.damageTable = {
		victim = self.parent,
		attacker = self.caster,
		ability = self.ability,
		damage = 0,
		damage_type = self.ability:GetAbilityDamageType(),
		damage_flags = DOTA_DAMAGE_FLAG_NO_SPELL_AMPLIFICATION
	}
	self:StartIntervalThink(self.damage_interval)
end

function modifier_legion_commander_overwhelming_odds_custom_debuff:OnIntervalThink()
	self.damageTable.damage = (self.debuff_dps * (1 + self.caster:GetSpellAmplification(false))) + (self.caster:GetStrength() * self.str_to_debuff_dps_pct)
	self.damageTable.damage = self.damageTable.damage * self.damage_interval
	ApplyDamage(self.damageTable)
end

function modifier_legion_commander_overwhelming_odds_custom_debuff:OnRefresh()
	self.ability = self:GetAbility() or self.ability
	if (not self.ability or self.ability:IsNull()) then
		return
	end
	self.debuff_dps = self.ability:GetSpecialValueFor("debuff_dps")
	self.str_to_debuff_dps_pct = self.ability:GetSpecialValueFor("str_to_debuff_dps_pct") / 100
	self.damage_interval = self.ability:GetSpecialValueFor("damage_interval")
end

LinkLuaModifier("modifier_legion_commander_overwhelming_odds_custom_debuff", "abilities/heroes/legion_commander/overwhelming_odds", LUA_MODIFIER_MOTION_NONE)