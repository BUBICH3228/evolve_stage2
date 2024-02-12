luna_lunar_blessing_custom = class({
    GetIntrinsicModifierName = function()
        return "modifier_luna_lunar_blessing_custom_aura"
    end,
    GetCastRange = function(self)
        return self:GetSpecialValueFor("radius")
    end,
    GetCooldown = function(self)
        return self:GetSpecialValueFor("cooldown")
    end
})

function luna_lunar_blessing_custom:Precache(context)
    PrecacheResource("soundfile", "soundevents/custom/heroes/luna/game_sounds_luna.vsndevts", context)
    PrecacheResource("particle", "particles/custom/units/heroes/luna/lunar_blessing/lunar_blessing.vpcf", context)
end

function luna_lunar_blessing_custom:GetBehavior()
    local caster = self:GetCaster()
    if(caster:HasTalent("talent_luna_lunar_blessing_active")) then
        return DOTA_ABILITY_BEHAVIOR_NO_TARGET
    end
    return self.BaseClass.GetBehavior(self)
end

function luna_lunar_blessing_custom:OnSpellStart()
    if(not IsServer()) then
        return
    end
    local caster = self:GetCaster()
    GameRules:BeginTemporaryNight(self:GetSpecialValueFor("temporary_night_duration"))
    local particle = ParticleManager:CreateParticle(
        "particles/custom/units/heroes/luna/lunar_blessing/lunar_blessing.vpcf",
        PATTACH_ABSORIGIN,
        caster
    )
    ParticleManager:SetParticleControl(particle, 1, Vector(425, 1, 1000))
    ParticleManager:DestroyAndReleaseParticle(particle, 2)
    caster:EmitSound("Luna.LunarBlessing.Cast")
end

modifier_luna_lunar_blessing_custom_aura = class({
    IsHidden = function()
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
    IsAura = function() 
        return true 
    end,
    GetAuraSearchTeam = function(self) 
        return self.targetTeam
    end,
    GetAuraSearchType = function(self) 
        return self.targetType
    end,
    GetAuraSearchFlags = function(self)
        return self.targetFlags
    end,
    GetModifierAura = function() 
        return "modifier_luna_lunar_blessing_custom_aura_buff" 
    end,
	GetAuraDuration = function()
		return 0
	end
})

function modifier_luna_lunar_blessing_custom_aura:OnCreated()
	self.parent = self:GetParent()
	self:OnRefresh()
    if(not IsServer()) then
        return
    end
    self.targetTeam = self.ability:GetAbilityTargetTeam()
    self.targetType = self.ability:GetAbilityTargetType()
    self.targetFlags = self.ability:GetAbilityTargetFlags()
    self:StartIntervalThink(1)
    self:OnIntervalThink()
end

function modifier_luna_lunar_blessing_custom_aura:OnRefresh()
    if(not IsServer()) then
		return
	end
    self.ability = self:GetAbility()
    if(not self.ability or self.ability:IsNull()) then
        return
    end
    if(self.parent:HasTalent("talent_luna_lunar_blessing_enemies")) then
        if(self.parent:IsAlive() == true) then
            self:ApplyEnemiesAuraTalentEffects()
        else
            Timers:CreateTimer(1, function()
                if(self.parent:IsAlive() == true) then
                    self:ApplyEnemiesAuraTalentEffects()
                else
                    return 1
                end
            end)
        end
    else
        self.parent:RemoveModifierByName("modifier_luna_lunar_blessing_custom_aura_enemies")
    end
    self.radius = self.ability:GetCastRange()
end

function modifier_luna_lunar_blessing_custom_aura:OnIntervalThink()
    if(GameRules:IsDaytime() == false and self.parent:HasShard()) then
        self:SetStackCount(1)
    else
        self:SetStackCount(0)
    end
end

function modifier_luna_lunar_blessing_custom_aura:ApplyEnemiesAuraTalentEffects()
    self.parent:AddNewModifier(self.parent, self.ability, "modifier_luna_lunar_blessing_custom_aura_enemies", {duration = -1})
end

function modifier_luna_lunar_blessing_custom_aura:GetAuraRadius()
    if(self.parent:HasShard() and GameRules:IsDaytime() == false) then
        return FIND_UNITS_EVERYWHERE
    end
    return self.radius
end

modifier_luna_lunar_blessing_custom_aura_buff = class({
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
        return {
            MODIFIER_PROPERTY_BASEDAMAGEOUTGOING_PERCENTAGE,
            MODIFIER_PROPERTY_SPELL_AMPLIFY_PERCENTAGE
        }
    end,
    GetModifierBaseDamageOutgoing_Percentage = function(self)
        return self.bonusAttackDamagePct
    end,
    GetModifierSpellAmplify_Percentage = function(self)
        return self.bonusSpellAmp
    end
})

function modifier_luna_lunar_blessing_custom_aura_buff:OnCreated()
    self.ability = self:GetAbility()
    if(not self.ability) then
        self:Destroy()
        return
    end
    self.caster = self:GetCaster()
    self:OnRefresh()
