lina_light_strike_array_custom = class({
    GetAOERadius = function(self)
        return self:GetSpecialValueFor("radius")
    end
})

function lina_light_strike_array_custom:Precache(context)
    local caster = self:GetCaster()
    PrecacheResource("particle", ParticleManager:GetParticleReplacement("particles/units/heroes/hero_lina/lina_spell_light_strike_array.vpcf", caster), context)
    PrecacheResource("particle", "particles/custom/units/heroes/lina/light_strike_array/light_strike_array_burn.vpcf", context)
end

function lina_light_strike_array_custom:OnAbilityPhaseStart()
	EmitSoundOn("Ability.PreLightStrikeArray", self:GetCaster())
    return true
end

function lina_light_strike_array_custom:OnSpellStart()
    if(not IsServer()) then
        return
    end
    local caster = self:GetCaster()
    local targetPosition = self:GetCursorPosition()
    StopSoundOn("Ability.PreLightStrikeArray", caster)

    self:CreateLightStrikeArray(caster, targetPosition)

    if(caster:HasTalent("talent_lina_light_strike_array_multicast")) then
        local delay = self:GetCastPoint()
        local radius = self:GetAOERadius()
        local distanceBetweenMulticasts = radius * 1.5
        local multicasts = self:GetSpecialValueFor("multicasts")
        local direction = CalculateDirection(caster, targetPosition)

        for i = 1, multicasts, 1 do
            print(i)
            Timers:CreateTimer((i - 1) * delay, function()
                targetPosition = targetPosition + (direction * distanceBetweenMulticasts)
                self:CreateLightStrikeArray(caster, targetPosition, radius)
            end)
        end
        return
    end
end

function lina_light_strike_array_custom:CreateLightStrikeArray(caster, targetPosition, radius)
    self.damageTable = self.damageTable or {
        victim = nil,
        attacker = caster,
        ability = self,
        damage = 0,
        damage_type = self:GetAbilityDamageType(),
        damage_flags = DOTA_DAMAGE_FLAG_NO_SPELL_AMPLIFICATION
    }

    if(radius == nil) then
        radius = self:GetAOERadius()
    end

    local targetTeam = self:GetAbilityTargetTeam()
    local targetType = self:GetAbilityTargetType()
    local targetFlags = self:GetAbilityTargetFlags()
    local casterTeam = caster:GetTeamNumber()
    local stunDuration = self:GetSpecialValueFor("stun_duration")
    local delay = self:GetSpecialValueFor("delay")
    local particle = ParticleManager:CreateParticle(
        "particles/units/heroes/hero_lina/lina_spell_light_strike_array.vpcf", 
        PATTACH_CUSTOMORIGIN, 
        nil
    )
    ParticleManager:SetParticleControl(particle, 0, targetPosition)
    ParticleManager:SetParticleControl(particle, 1, Vector(radius, 0, 0))
    ParticleManager:DestroyAndReleaseParticle(particle, delay)

    local spellAmp = 1 + caster:GetSpellAmplification(false)
    local intPctToDamage = caster:GetIntellect() * (self:GetSpecialValueFor("int_pct_to_damage") / 100)

    local damage = (self:GetSpecialValueFor("damage") * spellAmp) + intPctToDamage

    Timers:CreateTimer(delay, function()
        GridNav:DestroyTreesAroundPoint(targetPosition, radius, false)
        local enemies = FindUnitsInRadius(
            casterTeam,
            targetPosition,	
            nil,	
            radius,	
            targetTeam,
            targetType,
            targetFlags,
            FIND_ANY_ORDER,
            false
        )
        for _, enemy in pairs(enemies) do
            self:ApplyDamage(enemy, damage)
            enemy:AddNewModifier(caster, self, "modifier_stunned", {duration = stunDuration})
        end

        self:CreateBurnEffect(
            caster, 
            casterTeam, 
            targetPosition, 
            targetTeam, 
            targetType, 
            targetFlags, 
            radius
        )
        EmitSoundOnLocationWithCaster(targetPosition, "Ability.LightStrikeArray", caster)
    end, self)
end

function lina_light_strike_array_custom:ApplyDamage(target, damage)
    self.damageTable.damage = damage
    self.damageTable.victim = target
    ApplyDamage(self.damageTable)
end

function lina_light_strike_array_custom:CreateBurnEffect(caster, casterTeam, position, team, type, flags, radius)
    Timers:CreateTimer(self:GetSpecialValueFor("burn_delay"), function()
        local burnDuration = self:GetSpecialValueFor("burn_duration")
        local burnDamage = self:GetSpecialValueFor("burn_damage")
        local burnIntPctToDamage = self:GetSpecialValueFor("burn_int_pct_to_damage") / 100
        local burnInterval = self:GetSpecialValueFor("burn_tick_rate")
        self:StartThinker(
            caster, 
            casterTeam, 
            team, 
            type, 
            flags, 
            radius,
            burnInterval, 
            burnDamage, 
            burnIntPctToDamage, 
            burnDuration,
            position
        )
    end, self)
end

function lina_light_strike_array_custom:StartThinker(caster, casterTeam, team, type, flags, radius, burnInterval, burnDamage, burnIntPctToDamage, burnDuration, position)
    local particle = ParticleManager:CreateParticle(
        "particles/custom/units/heroes/lina/light_strike_array/light_strike_array_burn.vpcf", 
        PATTACH_CUSTOMORIGIN, 
        nil
    )
    ParticleManager:SetParticleControl(particle, 0, position)
    ParticleManager:SetParticleControl(particle, 1, Vector(radius, 0, 0))
    ParticleManager:SetParticleControl(particle, 2, Vector(burnDuration, 0, 0))
    ParticleManager:DestroyAndReleaseParticle(particle, burnDuration)

    local currentBurnDuration = 0
    Timers:CreateTimer(0, function()
        if(currentBurnDuration <= burnDuration) then
            self:OnThinkerThink(caster, casterTeam, team, type, flags, radius, burnInterval, burnDamage, burnIntPctToDamage, burnDuration, position)
            currentBurnDuration = currentBurnDuration + burnInterval
            return burnInterval
        end
    end, self)
end

function lina_light_strike_array_custom:OnThinkerThink(caster, casterTeam, targetTeam, targetType, targetFlags, radius, burnInterval, burnDamage, burnIntPctToDamage, burnDuration, position)
    local spellAmp = 1 + caster:GetSpellAmplification(false)
    local intPctToDamage = caster:GetIntellect() * burnIntPctToDamage

    local damage = ((burnDamage * spellAmp) + intPctToDamage) * burnInterval

	local enemies = FindUnitsInRadius(
		casterTeam,
		position,	
		nil,	
		radius,	
		targetTeam,
		targetType,
		targetFlags,
		FIND_ANY_ORDER,
		false
    )

    for _, enemy in pairs(enemies) do
        self:ApplyDamage(enemy, damage)
        enemy:AddNewModifier(caster, self, "modifier_lina_light_strike_array_debuff", {duration = burnInterval})
    end
end

modifier_lina_light_strike_array_debuff = class({
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
        return true
    end
})

LinkLuaModifier("modifier_lina_light_strike_array_debuff", "abilities/heroes/lina/light_strike_array", LUA_MODIFIER_MOTION_NONE)