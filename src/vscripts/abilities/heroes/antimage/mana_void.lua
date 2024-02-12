antimage_mana_void_custom = class({
	GetIntrinsicModifierName = function(self)
        if (self:GetCaster():HasScepter()) then
		    return "modifier_antimage_mana_void_scepter" 
        end
	end,
	GetAOERadius = function(self) 
		return self:GetSpecialValueFor("mana_void_aoe_radius") 
	end
})

function antimage_mana_void_custom:Precache(context)
    PrecacheResource("particle", "particles/econ/items/antimage/antimage_weapon_basher_ti5/antimage_manavoid_ti_5.vpcf", context)
end

function antimage_mana_void_custom:OnSpellStart(target , isMulticastProc)
    local caster = self:GetCaster()
    local target  = target or self:GetCursorTarget()
	if (not target:IsAlive()) then
		return
	end
    local damageTable = {
		attacker = caster,
        ability = self, 
		damage_type = self:GetAbilityDamageType(),
		damage_flags = DOTA_DAMAGE_FLAG_NO_SPELL_AMPLIFICATION
	}

	if(caster:HasTalent("talent_antimage_mana_void_mana_burn")) then
		local manaBurn = target:GetMaxMana() * (self:GetSpecialValueFor("talent_mana_burn_pct")/100)
		target:Script_ReduceMana(manaBurn, nil)
	end

	target:AddNewModifier(caster,self,"modifier_bashed_d",{duration = self:GetSpecialValueFor("mana_void_ministun")})

    local enemies = FindUnitsInRadius(
		caster:GetTeamNumber(),
		target:GetAbsOrigin(),
		nil,
		self:GetAOERadius(),
		self:GetAbilityTargetTeam(),
		self:GetAbilityTargetType(),
		self:GetAbilityTargetFlags(),
		FIND_ANY_ORDER,
		false
	)
    local damage = (target:GetMaxMana() - target:GetMana()) * self:GetSpecialValueFor("mana_void_damage_per_mana")
    for _, enemy in ipairs(enemies) do 
        damageTable.damage = damage
        damageTable.victim = enemy
        ApplyDamage(damageTable)
    end

    local particle = ParticleManager:CreateParticle(
			ParticleManager:GetParticleReplacement("particles/econ/items/antimage/antimage_weapon_basher_ti5/antimage_manavoid_ti_5.vpcf", target),
			PATTACH_CUSTOMORIGIN,
			nil
		)
	ParticleManager:SetParticleControlEnt(particle, 0, target, PATTACH_POINT_FOLLOW, "attach_hitloc", Vector(0, 0, 0), true)

    local sound_cast = "Hero_Antimage.ManaVoid"
    EmitSoundOn( sound_cast, target )

	if caster:HasTalent("talent_antimage_mana_void_multicast") and not isMulticastProc then
		local delay = self:GetSpecialValueFor("talent_multicast_delay")
		for i = 1, self:GetSpecialValueFor("talent_multicast_count") do
			Timers:CreateTimer(i * delay, function()
				self:OnSpellStart(target, true)
			end)
		end
	end
end

modifier_antimage_mana_void_scepter = class({
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
			MODIFIER_EVENT_ON_ATTACK_LANDED
		} 
	end
})

function modifier_antimage_mana_void_scepter:OnCreated()
	self:OnRefresh()
	self.parent = self:GetParent()
	if(not IsServer()) then
		return
	end
    self.targetTeam = self.ability:GetAbilityTargetTeam()
    self.targetType = self.ability:GetAbilityTargetType()
    self.targetFlags = self.ability:GetAbilityTargetFlags()
end

function modifier_antimage_mana_void_scepter:OnRefresh()
	self.ability = self:GetAbility() or self.ability
	if (not self.ability or self.ability:IsNull()) then 
		return 
	end
    self.chance = self.ability:GetSpecialValueFor("chance")
end

function modifier_antimage_mana_void_scepter:OnAttackLanded(kv)
    if (kv.attacker ~= self.parent) then
        return 
    end

	if (kv.attacker:IsIllusion()) then
		return
	end

    if(UnitFilter(
        kv.target, 
        self.targetTeam, 
        self.targetType, 
        self.targetFlags, 
        self.parent:GetTeamNumber()
    ) ~= UF_SUCCESS) then
		return
	end

	if RandomInt(1,100) > self.chance then 
        return 
    end

	self.ability:OnSpellStart(kv.target,true)
end

LinkLuaModifier( "modifier_antimage_mana_void_scepter", "abilities/heroes/antimage/mana_void", LUA_MODIFIER_MOTION_NONE )
LinkLuaModifier("modifier_bashed_d", "modifiers/modifier_bashed_d", LUA_MODIFIER_MOTION_NONE)