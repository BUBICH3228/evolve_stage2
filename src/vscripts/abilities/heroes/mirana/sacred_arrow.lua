mirana_sacred_arrow_custom = class({})

function mirana_sacred_arrow_custom:Precache(context)
    PrecacheResource("particle", "particles/units/heroes/hero_mirana/mirana_spell_arrow.vpcf", context)
end

function mirana_sacred_arrow_custom:GetArrowRange()
    return self:GetSpecialValueFor("arrow_range")
end

function mirana_sacred_arrow_custom:GetCastRange()
    if(IsServer()) then
        return 0
    end
    return self:GetArrowRange()
end

function mirana_sacred_arrow_custom:OnSpellStart()
    if(not IsServer()) then
        return
    end
    local caster = self:GetCaster()
    local arrowWidth = self:GetSpecialValueFor("arrow_width")
    local arrowPosition = caster:GetAbsOrigin()
    local arrowSpeed = self:GetSpecialValueFor("arrow_speed")
    local projectile = {
        Source = caster,
        Ability = self,
        EffectName = ParticleManager:GetParticleReplacement("particles/units/heroes/hero_mirana/mirana_spell_arrow.vpcf", caster),
        vSpawnOrigin = arrowPosition,
        vVelocity = CalculateDirection(caster, self:GetCursorPosition()) * arrowSpeed,
        fDistance = self:GetArrowRange(),
        fStartRadius = arrowWidth,
        fEndRadius = arrowWidth,
        fExpireTime = GameRules:GetGameTime() + 10,
        iUnitTargetTeam = self:GetAbilityTargetTeam(),
        iUnitTargetFlags = self:GetAbilityTargetFlags(),
        iUnitTargetType = self:GetAbilityTargetType(),
		fProjectileSpeed = arrowSpeed,
        iVisionRadius = self:GetSpecialValueFor("arrow_vision"),
        iVisionTeamNumber = caster:GetTeamNumber(),
        bProvidesVision = true
    }
    
    self._starfallAbility = self._starfallAbility or caster:FindAbilityByName("mirana_starfall_custom")
    local projectileId = ProjectileManager:CreateLinearProjectile(projectile)
    self._projectiles = self._projectiles or {}
    self._projectiles[projectileId] = {
        caster = caster,
        enemies = {},
        extraData = projectile.ExtraData,
        scepterRadius = self:GetSpecialValueFor("scepter_radius"),
        x = arrowPosition.x,
        y = arrowPosition.y,
        z = arrowPosition.z,
        targetTeam = self:GetAbilityTargetTeam(),
        targetType = self:GetAbilityTargetType(),
        targetFlags = self:GetAbilityTargetFlags(),
        teamNumber = caster:GetTeamNumber(),
        searchRadius = self:GetSpecialValueFor("scepter_radius")
    }
    EmitSoundOn("Hero_Mirana.ArrowCast", caster)
end

function mirana_sacred_arrow_custom:IsValidTarget(target, extraData)
    return UnitFilter(
        target, 
        extraData.targetTeam, 
        extraData.targetType, 
        extraData.targetFlags, 
        extraData.teamNumber
    ) == UF_SUCCESS
end

function mirana_sacred_arrow_custom:OnProjectileDestroyed(projectileId)
    self._projectiles[projectileId] = nil
end

function mirana_sacred_arrow_custom:OnProjectileThinkHandle(projectileId)
    local projectileInfo = self._projectiles[projectileId]
    local caster = projectileInfo.caster
    if(caster:HasScepter() == false or self._starfallAbility == nil or self._starfallAbility:GetLevel() == 0) then
        return
    end
    local targetTeam = projectileInfo.targetTeam 
    local targetType = projectileInfo.targetType 
    local targetFlags = projectileInfo.targetFlags
    local searchRadius = projectileInfo.searchRadius
    local location = ProjectileManager:GetLinearProjectileLocation(projectileId)
    local enemies = FindUnitsInRadius(
        caster:GetTeamNumber(), 
        location, 
        nil, 
        searchRadius, 
        targetTeam, 
        targetType, 
        targetFlags, 
        FIND_CLOSEST, 
        false
    )
    for _, enemy in pairs(enemies) do
        if(projectileInfo.enemies[enemy] == nil) then
            self._starfallAbility:Starfall(enemy, true)
            projectileInfo.enemies[enemy] = true
        end
    end
end

function mirana_sacred_arrow_custom:OnProjectileHitHandle(target, location, projectileId)
    local extraData = self._projectiles[projectileId]
    if(not target or self:IsValidTarget(target, extraData) == false) then
        self:OnProjectileDestroyed(projectileId)
        return
    end
    local caster = self:GetCaster()
    local arrowStartPosition = Vector(extraData.x, extraData.y, extraData.z)
    local bonusRatio = math.min(1, CalculateDistance(location, arrowStartPosition) / self:GetSpecialValueFor("arrow_bonus_max_range"))
    local minStunDuration = self:GetSpecialValueFor("arrow_min_stun")
    local stunDuration = (math.max(0, (self:GetSpecialValueFor("arrow_max_stun") - minStunDuration)) + minStunDuration) * bonusRatio
    if(stunDuration > 0) then
        target:AddNewModifier(caster, self, "modifier_stunned", {duration = stunDuration})
    end
    EmitSoundOn("Hero_Mirana.ArrowImpact", target)
    if(self:GetSpecialValueFor("arrow_min_lvl_for_insta_kill") >= target:GetLevel()) then
        target:Kill(self, caster)
        if(caster:HasTalent("talent_mirana_sacred_arrow_phased") == false) then
            self:OnProjectileDestroyed(projectileId)
            return true
        end
    end
    local spellAmp = (1 + caster:GetSpellAmplification(false))
    local agility = caster:GetAgility() / 100
    local baseDamage = self:GetSpecialValueFor("arrow_base_damage") * spellAmp
    local agilityToBaseDamage = self:GetSpecialValueFor("arrow_agility_pct_to_base_damage") * agility
    local bonusDamage = self:GetSpecialValueFor("arrow_bonus_damage") * bonusRatio * spellAmp
    local agilityToBonusDamage = self:GetSpecialValueFor("arrow_agiltiy_pct_to_bonus_damage") * agility * bonusRatio
    local damageTable = {
        victim = target,
        attacker = caster,
        ability = self,
        damage = baseDamage + agilityToBaseDamage + bonusDamage + agilityToBonusDamage,
        damage_type = self:GetAbilityDamageType(),
        damage_flags = DOTA_DAMAGE_FLAG_NO_SPELL_AMPLIFICATION
    }
    ApplyDamage(damageTable)
    if(caster:HasTalent("talent_mirana_sacred_arrow_phased") == false) then
        self:OnProjectileDestroyed(projectileId)
        return true
    end
end
