lina_laguna_blade_custom = class({
    GetAOERadius = function(self)
        return self:GetSpecialValueFor("radius")
    end
})

function lina_laguna_blade_custom:Precache(context)
    local caster = self:GetCaster()
    PrecacheResource("particle", ParticleManager:GetParticleReplacement("particles/units/heroes/hero_lina/lina_spell_laguna_blade.vpcf", caster), context)
    PrecacheResource("particle", "particles/custom/units/heroes/lina/laguna_blade/laguna_blade_debuff.vpcf", context)
end

function lina_laguna_blade_custom:GetBehavior()
    local caster = self:GetCaster()
    if(caster:HasTalent("talent_lina_laguna_blade_aoe_pure_damage")) then
        return DOTA_ABILITY_BEHAVIOR_UNIT_TARGET + DOTA_ABILITY_BEHAVIOR_AOE
    end
    return self.BaseClass.GetBehavior(self)
end

function lina_laguna_blade_custom:GetAbilityDamageType()
    local caster = self:GetCaster()
    if(caster:HasTalent("talent_lina_laguna_blade_aoe_pure_damage")) then
        return DAMAGE_TYPE_PURE
    end
    return self.BaseClass.GetAbilityDamageType(self)
end

function lina_laguna_blade_custom:OnSpellStart()
    if(not IsServer()) then
        return
    end
    local caster = self:GetCaster()
    local target = self:GetCursorTarget()

    EmitSoundOn("Ability.LagunaBlade", caster)

    if(caster:HasTalent("talent_lina_laguna_blade_aoe_pure_damage")) then
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
            self:FireLagunaBlade(caster, enemy, false)
        end
        EmitSoundOn("Ability.LagunaBladeImpact", target)
        return
    end
    self:FireLagunaBlade(caster, target)
end

function lina_laguna_blade_custom:FireLagunaBlade(caster, target, playSound)
    local particle = ParticleManager:CreateParticle(
        ParticleManager:GetParticleReplacement("particles/units/heroes/hero_lina/lina_spell_laguna_blade.vpcf", caster),
        PATTACH_CUSTOMORIGIN,
        nil
    )
    ParticleManager:SetParticleControlEnt(particle, 0, caster, PATTACH_POINT_FOLLOW, "attach_hitloc", Vector(0, 0, 0), true)
    ParticleManager:SetParticleControlEnt(particle, 1, target, PATTACH_POINT_FOLLOW, "attach_hitloc", Vector(0, 0, 0), true)
    ParticleManager:DestroyAndReleaseParticle(particle, 2)
    
    Timers:CreateTimer(self:GetSpecialValueFor("damage_delay"), function()
        self.damageTable = self.damageTable or {
            victim = nil,
            attacker = nil,
            ability = self,
            damage = 0,
            damage_type = DAMAGE_TYPE_NONE,
            damage_flags = DOTA_DAMAGE_FLAG_NO_SPELL_AMPLIFICATION
        }
        local baseDamage = self:GetSpecialValueFor("damage")
        local spellAmp = caster:GetSpellAmplification(false) + 1
        local intToDamage = caster:GetIntellect() * (self:GetSpecialValueFor("int_pct_to_damage") / 100)
        self.damageTable.damage = (baseDamage * spellAmp) + intToDamage
        self.damageTable.damage_type = self:GetAbilityDamageType()
        self.damageTable.victim = target
        self.damageTable.attacker = caster
        ApplyDamage(self.damageTable)
        if(caster:HasShard()) then
            target:AddNewModifier(caster, self, "modifier_lina_laguna_blade_custom_debuff", { duration = self:GetSpecialValueFor("shard_duration") })
        end
    end, self)

    if(playSound == false) then
        return
    end
    EmitSoundOn("Ability.LagunaBladeImpact", target)
end


modifier_lina_laguna_blade_custom_debuff = class({
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
    GetEffectName = function()
        return "particles/custom/units/heroes/lina/laguna_blade/laguna_blade_debuff.vpcf"
    end
})

function modifier_lina_laguna_blade_custom_debuff:OnCreated()
    self.ability = self:GetAbility()
    self.parent = self:GetParent()
    self.caster = self:GetCaster()
    if(not IsServer()) then
        return
    end
    self.damageTable = self.damageTable or {
        victim = self.parent,
        attacker = self.caster,
        ability = self.ability,
        damage = 0,
        damage_type = DAMAGE_TYPE_MAGICAL,
        damage_flags = DOTA_DAMAGE_FLAG_NO_SPELL_AMPLIFICATION
    }
    self:OnRefresh()
end

function modifier_lina_laguna_blade_custom_debuff:OnRefresh()
    self.ability = self:GetAbility() or self.ability
    if(not self.ability or self.ability:IsNull() == true) then
        return
    end
    self.shockTickRate = self.ability:GetSpecialValueFor("shard_tick_interval")
    self.shockDamage = self.ability:GetSpecialValueFor("shard_base_damage")
    self.shockIntPctToDamage = self.ability:GetSpecialValueFor("shard_int_pct_to_damage") / 100

    if(not IsServer()) then
        return
    end
    self.shockTickRate = self.ability:GetSpecialValueFor("shard_tick_interval")
    self:StartIntervalThink(self.shockTickRate)
end

function modifier_lina_laguna_blade_custom_debuff:OnIntervalThink()
    local spellAmp = 1 + self.caster:GetSpellAmplification(false)
    local intPctToDamage = self.caster:GetIntellect() * self.shockIntPctToDamage
    
    self.damageTable.damage = ((self.shockDamage * spellAmp) + intPctToDamage) * self.shockTickRate

    ApplyDamage(self.damageTable)
end

LinkLuaModifier("modifier_lina_laguna_blade_custom_debuff", "abilities/heroes/lina/laguna_blade", LUA_MODIFIER_MOTION_NONE)