antimage_counterspell_custom = class({
    GetIntrinsicModifierName = function(self)
		return "modifier_antimage_counterspell_custom" 
	end,
	GetCastRange = function(self)
		return self:GetSpecialValueFor("radius")
	end
})

function antimage_counterspell_custom:Precache(context)
    PrecacheResource("particle", "particles/units/heroes/hero_antimage/antimage_counter.vpcf", context)
    PrecacheResource("particle", "particles/custom/units/heroes/antimage/counterspell/antimage_counterspell_talent.vpcf", context)
end

function antimage_counterspell_custom:GetAbilityDamageType()
    local caster = self:GetCaster()
    if(caster:HasTalent("talent_antimage_counterspell_toggle")) then
        return DAMAGE_TYPE_MAGICAL
    end
    return self.BaseClass.GetAbilityDamageType(self)
end

function antimage_counterspell_custom:GetBehavior()
    local caster = self:GetCaster()
    if(caster:HasTalent("talent_antimage_counterspell_toggle")) then
        return DOTA_ABILITY_BEHAVIOR_TOGGLE
    end
    return self.BaseClass.GetBehavior(self)
end

function antimage_counterspell_custom:OnToggle()
    local caster = self:GetCaster()

    if self:GetToggleState() then
        caster:AddNewModifier(caster, self, "modifier_antimage_counterspell_custom_aura_burn", {duration = -1})
    else
        caster:RemoveModifierByName("modifier_antimage_counterspell_custom_aura_burn")
    end
end

function antimage_counterspell_custom:OnAbilityUpgrade(upgradeAbility)
	local abilityName = upgradeAbility:GetAbilityName()
	if(abilityName ~= "talent_antimage_counterspell_reduces_magical_resistance"
	and abilityName ~= "antimage_counterspell_custom") then
		return
	end
	local caster = self:GetCaster()
	if(caster:IsAlive()) then
		self:ApplyPermamentBuffTalentEffect(caster)
	else
		Timers:CreateTimer(1, function()
			if(caster:IsAlive() == false) then
				return 1
			end
			self:ApplyPermamentBuffTalentEffect(caster)
		end)
	end
end

function antimage_counterspell_custom:ApplyPermamentBuffTalentEffect(caster)
	if(self:GetLevel() > 0 and caster:HasTalent("talent_antimage_counterspell_reduces_magical_resistance")) then
		caster:AddNewModifier(caster, self, "modifier_antimage_counterspell_custom_aura_reduces_magical_resistance", {duration = -1})
	end
end

modifier_antimage_counterspell_custom = class({
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
	DeclareFunctions = function() 
		return 
		{
			MODIFIER_PROPERTY_MAGICAL_RESISTANCE_BONUS
		} 
	end,
    GetModifierMagicalResistanceBonus = function(self)
        return self.magicResistance
    end
})

function modifier_antimage_counterspell_custom:OnCreated()
	self:OnRefresh()
end

function modifier_antimage_counterspell_custom:OnRefresh()
	self.ability = self:GetAbility() or self.ability
	if (not self.ability or self.ability:IsNull()) then 
		return 
	end
    self.magicResistance = self.ability:GetSpecialValueFor("magic_resistance")
end

modifier_antimage_counterspell_custom_aura_reduces_magical_resistance = class({
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
        return "modifier_antimage_counterspell_custom_reduces_magical_resistance_enemy_debuff" 
    end,
	GetAuraDuration = function()
		return 0
	end
})

function modifier_antimage_counterspell_custom_aura_reduces_magical_resistance:OnCreated() 
    self.parent = self:GetParent()
    self:OnRefresh()
    if (not IsServer()) then
        return
    end
    self.targetTeam = self.ability:GetAbilityTargetTeam()
    self.targetType = self.ability:GetAbilityTargetType()
    self.targetFlags = self.ability:GetAbilityTargetFlags()
end

function modifier_antimage_counterspell_custom_aura_reduces_magical_resistance:OnRefresh()
	self.ability = self:GetAbility()
    if(not self.ability or self.ability:IsNull()) then
        return
    end
	self.radius = self.ability:GetCastRange()
end

modifier_antimage_counterspell_custom_reduces_magical_resistance_enemy_debuff = class({
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
			MODIFIER_PROPERTY_MAGICAL_RESISTANCE_BONUS
		} 
	end,
    GetModifierMagicalResistanceBonus = function(self)
        return self.magicResistance
    end
})

function modifier_antimage_counterspell_custom_reduces_magical_resistance_enemy_debuff:OnCreated()
	self:OnRefresh()
