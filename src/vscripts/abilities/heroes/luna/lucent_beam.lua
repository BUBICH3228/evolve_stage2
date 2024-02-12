luna_lucent_beam_custom = class({
    GetAOERadius = function(self)
        return self:GetSpecialValueFor("radius")
    end
})

function luna_lucent_beam_custom:Precache(context)
    local caster = self:GetCaster()
    PrecacheResource("particle", ParticleManager:GetParticleReplacement("particles/units/heroes/hero_luna/luna_lucent_beam_precast.vpcf", caster), context)
    PrecacheResource("particle", ParticleManager:GetParticleReplacement("particles/units/heroes/hero_luna/luna_lucent_beam_cast.vpcf", caster), context)
    PrecacheResource("particle", ParticleManager:GetParticleReplacement("particles/units/heroes/hero_luna/luna_lucent_beam.vpcf", caster), context)
end

function luna_lucent_beam_custom:GetBehavior()
    local caster = self:GetCaster()
    if(caster:HasTalent("talent_luna_lucent_beam_aoe")) then
        return DOTA_ABILITY_BEHAVIOR_UNIT_TARGET + DOTA_ABILITY_BEHAVIOR_AOE
    end
    return self.BaseClass.GetBehavior(self)
end

function luna_lucent_beam_custom:OnAbilityPhaseStart()
    if(not IsServer()) then
        return
    end
    self.precastParticle = ParticleManager:CreateParticle(
        "particles/units/heroes/hero_luna/luna_lucent_beam_precast.vpcf", 
        PATTACH_POINT_FOLLOW, 
        self:GetCaster()
    )
    return true
end

function luna_lucent_beam_custom:OnAbilityPhaseInterrupted()
    self:RemovePrecastParticle()
end

function luna_lucent_beam_custom:RemovePrecastParticle()
    if(self.precastParticle == nil) then
        return
    end
    ParticleManager:DestroyAndReleaseParticle(self.precastParticle)
    self.precastParticle = nil
end

function luna_lucent_beam_custom:OnSpellStart()
    if(not IsServer()) then
        return
    end
    self:RemovePrecastParticle()
    local caster = self:GetCaster()
    local target = self:GetCursorTarget()

    if target:TriggerSpellAbsorb(self) then
        return
    end
    self:FireBeam(caster, target, false)
    caster:EmitSound("Hero_Luna.LucentBeam.Cast")
    local particle = ParticleManager:CreateParticle(
        ParticleManager:GetParticleReplacement("particles/units/heroes/hero_luna/luna_lucent_beam_cast.vpcf", caster),
        PATTACH_POINT_FOLLOW,
        caster
    )
    ParticleManager:DestroyAndReleaseParticle(particle)
end

