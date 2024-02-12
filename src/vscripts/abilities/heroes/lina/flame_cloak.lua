lina_flame_cloak_custom = class({})

function lina_flame_cloak_custom:Precache(context)
    local caster = self:GetCaster()
    PrecacheResource("particle", ParticleManager:GetParticleReplacement("particles/units/heroes/hero_lina/lina_flame_cloak.vpcf", caster), context)
    PrecacheResource("particle", "particles/custom/units/heroes/lina/flame_cloak/flame_cloak_burn.vpcf", context)
end

function lina_flame_cloak_custom:GetManaCost()
    local caster = self:GetCaster()
    return self:GetSpecialValueFor("base_mana_cost") + (caster:GetMaxMana() * self:GetSpecialValueFor("max_mana_pct_to_mana_cost") / 100)
end

function lina_flame_cloak_custom:OnToggle()
    if(not IsServer()) then
        return
    end
    local caster = self:GetCaster()
    if(self:GetToggleState() == false) then
        caster:RemoveModifierByName("modifier_lina_flame_cloak_custom_buff")
    else
        caster:AddNewModifier(caster, self, "modifier_lina_flame_cloak_custom_buff", { duration = -1 })
        if(not self._soundCooldown) then
            EmitSoundOn("Hero_Lina.FlameCloak.Cast", caster)
            self._soundCooldown = true
            local soundDuration = caster:GetSoundDuration("Hero_Lina.FlameCloak.Cast", caster:GetUnitName())
            Timers:CreateTimer(soundDuration, function()
                self._soundCooldown = nil
            end, self)
        end
    end
end

modifier_lina_flame_cloak_custom_buff = class({
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
    CheckState = function()
        return {
            [MODIFIER_STATE_FLYING] = true,
            [MODIFIER_STATE_NO_UNIT_COLLISION] = true
        }
    end,
    DeclareFunctions = function()
        return {
            MODIFIER_PROPERTY_INCOMING_DAMAGE_PERCENTAGE
        }
    end,
    GetModifierIncomingDamage_Percentage = function(self)
        return self.bonusIncomingDamageReductionPct
    end
})

function modifier_lina_flame_cloak_custom_buff:OnCreated()
    self.ability = self:GetAbility()
    self.parent = self:GetParent()
	self:OnRefresh()
    if(not IsServer()) then
        return
    end
    self.targetTeam = self.ability:GetAbilityTargetTeam()
    self.targetType = self.ability:GetAbilityTargetType()
    self.targetFlags = self.ability:GetAbilityTargetFlags()
    self.casterTeam = self.parent:GetTeamNumber()
    self.damageTable = self.damageTable or {
        victim = nil,
        attacker = self.parent,
        ability = self.ability,
        damage = 0,
        damage_type = self.ability:GetAbilityDamageType(),
        damage_flags = DOTA_DAMAGE_FLAG_NO_SPELL_AMPLIFICATION
    }
    self.lastPosition = self.parent:GetAbsOrigin()
    self:CreateParticle()
    self.tickInterval = 0.1
    self:StartIntervalThink(self.tickInterval)
end

function modifier_lina_flame_cloak_custom_buff:OnRefresh()
    self.ability = self:GetAbility() or self.ability
    if(not self.ability or self.ability:IsNull() == true) then
        return
    end
    self.zDelta = self.ability:GetSpecialValueFor("visualzdelta")
    self.bonusIncomingDamageReductionPct = self.ability:GetSpecialValueFor("incoming_damage_reduction_pct") * -1
    self.burnTickRate = self.ability:GetSpecialValueFor("burn_tick_rate")
    self.burnDuration = self.ability:GetSpecialValueFor("burn_duration")
    self.burnDamage = self.ability:GetSpecialValueFor("burn_damage")
    self.burnIntPctToDamage = self.ability:GetSpecialValueFor("burn_int_pct_to_damage") / 100
    self.radius = self.ability:GetSpecialValueFor("radius")
    self.distanceBetweenPoolsSqr = (self.radius * 1.5) ^ 2
end

function modifier_lina_flame_cloak_custom_buff:CreateParticle()
    local particle = ParticleManager:CreateParticle(
        ParticleManager:GetParticleReplacement("particles/units/heroes/hero_lina/lina_flame_cloak.vpcf", self.parent), 
        PATTACH_CUSTOMORIGIN, 
        nil
    )
    ParticleManager:SetParticleControlEnt(particle, 0, self.parent, PATTACH_ABSORIGIN_FOLLOW, "attach_hitloc", Vector(0, 0, 0), true)
    ParticleManager:SetParticleControlEnt(particle, 1, self.parent, PATTACH_ABSORIGIN_FOLLOW, "attach_hitloc", Vector(0, 0, 0), true)
    ParticleManager:SetParticleControlEnt(particle, 3, self.parent, PATTACH_POINT_FOLLOW, "attach_foot_l", Vector(0, 0, 0), true)
    ParticleManager:SetParticleControlEnt(particle, 4, self.parent, PATTACH_POINT_FOLLOW, "attach_foot_r", Vector(0, 0, 0), true)
    self:AddParticle(particle, false, false, 1, false, false)
end

function modifier_lina_flame_cloak_custom_buff:OnIntervalThink()
    self.parent:SpendMana(self.ability:GetManaCost(-1) * self.tickInterval, self.ability)
    if(self.parent:GetMana() == 0) then
        self.parent:CastAbilityToggle(self.ability, self.parent:GetPlayerOwnerID())
        self:Destroy()
        return
    end
    local newPosition = self.parent:GetAbsOrigin()
	if(CalculateDistanceSqr(self.lastPosition, newPosition) >= self.distanceBetweenPoolsSqr) then
        self:CreatePoolAt(newPosition)
		self.lastPosition = newPosition
	end
end

function modifier_lina_flame_cloak_custom_buff:CreatePoolAt(position)
    GridNav:DestroyTreesAroundPoint(position, self.radius, false)
    local particle = ParticleManager:CreateParticle(
        "particles/custom/units/heroes/lina/flame_cloak/flame_cloak_burn.vpcf", 
        PATTACH_CUSTOMORIGIN, 
        nil
    )
    ParticleManager:SetParticleControl(particle, 0, position)
    ParticleManager:SetParticleControl(particle, 1, Vector(self.radius, 0, 0))
    ParticleManager:SetParticleControl(particle, 2, Vector(self.burnDuration, 0, 0))
    ParticleManager:DestroyAndReleaseParticle(particle, self.burnDuration)

    local currentDuration = 0

    Timers:CreateTimer(self.burnTickRate, function()
        currentDuration = currentDuration + self.burnTickRate
        if(currentDuration < self.burnDuration) then
            local spellAmp = 1 + self.parent:GetSpellAmplification(false)
            local intPctToDamage = self.parent:GetIntellect() * self.burnIntPctToDamage
            
            self.damageTable.damage = ((self.burnDamage * spellAmp) + intPctToDamage) * self.burnTickRate

            local enemies = FindUnitsInRadius(
                self.casterTeam,
                position,	
                nil,	
                self.radius,	
                self.targetTeam,
                self.targetType,
                self.targetFlags,
                FIND_ANY_ORDER,
                false
            )
        
            for _, enemy in pairs(enemies) do
                self.damageTable.victim = enemy
                ApplyDamage(self.damageTable)
            end
            return self.burnTickRate
        end
    end, self)
end

LinkLuaModifier("modifier_lina_flame_cloak_custom_buff", "abilities/heroes/lina/flame_cloak", LUA_MODIFIER_MOTION_NONE)