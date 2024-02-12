luna_moon_glaives_custom = class({
    GetIntrinsicModifierName = function()
        return "modifier_luna_moon_glaives_custom_handler"
    end
})

function luna_moon_glaives_custom:OnProjectileHitHandle(target, position, projectileID)
    if(not target) then
        self:SetProjectileData(projectileID, nil)
        return
    end
    local modifier = self:GetIntrinsicModifier()
    if(not modifier) then
        return
    end
    local extraData = self:GetProjectileData(projectileID)
    modifier:ApplyMoonGlaiveEffect(target, extraData.damage)
    modifier:LaunchMoonGlaives(target, extraData.bounce + 1, extraData.original_damage)
    self:SetProjectileData(projectileID, nil)
end

modifier_luna_moon_glaives_custom_handler = class({
    IsHidden = function(self)
        return true
    end,
    IsPurgable = function()
        return false
    end,
    IsPurgeException = function()
        return false
    end,
    RemoveOnDeath = function()
        return false
    end,
    DeclareFunctions = function()
        return {
            MODIFIER_EVENT_ON_ATTACK_LANDED
        }
    end
})

function modifier_luna_moon_glaives_custom_handler:OnCreated()
    self.parent = self:GetParent()
	self:OnRefresh()
    if(not IsServer()) then
        return
    end
    self.targetTeam = self.ability:GetAbilityTargetTeam()
    self.targetType = self.ability:GetAbilityTargetType()
    self.targetFlags = self.ability:GetAbilityTargetFlags()
    self.glaiveProjectile = {
        Source = nil,
        Target = nil,
        Ability = self.ability,
        bDodgeable = true,
        EffectName = "",
        iMoveSpeed = 0
    }
    self.damageTable = {
        victim = nil,
        attacker = self.parent,
        ability = self.ability,
        damage = 0,
        damage_type = self.ability:GetAbilityDamageType(),
        damage_flags = DOTA_DAMAGE_FLAG_NO_SPELL_AMPLIFICATION
    }
    self:SetIsProc(true)
end

function modifier_luna_moon_glaives_custom_handler:OnRefresh()
    self.ability = self:GetAbility() or self.ability
    if(not self.ability or self.ability:IsNull() == true) then
        return
    end
    self.searchRadius = self.ability:GetSpecialValueFor("radius")
    self.bounceCount = self.ability:GetSpecialValueFor("bounces")
    self.damageReductionPct = (100 - self.ability:GetSpecialValueFor("damage_reduction_percent")) / 100
end

function modifier_luna_moon_glaives_custom_handler:OnAttackLanded(kv)
    if(kv.attacker ~= self.parent) then
        return
    end
    if(self.parent:PassivesDisabled()) then
        return
    end
    if(self:IsProc() == false) then
        return
    end
    self:LaunchMoonGlaives(kv.target, 0, kv.original_damage)
end

function modifier_luna_moon_glaives_custom_handler:LaunchMoonGlaives(source, currentBounce, damage)
    if(currentBounce >= self.bounceCount) then
        return
    end
    local extraData = {
        damage = damage,
        original_damage = damage,
        bounce = currentBounce
    }
    for i = 0, currentBounce, 1 do
        extraData.damage = extraData.damage * self.damageReductionPct
    end
    self.glaiveProjectile.iMoveSpeed = self.parent:GetProjectileSpeed()
    self.glaiveProjectile.EffectName = self.parent:GetRangedProjectileName()
    local enemies = FindUnitsInRadius(
        self.parent:GetTeamNumber(), 
        source:GetAbsOrigin(), 
        nil, 
        self.searchRadius, 
        self.targetTeam, 
        self.targetType, 
        self.targetFlags, 
        FIND_CLOSEST, 
        false
    )
    for _, enemy in pairs(enemies) do
        if(enemy ~= source) then
            self.glaiveProjectile.Source = source
            self.glaiveProjectile.Target = enemy
            local projectileID = ProjectileManager:CreateTrackingProjectile(self.glaiveProjectile)
            self.ability:SetProjectileData(projectileID, extraData)
            return
        end
    end
end

function modifier_luna_moon_glaives_custom_handler:ApplyMoonGlaiveEffect(target, damage)
    self.damageTable.damage = damage
    self.damageTable.victim = target
    ApplyDamage(self.damageTable)
    EmitSoundOn("Hero_Luna.MoonGlaive.Impact", target)

    if(self.parent:HasTalent("talent_luna_moon_glaives_instant_attack")) then
        self:SetIsProc(false)
        self.parent:PerformAttack(target, true, true, true, true, false, true, true)
        self:SetIsProc(true)
    end
end

function modifier_luna_moon_glaives_custom_handler:IsProc()
    return self._ignoreProc
end

function modifier_luna_moon_glaives_custom_handler:SetIsProc(state)
    self._ignoreProc = state
end

LinkLuaModifier("modifier_luna_moon_glaives_custom_handler", "abilities/heroes/luna/moon_glaives", LUA_MODIFIER_MOTION_NONE)