end

function modifier_antimage_counterspell_custom_reduces_magical_resistance_enemy_debuff:OnRefresh()
	self.ability = self:GetAbility() or self.ability
	if (not self.ability or self.ability:IsNull()) then 
		return 
	end
    self.magicResistance = -1 * self.ability:GetSpecialValueFor("magic_resistance")
end

modifier_antimage_counterspell_custom_aura_burn = class({
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
        return "modifier_antimage_counterspell_custom_enemy_debuff" 
    end,
	GetAuraDuration = function()
		return 0
	end,
    GetEffectName = function()
        return "particles/custom/units/heroes/antimage/counterspell/antimage_counterspell_owner_talent.vpcf"
    end
})

function modifier_antimage_counterspell_custom_aura_burn:OnCreated()
	self:OnRefresh()
    if(not IsServer()) then
        return
    end
    self.targetTeam = self.ability:GetAbilityTargetTeam()
    self.targetType = self.ability:GetAbilityTargetType()
    self.targetFlags = self.ability:GetAbilityTargetFlags()
end

function modifier_antimage_counterspell_custom_aura_burn:OnRefresh()
	self.ability = self:GetAbility()
    if(not self.ability or self.ability:IsNull()) then
        return
    end
	self.radius = self.ability:GetSpecialValueFor("talent_radius")
end

modifier_antimage_counterspell_custom_enemy_debuff = class({
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
	end
})

function modifier_antimage_counterspell_custom_enemy_debuff:OnCreated()
    self.ability = self:GetAbility()
    self.parent = self:GetParent()
    if(not self.ability) then
        self:Destroy()
        return
    end
	self:OnRefresh()
    if(not IsServer()) then
        return
    end
    local pfx = ParticleManager:CreateParticle("particles/custom/units/heroes/antimage/counterspell/antimage_counterspell_talent.vpcf", PATTACH_ABSORIGIN_FOLLOW, self:GetParent())
    ParticleManager:SetParticleControlEnt(pfx, 1, self.ability:GetCaster(), PATTACH_ABSORIGIN_FOLLOW, "attach_hitloc", Vector(0, 0, 0), true)
    self:AddParticle(pfx, false, false, 1, false, false)
end

function modifier_antimage_counterspell_custom_enemy_debuff:OnRefresh()
    self.ability = self:GetAbility()
    self.caster = self:GetCaster()
    if(not self.ability or self.ability:IsNull()) then
		self:Destroy()
        return
    end
    self.damageAgilityPct = self.ability:GetSpecialValueFor("talent_damage_agility_pct")/100
    self.damageFromMissingMana = self.ability:GetSpecialValueFor("talent_damage_from_missing_mana")/100
    self.tickInterval = self.ability:GetSpecialValueFor("talent_tick_interval")
    if(not IsServer()) then
        return
    end
    self.damageTable = self.damageTable or {
        attacker = self.caster, 
        victim = self.parent,  
        damage = 0,
        ability = self.ability, 
        damage_type = self.ability:GetAbilityDamageType(),
        damage_flags = DOTA_DAMAGE_FLAG_NO_SPELL_AMPLIFICATION
    }
    self.damageTable.caster = self.caster
    self:StartIntervalThink(self.tickInterval)
end

function modifier_antimage_counterspell_custom_enemy_debuff:OnIntervalThink()
    local missingMana = self.parent:GetMaxMana() - self.parent:GetMana()
    local damage = (missingMana * self.damageFromMissingMana + (self.caster:GetAgility() * self.damageAgilityPct))
    self.damageTable.damage = damage
    ApplyDamage(self.damageTable)
end

LinkLuaModifier( "modifier_antimage_counterspell_custom", "abilities/heroes/antimage/counterspell", LUA_MODIFIER_MOTION_NONE )
LinkLuaModifier( "modifier_antimage_counterspell_custom_aura_burn", "abilities/heroes/antimage/counterspell", LUA_MODIFIER_MOTION_NONE )
LinkLuaModifier( "modifier_antimage_counterspell_custom_enemy_debuff", "abilities/heroes/antimage/counterspell", LUA_MODIFIER_MOTION_NONE )
LinkLuaModifier( "modifier_antimage_counterspell_custom_aura_reduces_magical_resistance", "abilities/heroes/antimage/counterspell", LUA_MODIFIER_MOTION_NONE )
LinkLuaModifier( "modifier_antimage_counterspell_custom_reduces_magical_resistance_enemy_debuff", "abilities/heroes/antimage/counterspell", LUA_MODIFIER_MOTION_NONE )