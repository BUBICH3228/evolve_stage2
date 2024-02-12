item_scythe_of_vyse_custom = class({
    GetIntrinsicModifierName = function()
        return "modifier_item_scythe_of_vyse_custom"
    end
})

item_scythe_of_vyse_custom2 = item_scythe_of_vyse_custom
item_scythe_of_vyse_custom3 = item_scythe_of_vyse_custom
item_scythe_of_vyse_custom4 = item_scythe_of_vyse_custom
item_scythe_of_vyse_custom5 = item_scythe_of_vyse_custom
item_scythe_of_vyse_custom6 = item_scythe_of_vyse_custom
item_scythe_of_vyse_custom7 = item_scythe_of_vyse_custom
item_scythe_of_vyse_custom8 = item_scythe_of_vyse_custom

function item_scythe_of_vyse_custom:Precache(context)
	PrecacheResource("particle", "particles/status_fx/status_effect_beserkers_call.vpcf", context)
    PrecacheResource("particle", "particles/items_fx/item_sheepstick.vpcf", context)
end

function item_scythe_of_vyse_custom:OnSpellStart()
    local caster = self:GetCaster()
    local point = self:GetCursorPosition()
    local unit = CreateUnitByName("npc_scythe_of_vyse", point, true, caster, caster, caster:GetTeamNumber())
    unit:AddNewModifier(unit, self, "modifier_item_scythe_of_vyse_creep", { duration = -1 })
    unit:AddNewModifier(unit, self, "modifier_phased", { duration = 0.05 })
    unit:AddNewModifier(unit, self, "modifier_kill", { duration = self:GetSpecialValueFor("duration") })
    EmitSoundOn("MountainItem.ScytheOfVyse.Cast", unit)
end

modifier_item_scythe_of_vyse_custom = class({
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
	IsDebuff = function()
		return false
	end,
    DeclareFunctions = function()
        return {
            MODIFIER_PROPERTY_STATS_AGILITY_BONUS,
            MODIFIER_PROPERTY_STATS_STRENGTH_BONUS,
            MODIFIER_PROPERTY_STATS_INTELLECT_BONUS,
            MODIFIER_PROPERTY_MANA_REGEN_CONSTANT
        }
    end,
    GetModifierBonusStats_Agility = function(self)
        return self.bonusAgility
    end,
    GetModifierBonusStats_Intellect = function(self)
        return self.bonusIntellect
    end,
    GetModifierBonusStats_Strength = function(self)
        return self.bonusStrength
    end,
    GetModifierConstantManaRegen = function(self)
        return self.bonusManaRegen
    end,
	GetAttributes = function()
		return MODIFIER_ATTRIBUTE_MULTIPLE
	end
})

function modifier_item_scythe_of_vyse_custom:OnCreated()
	self.parent = self:GetParent()
	self:OnRefresh()
end

function modifier_item_scythe_of_vyse_custom:OnRefresh()
	self.ability = self:GetAbility()
    if(not self.ability or self.ability:IsNull()) then
        return
    end
    self.bonusStrength = self.ability:GetSpecialValueFor("bonus_strength")
    self.bonusAgility = self.ability:GetSpecialValueFor("bonus_agility")
    self.bonusIntellect = self.ability:GetSpecialValueFor("bonus_intellect")
    self.bonusManaRegen = self.ability:GetSpecialValueFor("bonus_mana_regen")
end