function luna_lucent_beam_custom:FireBeam(caster, target, isEclipse, isSecondaryBeam)
    if(isEclipse == false or caster:HasTalent("talent_luna_lucent_beam_eclipse_stun")) then
        target:AddNewModifier(caster, self, "modifier_stunned", {duration = self:GetSpecialValueFor("stun_duration")})
    end

    local particle = ParticleManager:CreateParticle(
        ParticleManager:GetParticleReplacement("particles/units/heroes/hero_luna/luna_lucent_beam.vpcf", caster),
        PATTACH_ABSORIGIN,
        target
    )
    ParticleManager:SetParticleControlEnt(particle, 1, target, PATTACH_ABSORIGIN, "attach_hitloc", Vector(0, 0, 0), true)
    ParticleManager:SetParticleControlEnt(particle, 2, target, PATTACH_POINT_FOLLOW, "attach_hitloc", Vector(0, 0, 0), true)
    ParticleManager:SetParticleControlEnt(particle, 5, target, PATTACH_POINT_FOLLOW, "attach_hitloc", Vector(0, 0, 0), true)
    ParticleManager:SetParticleControlEnt(particle, 6, target, PATTACH_POINT_FOLLOW, "attach_hitloc", Vector(0, 0, 0), true)
    ParticleManager:DestroyAndReleaseParticle(particle, 2)

    EmitSoundOnLocationWithCaster(target:GetAbsOrigin(), "Hero_Luna.LucentBeam.Target", caster)

    if(caster:HasTalent("talent_luna_lucent_beam_bonus_agility")) then
        caster:AddNewModifier(caster, self, "modifier_luna_lucent_beam_custom_buff", {duration = self:GetSpecialValueFor("bonus_agility_stack_duration")})
    end

    if(caster:HasTalent("talent_luna_lucent_beam_instant_attack")) then
        caster:PerformAttack(target, true, true, true, true, false, false, true)
    end

    local finalDamageMultiplier = 1
    
    if(caster:HasTalent("talent_luna_lucent_beam_bonus_damage_per_cast")) then
        local modifier = target:AddNewModifier(caster, self, "modifier_luna_lucent_beam_custom_debuff", {duration = self:GetSpecialValueFor("bonus_damage_pct_per_stack_duration")})
        if(modifier) then
            finalDamageMultiplier = finalDamageMultiplier + (modifier:GetBonusDamagePercent() / 100)
        end
    end

    local spellAmp = 1 + caster:GetSpellAmplification(false)
    local baseDamage = self:GetSpecialValueFor("damage")
    local agilityPctToDamage = caster:GetAgility() * (self:GetSpecialValueFor("agility_pct_to_damage") / 100)
    ApplyDamage({
        victim = target,
        attacker = caster,
        ability = self,
        damage = ((baseDamage * spellAmp) + agilityPctToDamage) * finalDamageMultiplier,
        damage_type = self:GetAbilityDamageType(),
        damage_flags = DOTA_DAMAGE_FLAG_NO_SPELL_AMPLIFICATION
    })

    if(isSecondaryBeam == true or caster:HasTalent("talent_luna_lucent_beam_aoe") == false) then
        return
    end

    local enemies = FindUnitsInRadius(
        caster:GetTeamNumber(), 
        target:GetAbsOrigin(), 
        nil, 
        self:GetSpecialValueFor("radius"), 
        self:GetAbilityTargetTeam(), 
        self:GetAbilityTargetType(), 
        self:GetAbilityTargetFlags(), 
        FIND_ANY_ORDER, 
        false
    )
    for _, enemy in pairs(enemies) do
        if(enemy ~= target) then
            self:FireBeam(caster, enemy, isEclipse, true)
        end
    end
end

modifier_luna_lucent_beam_custom_buff = class({
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
            MODIFIER_PROPERTY_TOOLTIP,
            MODIFIER_PROPERTY_MOUNTAIN_STATS_AGILITY_BONUS_PERCENTAGE
        }
    end,
    GetModifierBonusStats_Agility_Percentage = function(self)
        return self.bonusAgilityPctPerStack * self:GetStackCount()
    end,
    OnTooltip = function(self)
        return self:GetModifierBonusStats_Agility_Percentage()
    end
})

function modifier_luna_lucent_beam_custom_buff:OnCreated()
    self:OnRefresh()
end

function modifier_luna_lucent_beam_custom_buff:OnRefresh()
    self.ability = self:GetAbility() or self.ability
    if(not self.ability or self.ability:IsNull() == true) then
        return
    end
    self.bonusAgilityPctPerStack = self.ability:GetSpecialValueFor("bonus_agility_pct_per_stack")
    if(not IsServer()) then
        return
    end
    self:IncrementIndependentStackCount()
end

modifier_luna_lucent_beam_custom_debuff = class({
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
            MODIFIER_PROPERTY_TOOLTIP
        }
    end,
    OnTooltip = function(self)
        return self:GetBonusDamagePercent()
    end
})

function modifier_luna_lucent_beam_custom_debuff:OnCreated()
    self:OnRefresh()
end

function modifier_luna_lucent_beam_custom_debuff:OnRefresh()
    self.ability = self:GetAbility() or self.ability
    if(not self.ability or self.ability:IsNull() == true) then
        return
    end
    self.bonusDamagePctPerStack = self.ability:GetSpecialValueFor("bonus_damage_pct_per_stack")
    if(not IsServer()) then
        return
    end
    self:IncrementIndependentStackCount()
end

function modifier_luna_lucent_beam_custom_debuff:GetBonusDamagePercent()
    return self.bonusDamagePctPerStack * self:GetStackCount()
end

LinkLuaModifier("modifier_luna_lucent_beam_custom_buff", "abilities/heroes/luna/lucent_beam", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_luna_lucent_beam_custom_debuff", "abilities/heroes/luna/lucent_beam", LUA_MODIFIER_MOTION_NONE)