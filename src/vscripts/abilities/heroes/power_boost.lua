hero_power_boost = class({})

function hero_power_boost:Precache(context)
    PrecacheResource("particle", "particles/custom/units/heroes/base/power_boost/power_boost.vpcf", context)
end

function hero_power_boost:Spawn()
    if(not IsServer()) then
        return
    end
    local caster = self:GetOwnerEntity()
    Timers:CreateTimer(5, function()
        if(caster or caster:IsNull() == false and self and self:IsNull() == false) then
            self:TryAutoCast(caster)
            return 0.05
        end
    end, self)
end

function hero_power_boost:TryAutoCast(caster)
	if (self:IsCooldownReady() and self:GetAutoCastState() and caster:GetGold() >= self:GetGoldCost(-1) and self:IsOwnersManaEnough()) then
        if(CheckConnectionState(caster:GetPlayerID(),2)) then
            self:OnSpellStart()
            self:UseResources(true,false, true, true)
        end
    end
end

function hero_power_boost:OnSpellStart()
    if(not IsServer()) then
        return
    end
    local caster = self:GetCaster()
    local bonusAttributes = self:GetSpecialValueFor("bonus_stats_per_cast")
    caster:ModifyStrength(bonusAttributes) 
    caster:ModifyIntellect(bonusAttributes) 
    caster:ModifyAgility(bonusAttributes)
    local particle = ParticleManager:CreateParticle(
        "particles/custom/units/heroes/base/power_boost/power_boost.vpcf", 
        PATTACH_CUSTOMORIGIN, 
        nil
    )
    ParticleManager:SetParticleControlEnt(particle, 0, caster, PATTACH_POINT_FOLLOW, "attach_hitloc", Vector(0, 0, 0), true)
    ParticleManager:DestroyAndReleaseParticle(particle, 2)
    EmitSoundOn("PowerBoost.Cast", caster)
end