modifier_item_scythe_of_vyse_creep = class({
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
		return false
	end,
	GetAbsoluteNoDamagePhysical = function() 
        return 1
    end,
    GetAbsoluteNoDamageMagical = function() 
        return 1
    end,
    GetAbsoluteNoDamagePure = function() 
        return 1
    end,
	DeclareFunctions = function() 
		return 
		{
			MODIFIER_EVENT_ON_ATTACK_LANDED,
			MODIFIER_PROPERTY_ABSOLUTE_NO_DAMAGE_PHYSICAL,
			MODIFIER_PROPERTY_ABSOLUTE_NO_DAMAGE_MAGICAL,
			MODIFIER_PROPERTY_ABSOLUTE_NO_DAMAGE_PURE,
            MODIFIER_PROPERTY_DISABLE_HEALING
		}
	end,
    CheckState = function()
        return {
            [MODIFIER_STATE_STUNNED] = true
        }
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
        return "modifier_item_scythe_of_vyse_enemy_debuff" 
    end,
	GetAuraDuration = function()
		return 0
	end,
    GetDisableHealing = function()
        return 1
    end
})

function modifier_item_scythe_of_vyse_creep:OnCreated()
	self.parent = self:GetParent()
    if(not IsServer()) then
        return
    end
    self.ability = self:GetAbility()
    self.healthPerAttack = self.ability:GetSpecialValueFor("health_per_attack")
    self.healthPerAttackBoss = self.ability:GetSpecialValueFor("health_per_attack_boss")
    self.radius = self.ability:GetSpecialValueFor("radius")
    self.targetTeam = self.ability:GetAbilityTargetTeam()
    self.targetType = self.ability:GetAbilityTargetType()
    self.targetFlags = self.ability:GetAbilityTargetFlags()
    local maxHealth = self.ability:GetSpecialValueFor("health")
    self.parent:SetBaseMaxHealth(maxHealth)
    self.parent:SetMaxHealth(maxHealth)
    self.parent:SetHealth(maxHealth)
    self.parent:CalculateGenericBonuses()
    self:CreateParticle()
end

function modifier_item_scythe_of_vyse_creep:CreateParticle()
    local particle = ParticleManager:CreateParticle("particles/items_fx/item_sheepstick.vpcf", PATTACH_ABSORIGIN_FOLLOW, self.parent)
    self:AddParticle(particle, false, false, 1, false, false)
end

function modifier_item_scythe_of_vyse_creep:OnAttackLanded(kv)
	if(kv.target ~= self.parent) then
		return
	end
    local healthPerAttack = self.healthPerAttack
    if(kv.attacker:IsBoss()) then
        healthPerAttack = self.healthPerAttackBoss
    end
    local newHealth = self.parent:GetHealth() - healthPerAttack
    if(newHealth < 1) then
        self.parent:Kill(kv.inflictor, kv.attacker)
    else
        self.parent:SetHealth(newHealth)
    end
end

function modifier_item_scythe_of_vyse_creep:OnDestroy()
    if(not IsServer()) then
        return
    end
    UTIL_Remove(self.parent)
end

modifier_item_scythe_of_vyse_enemy_debuff = class({
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
    CheckState = function(self)
        return 
        {
            [MODIFIER_STATE_COMMAND_RESTRICTED] = self.isRestricted,
        }
    end,
    GetStatusEffectName = function()
        return "particles/status_fx/status_effect_beserkers_call.vpcf"
    end,
    StatusEffectPriority = function()
        return MODIFIER_PRIORITY_NORMAL
    end
})    

function modifier_item_scythe_of_vyse_enemy_debuff:OnCreated()
    if(not IsServer()) then
        return
    end
    self.parent = self:GetParent()
    self.caster = self:GetCaster()
    self.parent:MoveToTargetToAttack(self.caster)
    self.parent:SetForceAttackTarget(self.caster)
    self.isRestricted = true
end

function modifier_item_scythe_of_vyse_enemy_debuff:OnDestroy()
    if(not IsServer()) then
        return
    end
    self.parent:SetForceAttackTarget(nil)
end

LinkLuaModifier("modifier_item_scythe_of_vyse_custom", "items/item_scythe_of_vyse", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_item_scythe_of_vyse_creep", "items/item_scythe_of_vyse", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_item_scythe_of_vyse_enemy_debuff", "items/item_scythe_of_vyse", LUA_MODIFIER_MOTION_NONE)