lina_fiery_soul_custom = class({
    GetIntrinsicModifierName = function()
        return "modifier_lina_fiery_soul_custom_handler"
    end,
    GetCooldown = function(self)
        return self:GetSpecialValueFor("active_cooldown")
    end
})

function lina_fiery_soul_custom:Precache(context)
    local caster = self:GetCaster()
    PrecacheResource("particle", ParticleManager:GetParticleReplacement("particles/units/heroes/hero_lina/lina_spell_laguna_blade.vpcf", caster), context)
    PrecacheResource("particle", "particles/custom/units/heroes/lina/fiery_soul/fiery_soul.vpcf", context)
    PrecacheResource("soundfile", "soundevents/custom/heroes/lina/game_sounds_lina.vsndevts", context)
end

function lina_fiery_soul_custom:GetBehavior()
    local caster = self:GetCaster()
    if(caster:HasTalent("talent_lina_dragon_slave_fiery_soul_active")) then
        return DOTA_ABILITY_BEHAVIOR_NO_TARGET + DOTA_ABILITY_BEHAVIOR_IMMEDIATE
    end
    return self.BaseClass.GetBehavior(self)
end

function lina_fiery_soul_custom:OnSpellStart()
    if(not IsServer()) then
        return
    end
    local caster = self:GetCaster()
    caster:AddNewModifier(caster, self, "modifier_lina_fiery_soul_custom_buff", { duration = self:GetSpecialValueFor("active_duration") })
    caster:EmitSound("Lina.FierySoul.Cast")
end

modifier_lina_fiery_soul_custom_handler = class({
    IsHidden = function(self)
        return self:GetStackCount() == 0
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
    DestroyOnExpire = function()
        return false
    end,
    DeclareFunctions = function()
        return {
            MODIFIER_EVENT_ON_ABILITY_EXECUTED,
            MODIFIER_PROPERTY_TOOLTIP,
            MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT,
            MODIFIER_PROPERTY_MOUNTAIN_STATS_INTELLECT_BONUS_PERCENTAGE,
            MODIFIER_PROPERTY_MOUNTAIN_BASE_ATTACK_TIME_BONUS_CONSTANT
        }
    end,
    GetModifierAttackSpeedBonus_Constant = function(self)
        return self.bonusAttackSpeedPerStack * self:GetStackCount()
    end,
    GetModifierBonusStats_Intellect_Percentage = function(self)
        return self.bonusIntPctPerStack * self:GetStackCount()
    end,
    GetModifierBonusBaseAttackTimeConstant = function(self)
        return self.bonusBATPerStack * self:GetStackCount() * -1
    end,
    OnTooltip = function(self)
        return self:GetModifierBonusStats_Intellect_Percentage()
    end
})

function modifier_lina_fiery_soul_custom_handler:OnCreated()
    self.parent = self:GetParent()
    self:OnRefresh()
end

function modifier_lina_fiery_soul_custom_handler:OnRefresh()
    self.ability = self:GetAbility() or self.ability
    if(not self.ability or self.ability:IsNull() == true) then
        return
    end
    self.duration = self.ability:GetSpecialValueFor("duration")
    self.bonusAttackSpeedPerStack = self.ability:GetSpecialValueFor("bonus_attack_speed_per_stack")
    self.bonusIntPctPerStack = self.ability:GetSpecialValueFor("bonus_int_pct_per_stack")
    self.maxStacks = self.ability:GetSpecialValueFor("max_stacks")
    self.bonusBATPerStack = self.ability:GetSpecialValueFor("bat_reduction_flat_per_stack")
end

function modifier_lina_fiery_soul_custom_handler:OnAbilityExecuted(kv)
    if(kv.unit ~= self.parent) then
        return
    end
    if(kv.ability:IsItem() or kv.ability:GetCooldown(-1) == 0) then
        return
    end
    self:SetDuration(self.duration, true)
    self:ForceRefresh()
    self:StartIntervalThink(self.duration)
    self:SetStackCount(math.min(self:GetStackCount() + 1, self.maxStacks))
end

function modifier_lina_fiery_soul_custom_handler:OnIntervalThink()
    self:SetStackCount(0)
    self:StartIntervalThink(-1)
end

modifier_lina_fiery_soul_custom_buff = class({
    IsHidden = function(self)
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
    DeclareFunctions = function()
        return {
            MODIFIER_EVENT_ON_ATTACK_LANDED,
            MODIFIER_PROPERTY_TOOLTIP
        }
    end,
    GetEffectName = function()
        return "particles/custom/units/heroes/lina/fiery_soul/fiery_soul.vpcf"
    end,
    OnTooltip = function(self)
        return self:GetAttackProcDamage()
    end
})

function modifier_lina_fiery_soul_custom_buff:OnCreated()
    self.parent = self:GetParent()
    self:OnRefresh()
    if(not IsServer()) then
        return
    end
    self.targetTeam = DOTA_UNIT_TARGET_TEAM_ENEMY
    self.targetType = DOTA_UNIT_TARGET_HERO + DOTA_UNIT_TARGET_BASIC
    self.targetFlags = DOTA_UNIT_TARGET_FLAG_MAGIC_IMMUNE_ENEMIES
    self.damageTable = {
        victim = nil,
        attacker = self.parent,
        ability = self.ability,
        damage = 0,
        damage_type = DAMAGE_TYPE_MAGICAL,
        damage_flags = DOTA_DAMAGE_FLAG_NO_SPELL_AMPLIFICATION
    }
end

function modifier_lina_fiery_soul_custom_buff:OnRefresh()
    self.ability = self:GetAbility() or self.ability
    if(not self.ability or self.ability:IsNull() == true) then
        return
    end
    self.intPctToDamagePerStack = self.ability:GetSpecialValueFor("active_int_pct_to_damage") / 100
end

function modifier_lina_fiery_soul_custom_buff:OnAttackLanded(kv)
    if(kv.attacker ~= self.parent) then
        return
    end
    self.damageTable.victim = kv.target
    self.damageTable.damage = self:GetAttackProcDamage()
    local damageDone = ApplyDamage(self.damageTable)
    if(damageDone > 0) then
        SendOverheadEventMessage(nil, OVERHEAD_ALERT_BONUS_SPELL_DAMAGE, kv.target, damageDone, nil)
    end
end

function modifier_lina_fiery_soul_custom_buff:GetAttackProcDamage()
    return (self.parent:GetIntellect() * self.intPctToDamagePerStack) * self.parent:GetModifierStackCount("modifier_lina_fiery_soul_custom_handler", self.parent)
end

LinkLuaModifier("modifier_lina_fiery_soul_custom_handler", "abilities/heroes/lina/fiery_soul", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_lina_fiery_soul_custom_buff", "abilities/heroes/lina/fiery_soul", LUA_MODIFIER_MOTION_NONE)