end

function modifier_luna_lunar_blessing_custom_aura_buff:OnRefresh()
    self.ability = self:GetAbility() or self.ability
    if(not self.ability or self.ability:IsNull() == true) then
        return
    end
    self.bonusAttackDamagePct = self.ability:GetSpecialValueFor("bonus_attack_damage_pct")
    self.bonusSpellAmp = self.ability:GetSpecialValueFor("bonus_spell_amp")
    self.bonusMultiplierShard = self.ability:GetSpecialValueFor("bonus_multiplier_shard")
end

function modifier_luna_lunar_blessing_custom_aura_buff:IsShardActive()
    return self.caster:GetModifierStackCount("modifier_luna_lunar_blessing_custom_aura", self.caster) == 1
end

function modifier_luna_lunar_blessing_custom_aura_buff:GetModifierBaseDamageOutgoing_Percentage()
    local multiplier = 1
    if(self:IsShardActive()) then
        multiplier = self.bonusMultiplierShard
    end
    return self.bonusAttackDamagePct * multiplier
end

function modifier_luna_lunar_blessing_custom_aura_buff:GetModifierSpellAmplify_Percentage()
    local multiplier = 1
    if(self:IsShardActive()) then
        multiplier = self.bonusMultiplierShard
    end
    return self.bonusSpellAmp * multiplier
end

modifier_luna_lunar_blessing_custom_aura_enemies = class({
    IsHidden = function()
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
    IsAura = function() 
        return true 
    end,
    GetAuraRadius = function(self) 
        return self.radius
    end,
    GetAuraSearchTeam = function(self) 
        return self.targetTeam
    end,
    GetAuraSearchType = function(self) 
        return self.targetType
    end,
    GetAuraSearchFlags = function(self)
        return self.targetFlags
    end,
    GetModifierAura = function() 
        return "modifier_luna_lunar_blessing_custom_aura_enemies_debuff" 
    end,
	GetAuraDuration = function()
		return 0
	end,
    GetAttributes = function()
        return MODIFIER_ATTRIBUTE_IGNORE_INVULNERABLE
    end
})

function modifier_luna_lunar_blessing_custom_aura_enemies:OnCreated()
	self.parent = self:GetParent()
	self:OnRefresh()
    if(not IsServer()) then
        return
    end
    self.targetTeam = DOTA_UNIT_TARGET_TEAM_ENEMY
    self.targetType = DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC
    self.targetFlags = DOTA_UNIT_TARGET_FLAG_MAGIC_IMMUNE_ENEMIES
end

function modifier_luna_lunar_blessing_custom_aura_enemies:OnRefresh()
    if(not IsServer()) then
		return
	end
    self.ability = self:GetAbility()
    if(not self.ability or self.ability:IsNull()) then
        return
    end
    self.radius = self.ability:GetCastRange()
end

modifier_luna_lunar_blessing_custom_aura_enemies_debuff = class({
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
        return self.delayBeforeProc
    end
})

function modifier_luna_lunar_blessing_custom_aura_enemies_debuff:OnCreated()
    self.ability = self:GetAbility()
    if(not self.ability) then
        self:Destroy()
        return
    end
    self:OnRefresh()
    if(not IsServer()) then
        return
    end
    self.parent = self:GetParent()
    self.caster = self:GetCaster()
    self.lucentBeamAbility = self.caster:FindAbilityByName("luna_lucent_beam_custom")
    self.currentTickInterval = 0
    self:StartIntervalThink(self.tickInterval)
end

function modifier_luna_lunar_blessing_custom_aura_enemies_debuff:OnRefresh()
    self.ability = self:GetAbility() or self.ability
    if(not self.ability or self.ability:IsNull() == true) then
        return
    end
    self.delayBeforeProc = self.ability:GetSpecialValueFor("delay_before_lucent_beam")
    self.tickInterval = self.ability:GetSpecialValueFor("tick_interval")
end

function modifier_luna_lunar_blessing_custom_aura_enemies_debuff:OnIntervalThink()
    self.currentTickInterval = self.currentTickInterval + self.tickInterval
    if(self.currentTickInterval >= self.delayBeforeProc) then
        self:CastLucentBeamOnParent()
        self.currentTickInterval = 0
    end
end

function modifier_luna_lunar_blessing_custom_aura_enemies_debuff:CastLucentBeamOnParent()
    if(self.lucentBeamAbility and self.lucentBeamAbility:GetLevel() > 0) then
        self.lucentBeamAbility:FireBeam(self.caster, self.parent, false)
    end
end

LinkLuaModifier("modifier_luna_lunar_blessing_custom_aura", "abilities/heroes/luna/lunar_blessing", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_luna_lunar_blessing_custom_aura_buff", "abilities/heroes/luna/lunar_blessing", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_luna_lunar_blessing_custom_aura_enemies", "abilities/heroes/luna/lunar_blessing", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_luna_lunar_blessing_custom_aura_enemies_debuff", "abilities/heroes/luna/lunar_blessing", LUA_MODIFIER_MOTION_NONE)