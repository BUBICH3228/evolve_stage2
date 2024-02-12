luna_eclipse_custom = class({})

function luna_eclipse_custom:Precache(context)
    local caster = self:GetCaster()
    PrecacheResource("particle", ParticleManager:GetParticleReplacement("particles/units/heroes/hero_luna/luna_eclipse.vpcf", caster), context)
end

function luna_eclipse_custom:GetBehavior()
    local caster = self:GetCaster()
    if(caster:HasScepter()) then
        return DOTA_ABILITY_BEHAVIOR_POINT + DOTA_ABILITY_BEHAVIOR_UNIT_TARGET + DOTA_ABILITY_BEHAVIOR_AOE
    end
    return self.BaseClass.GetBehavior(self)
end

function luna_eclipse_custom:GetCastRange(location, target)
    local caster = self:GetCaster()
    if(caster:HasScepter()) then
        return self:GetSpecialValueFor("cast_range_scepter")
    end
    return self.BaseClass.GetCastRange(self, location, target)
end

function luna_eclipse_custom:GetAOERadius()
    local caster = self:GetCaster()
    if(caster:HasScepter()) then
        return self:GetSpecialValueFor("radius")
    end
    return self.BaseClass.GetAOERadius(self)
end

function luna_eclipse_custom:OnSpellStart()
    if(not IsServer()) then
        return
    end
    local caster = self:GetCaster()
    local target = caster 
    local beams = self:GetSpecialValueFor("beams")
    if(caster:HasScepter()) then
        target = self:GetCursorTarget() or self:GetCursorPosition()
        if(GameRules:IsDaytime() == false) then
            beams = beams + self:GetSpecialValueFor("bonus_beams_night_scepter")
        end
    end
    local duration = beams * self:GetSpecialValueFor("beam_interval")
    GameRules:BeginTemporaryNight(duration)
    if(target.GetAbsOrigin) then
        target:AddNewModifier(
            caster, 
            self, 
            "modifier_luna_eclipse_custom", 
            {
                duration = duration,
                thinker = false
            }
        )
    else
        CreateModifierThinker(
            caster, 
            self, 
            "modifier_luna_eclipse_custom", 
            {
                duration = duration,
                thinker = true
            }, 
            target, 
            caster:GetTeam(), 
            false
        )
    end
    caster:EmitSound("Hero_Luna.Eclipse.Cast")
end

modifier_luna_eclipse_custom = class({
    IsHidden = function()
        return false
    end,
    IsDebuff = function()
        return false
    end,
    IsPurgable = function()
        return false
    end,
    IsPurgeException = function()
        return false
    end,
    GetAttributes = function()
        return MODIFIER_ATTRIBUTE_MULTIPLE
    end
})

function modifier_luna_eclipse_custom:OnCreated(kv)
    if(not IsServer()) then
        return
    end
    self.caster = self:GetCaster()
	self.parent = self:GetParent()
    self.ability = self:GetAbility()
    self.lucentBeamAbility = self.caster:FindAbilityByName("luna_lucent_beam_custom")
    self.enemies = {}
    self.teamNumber = self.caster:GetTeamNumber()
    self.targetTeam = DOTA_UNIT_TARGET_TEAM_ENEMY
    self.targetType = self.ability:GetAbilityTargetType()
    self.targetFlags = self.ability:GetAbilityTargetFlags()
    self.isThinker = (kv.thinker == 1)
    self.radius = self.ability:GetSpecialValueFor("radius")
    self.thinkInterval = self.ability:GetSpecialValueFor("beam_interval")
    self.hitLimitPerTarget = self.ability:GetSpecialValueFor("hit_limit_per_target")
    self:CreateParticle()
    self:OnIntervalThink()
    self:StartIntervalThink(self.thinkInterval)
end

function modifier_luna_eclipse_custom:OnIntervalThink()
    local enemies = FindUnitsInRadius(
        self.teamNumber, 
        self.parent:GetAbsOrigin(), 
        nil, 
        self.radius, 
        self.targetTeam, 
        self.targetType, 
        self.targetFlags, 
        FIND_ANY_ORDER, 
        false
    )
    if(self.caster:HasScepter() == true) then
        if(#enemies > 0) then
            self:CastLucentBeamOn(enemies[1])
        end
    else
        for _, enemy in pairs(enemies) do
            self.enemies[enemy] = self.enemies[enemy] or 0
            if(self.enemies[enemy] < self.hitLimitPerTarget) then
                self:CastLucentBeamOn(enemy)
                self.enemies[enemy] = self.enemies[enemy] + 1
                break
            end
        end
    end
end

function modifier_luna_eclipse_custom:CreateParticle()
    local duration = self:GetDuration()
    local particle = ParticleManager:CreateParticle("particles/units/heroes/hero_luna/luna_eclipse.vpcf", PATTACH_POINT_FOLLOW, self.parent)
    ParticleManager:SetParticleControl(particle, 1, Vector(self.radius, duration, duration))
    self:AddParticle(particle, false, false, 1, false, false)
end

function modifier_luna_eclipse_custom:CastLucentBeamOn(target)
    if(self.lucentBeamAbility and self.lucentBeamAbility:GetLevel() > 0) then
        self.lucentBeamAbility:FireBeam(self.caster, target, true)
    end
end

function modifier_luna_eclipse_custom:OnDestroy()
    if(not IsServer()) then
		return
	end
    if(self.isThinker) then
        UTIL_Remove(self.parent)
    end
end

LinkLuaModifier("modifier_luna_eclipse_custom", "abilities/heroes/luna/eclipse", LUA_MODIFIER_MOTION_NONE)