lina_dragon_slave_custom = class({
    GetCastRange = function(self)
        return self:GetSpecialValueFor("dragon_slave_distance")
    end
})

function lina_dragon_slave_custom:Precache(context)
    local caster = self:GetCaster()
    PrecacheResource("particle", ParticleManager:GetParticleReplacement("particles/units/heroes/hero_lina/lina_spell_dragon_slave.vpcf", caster), context)
    PrecacheResource("particle", "particles/custom/units/heroes/lina/dragon_slave/dragon_slave_burn.vpcf", context)
end

function lina_dragon_slave_custom:OnSpellStart()
    if(not IsServer()) then
        return
    end
    local caster = self:GetCaster()
    local targetPosition = self:GetCursorPosition()

    EmitSoundOn("Hero_Lina.DragonSlave", caster)

    if(caster:HasTalent("talent_lina_dragon_slave_multicast")) then
        local angle = self:GetSpecialValueFor("dragon_slave_multicast_angle")
        local angles = {
            QAngle(0, 0, 0),
            QAngle(0, angle, 0),
            QAngle(0, -angle, 0)
        }
        local casterPosition = caster:GetAbsOrigin()
        local rotationVector = targetPosition + (CalculateDirection(casterPosition, targetPosition) * 500)
        for _, angle in pairs(angles) do
            local newPosition = RotatePosition(targetPosition, angle, rotationVector)
            self:FireDragonSlave(caster, newPosition)
        end
        return
    end

    self:FireDragonSlave(caster, targetPosition)
end

function lina_dragon_slave_custom:FireDragonSlave(caster, targetPosition)
    self.damageTable = self.damageTable or {
        victim = nil,
        attacker = caster,
        ability = self,
        damage = 0,
        damage_type = self:GetAbilityDamageType(),
        damage_flags = DOTA_DAMAGE_FLAG_NO_SPELL_AMPLIFICATION
    }

    local projectileWidth = self:GetSpecialValueFor("dragon_slave_width")
    local projectileSpeed = self:GetSpecialValueFor("dragon_slave_speed")
    local casterPosition = caster:GetAbsOrigin()
    local projectile = {
        Source = caster,
        Ability = self,
        EffectName = ParticleManager:GetParticleReplacement("particles/units/heroes/hero_lina/lina_spell_dragon_slave.vpcf", caster),
        vSpawnOrigin = caster:GetAbsOrigin(),
        vVelocity = CalculateDirection(casterPosition, targetPosition) * projectileSpeed,
        fDistance = self:GetCastRange(),
        fStartRadius = projectileWidth,
        fEndRadius = projectileWidth,
        fExpireTime = GameRules:GetGameTime() + 10,
        iUnitTargetTeam = self:GetAbilityTargetTeam(),
        iUnitTargetFlags = self:GetAbilityTargetFlags(),
        iUnitTargetType = self:GetAbilityTargetType(),
		fProjectileSpeed = projectileSpeed
    }
    local projectileID = ProjectileManager:CreateLinearProjectile(projectile)

    self:CreateBurnTrail(
        caster, 
        caster:GetTeamNumber(),
        casterPosition + projectile.vVelocity, 
        projectile.iUnitTargetTeam, 
        projectile.iUnitTargetType, 
        projectile.iUnitTargetFlags,
        projectileWidth
    )

    self:SetProjectileData(projectileID, {
        caster = caster
    })
end

function lina_dragon_slave_custom:ApplyDragonSlaveEffect(target, projectileID)
    local data = self:GetProjectileData(projectileID)
    local caster = data.caster
    local spellAmp = 1 + caster:GetSpellAmplification(false)
    local baseDamage = self:GetSpecialValueFor("dragon_slave_damage")
    local intPctToDamage = caster:GetIntellect() * (self:GetSpecialValueFor("dragon_slave_int_pct_to_damage") / 100)

    local damage = (baseDamage * spellAmp) + intPctToDamage
    self:ApplyDamage(target, damage)
end

function lina_dragon_slave_custom:CreateBurnTrail(caster, casterTeam, endPosition, team, type, flags, width)
    local burnDuration = self:GetSpecialValueFor("burn_duration")
    local startPosition = caster:GetAbsOrigin()
    Timers:CreateTimer(self:GetSpecialValueFor("burn_delay"), function()
        local burnDamage = self:GetSpecialValueFor("burn_damage")
        local burnIntPctToDamage = self:GetSpecialValueFor("burn_int_pct_to_damage") / 100
        local burnInterval = self:GetSpecialValueFor("burn_tick_rate")
        self:StartThinker(
            caster, 
            casterTeam, 
            endPosition, 
            team, 
            type, 
            flags, 
            width, 
            burnInterval, 
            burnDamage, 
            burnIntPctToDamage, 
            burnDuration,
            startPosition
        )
    end, self)
