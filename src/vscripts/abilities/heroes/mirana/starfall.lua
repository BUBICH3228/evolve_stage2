mirana_starfall_custom = class({
    GetIntrinsicModifierName = function()
        return "modifier_mirana_starfall_custom"
    end,
    GetCastRange = function(self)
        return self:GetSpecialValueFor("starfall_radius")
    end
})

function mirana_starfall_custom:Precache(context)
    PrecacheResource("particle", "particles/units/heroes/hero_mirana/mirana_loadout.vpcf", context)
    PrecacheResource("particle", "particles/units/heroes/hero_mirana/mirana_starfall_circle.vpcf", context)
end

function mirana_starfall_custom:GetBehavior()
	if self:GetCaster():HasScepter() then
		return DOTA_ABILITY_BEHAVIOR_NO_TARGET + DOTA_ABILITY_BEHAVIOR_AUTOCAST
    end
    return self.BaseClass.GetBehavior(self)
end

function mirana_starfall_custom:GetEnemiesAround(caster)
    local enemies = FindUnitsInRadius(
        caster:GetTeamNumber(), 
        caster:GetAbsOrigin(), 
        nil, 
        self:GetCastRange(), 
        self:GetAbilityTargetTeam(), 
        self:GetAbilityTargetType(), 
        self:GetAbilityTargetFlags(), 
        FIND_CLOSEST, 
        false
    )
    return enemies
end

function mirana_starfall_custom:OnSpellStart(enemies)
    if(not IsServer()) then
        return
    end
    local caster = self:GetCaster()
    local enemies = enemies or self:GetEnemiesAround(caster)
    if(#enemies == 0) then
        return
    end
    for index, enemy in ipairs(enemies) do
        self:Starfall(enemy, index == 1)
    end
    local particle = ParticleManager:CreateParticle(
        ParticleManager:GetParticleReplacement("particles/units/heroes/hero_mirana/mirana_starfall_circle.vpcf", caster), 
        PATTACH_ABSORIGIN_FOLLOW, 
        caster
    )
    ParticleManager:DestroyAndReleaseParticle(particle, 1)
    EmitSoundOn("Ability.Starfall", caster)
end

function mirana_starfall_custom:Starfall(target, secondaryProc)
    if(not IsServer()) then
        return
    end
    local caster = self:GetCaster()
    local starDamage = self:GetSpecialValueFor("damage") * (1 + caster:GetSpellAmplification(false))
    starDamage = starDamage + (caster:GetAgility() * self:GetSpecialValueFor("agility_pct_to_damage") / 100)
    self:CreateFallingStar(caster, target, starDamage)
    if(secondaryProc) then
        starDamage = starDamage * (self:GetSpecialValueFor("secondary_starfall_damage_percent") / 100)
        local waveDelay = self:GetSpecialValueFor("secondary_wave_delay")
        Timers:CreateTimer(waveDelay, function()
            self:CreateFallingStar(caster, target, starDamage)
        end)
        if(caster:HasTalent("talent_mirana_starfall_third_strike") == true) then
            Timers:CreateTimer(waveDelay + waveDelay, function()
                self:CreateFallingStar(caster, target, starDamage)
            end)
        end
    end
end

function mirana_starfall_custom:CreateFallingStar(caster, target, damage)
    local particle = ParticleManager:CreateParticle(
        ParticleManager:GetParticleReplacement("particles/units/heroes/hero_mirana/mirana_loadout.vpcf", caster), 
        PATTACH_ABSORIGIN_FOLLOW, 
        target
    )
    Timers:CreateTimer(self:GetSpecialValueFor("wave_delay"), function()
        ParticleManager:DestroyParticle(particle, false)
        ParticleManager:ReleaseParticleIndex(particle)
        EmitSoundOn("Ability.StarfallImpact", target)
        local caster = self:GetCaster()
        ApplyDamage({
            victim = target,
            attacker = caster,
            ability = self,
            damage = damage,
            damage_type = self:GetAbilityDamageType(),
            damage_flags = DOTA_DAMAGE_FLAG_NO_SPELL_AMPLIFICATION
        })
        if(caster:HasTalent("talent_mirana_starstorm_blind") == true) then
            target:AddNewModifier(caster, self, "modifier_mirana_starfall_custom_debuff", {duration = self:GetSpecialValueFor("blind_duration")})
        end
    end, self)
end

modifier_mirana_starfall_custom = class({
    IsHidden = function(self)
        return self.parent:HasScepter() == false
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
    DestroyOnExpire = function()
        return false
    end
})

function modifier_mirana_starfall_custom:OnCreated()
    self.parent = self:GetParent()
    self.ability = self:GetAbility()
	self:OnRefresh()
    if(not IsServer()) then
        return
    end
end

function modifier_mirana_starfall_custom:OnRefresh()
    self.ability = self:GetAbility() or self.ability
    if(not self.ability or self.ability:IsNull() == true) then
        return
    end
    self.scepterThinkInterval = self.ability:GetSpecialValueFor("scepter_interval")

    if(not IsServer()) then
        return
    end
    local modifier = self.ability:GetIntrinsicModifier()
    if(not modifier) then
        return
    end
    modifier:OnInventoryContentsChanged()
end

function modifier_mirana_starfall_custom:OnInventoryContentsChanged()
    local hasScepter = self.parent:HasScepter()
    self._previousScepterState = self._previousScepterState or false
    if(hasScepter ~= self._previousScepterState) then
        self._previousScepterState = hasScepter
        if(self.parent:HasScepter()) then
            self:UpdateDuration(self.scepterThinkInterval)
            self:StartIntervalThink(self.scepterThinkInterval)
        else
            self:StartIntervalThink(-1)
        end
    end
end

function modifier_mirana_starfall_custom:OnIntervalThink()
    if(self.parent:IsAlive() == false or self.parent:HasScepter() == false) then
        self:StartIntervalThink(0.1)
        return
    end
    if(self.ability:GetAutoCastState() == false) then
        self:StartIntervalThink(0.1)
        return
    end
    local enemies = self.ability:GetEnemiesAround(self.parent)
    if(#enemies == 0) then
        self:StartIntervalThink(0.1)
        return
    end
    self.ability:OnSpellStart(enemies)
    self:UpdateDuration(self.scepterThinkInterval)
    self:StartIntervalThink(self.scepterThinkInterval)
end

function modifier_mirana_starfall_custom:UpdateDuration(duration)
    self:SetDuration(self.scepterThinkInterval, true)
    self:ForceRefresh()
end

modifier_mirana_starfall_custom_debuff = class({
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
            MODIFIER_PROPERTY_MISS_PERCENTAGE
        }
    end,
    GetModifierMiss_Percentage = function(self)
        return self.blindPct
    end
})

function modifier_mirana_starfall_custom_debuff:OnCreated()
    self.ability = self:GetAbility()
	self:OnRefresh()
end

function modifier_mirana_starfall_custom_debuff:OnRefresh()
    self.ability = self:GetAbility() or self.ability
    if(not self.ability or self.ability:IsNull() == true) then
        return
    end
    self.blindPct = self.ability:GetSpecialValueFor("blind_pct")
end

LinkLuaModifier("modifier_mirana_starfall_custom", "abilities/heroes/mirana/starfall", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_mirana_starfall_custom_debuff", "abilities/heroes/mirana/starfall", LUA_MODIFIER_MOTION_NONE)