end

function lina_dragon_slave_custom:ApplyDamage(target, damage)
    self.damageTable.damage = damage
    self.damageTable.victim = target
    ApplyDamage(self.damageTable)
end

function lina_dragon_slave_custom:OnProjectileHitHandle(target, position, projectileID)
    if(not target) then
        self:SetProjectileData(projectileID, nil)
        return
    end
    self:ApplyDragonSlaveEffect(target, projectileID)
end

function lina_dragon_slave_custom:StartThinker(caster, casterTeam, endPosition, team, type, flags, width, burnInterval, burnDamage, burnIntPctToDamage, burnDuration, startPosition)
    local particle = ParticleManager:CreateParticle(
        "particles/custom/units/heroes/lina/dragon_slave/dragon_slave_burn.vpcf", 
        PATTACH_CUSTOMORIGIN, 
        nil
    )
    ParticleManager:SetParticleControl(particle, 0, startPosition)
    ParticleManager:SetParticleControl(particle, 1, endPosition)
    ParticleManager:SetParticleControl(particle, 2, Vector(burnDuration, 0, 0))
    ParticleManager:DestroyAndReleaseParticle(particle, burnDuration)

    local currentBurnDuration = 0
    Timers:CreateTimer(0, function()
        if(currentBurnDuration <= burnDuration) then
            self:OnThinkerThink(caster, casterTeam, endPosition, team, type, flags, width, burnInterval, burnDamage, burnIntPctToDamage, burnDuration, startPosition, endPosition)
            currentBurnDuration = currentBurnDuration + burnInterval
            return burnInterval
        end
    end, self)
end

function lina_dragon_slave_custom:OnThinkerThink(caster, casterTeam, endPosition, targetTeam, targetType, targetFlags, width, burnInterval, burnDamage, burnIntPctToDamage, burnDuration, startPosition)
    local spellAmp = 1 + caster:GetSpellAmplification(false)
    local intPctToDamage = caster:GetIntellect() * burnIntPctToDamage

    local damage = ((burnDamage * spellAmp) + intPctToDamage) * burnInterval

    local enemies = FindUnitsInLine(
        casterTeam, 
        startPosition, 
        endPosition, 
        nil, 
        width, 
        targetTeam,
        targetType,
        targetFlags
    )
    for _, enemy in pairs(enemies) do
        self:ApplyDamage(enemy, damage)
        enemy:AddNewModifier(caster, self, "modifier_lina_dragon_slave_custom_debuff", {duration = burnInterval})
    end
end

modifier_lina_dragon_slave_custom_debuff = class({
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
            MODIFIER_PROPERTY_TOOLTIP,
            MODIFIER_PROPERTY_MOUNTAIN_PHYSICAL_ARMOR_TOTAL_PERCENTAGE
        }
    end,
    OnTooltip = function(self)
        return self:GetModifierPhysicalArmorTotal_Percentage()
    end
})

function modifier_lina_dragon_slave_custom_debuff:OnCreated()
    self.ability = self:GetAbility()
    self.parent = self:GetParent()
	self:OnRefresh()
end

function modifier_lina_dragon_slave_custom_debuff:OnRefresh()
    self.ability = self:GetAbility() or self.ability
    if(not self.ability or self.ability:IsNull() == true) then
        return
    end
    self.armorReductionPct = self.ability:GetSpecialValueFor("armor_reduction_pct") * -1
end

function modifier_lina_dragon_slave_custom_debuff:IsHidden()
    return self.parent:HasModifier("modifier_lina_light_strike_array_debuff") == false
end

function modifier_lina_dragon_slave_custom_debuff:GetModifierPhysicalArmorTotal_Percentage()
    if(self.parent:HasModifier("modifier_lina_light_strike_array_debuff")) then
        return self.armorReductionPct
    end
    return 0
end

LinkLuaModifier("modifier_lina_dragon_slave_custom_debuff", "abilities/heroes/lina/dragon_slave", LUA_MODIFIER_MOTION_NONE)