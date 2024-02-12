axe_battle_hunger_custom = class({
    GetIntrinsicModifierName = function(self) 
        if(self:GetCaster():HasTalent("talent_axe_battle_hunger_passive")) then
		    return "modifier_axe_battle_hunger_custom_aura" 
        end
	end,
	GetAOERadius = function(self) 
		return self:GetSpecialValueFor("radius") 
	end
})

function axe_battle_hunger_custom:Precache(context)
    PrecacheResource("particle", "particles/units/heroes/hero_axe/axe_battle_hunger.vpcf", context)
    PrecacheResource("particle", "particles/econ/items/axe/axe_cinder/axe_cinder_battle_hunger_flames.vpcf", context)
end

function axe_battle_hunger_custom:GetBehavior()
    local caster = self:GetCaster()
    if(caster:HasTalent("talent_axe_battle_hunger_passive")) then
        return DOTA_ABILITY_BEHAVIOR_PASSIVE
    end
    return self.BaseClass.GetBehavior(self)
end

function axe_battle_hunger_custom:GetCastRange(vLocation,hTarget)
    local caster = self:GetCaster()
    if(caster:HasTalent("talent_axe_battle_hunger_passive")) then
        return 0
    end
    return self.BaseClass.GetCastRange(self, vLocation, hTarget)
end

function axe_battle_hunger_custom:GetManaCost(iLevel)
    local caster = self:GetCaster()
    if(caster:HasTalent("talent_axe_battle_hunger_passive")) then
        return 0
    end
    return self.BaseClass.GetManaCost(self, iLevel)
end

function axe_battle_hunger_custom:GetCooldown(iLevel)
    local caster = self:GetCaster()
    if(caster:HasTalent("talent_axe_battle_hunger_passive")) then
        return 0
    end
    return self.BaseClass.GetCooldown(self, iLevel)
end

function axe_battle_hunger_custom:OnSpellStart()
    local caster = self:GetCaster()
    local point = self:GetCursorPosition()
    local radius =  self:GetSpecialValueFor("radius")
    local duration = self:GetSpecialValueFor("duration")

    local enemies = FindUnitsInRadius(
		caster:GetTeamNumber(),
		point,
		nil,
		radius,
		self:GetAbilityTargetTeam(),
		self:GetAbilityTargetType(),
		self:GetAbilityTargetFlags(),
		FIND_ANY_ORDER,
		false
	)
    
    for _, enemy in ipairs(enemies) do 
        if (caster:HasShard()) then 
            caster:AddNewModifier(caster,self,"modifier_axe_battle_hunger_custom_buff",{duration = duration})
            local modifier = caster:FindModifierByName( "modifier_axe_battle_hunger_custom_buff" )
            if modifier and not enemy:HasModifier("modifier_axe_battle_hunger_custom_debuff") then
                modifier:IncrementStackCount()
            end
        end
        enemy:AddNewModifier(caster, self, "modifier_axe_battle_hunger_custom_debuff", {duration = duration})
    end

    local sound_cast = "Hero_Axe.Battle_Hunger"
    EmitSoundOn( sound_cast, caster )
end

modifier_axe_battle_hunger_custom_aura = class({
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
        return "modifier_axe_battle_hunger_custom_debuff" 
    end,
	GetAuraDuration = function()
		return 0
	end
})

function modifier_axe_battle_hunger_custom_aura:OnCreated()
	self.parent = self:GetParent()
    if(not IsServer()) then
        return
    end
    self.ability = self:GetAbility()
    self.targetTeam = self.ability:GetAbilityTargetTeam()
    self.targetType = self.ability:GetAbilityTargetType()
    self.targetFlags = self.ability:GetAbilityTargetFlags()
    self.radius = self.ability:GetSpecialValueFor("aura_radius")
    self.parent:AddNewModifier(self.parent,self.ability,"modifier_axe_battle_hunger_custom_buff",{duration = -1})
end

modifier_axe_battle_hunger_custom_buff = class({
    IsHidden = function() 
		return false 
	end,
	IsPurgable = function() 
		return true 
	end,
	IsPurgeException = function()
		return true
	end,
	IsDebuff = function()
		return false
	end,
	DeclareFunctions = function() 
		return 
		{
			MODIFIER_PROPERTY_MOVESPEED_BONUS_PERCENTAGE,
            MODIFIER_PROPERTY_PHYSICAL_ARMOR_BONUS
		} 
	end
})

function modifier_axe_battle_hunger_custom_buff:OnCreated()	
    self.ability = self:GetAbility()
end


function modifier_axe_battle_hunger_custom_buff:GetModifierMoveSpeedBonus_Percentage()
    return self.ability:GetSpecialValueFor("bonus_speed_per_unit") * self:GetStackCount()
end

function modifier_axe_battle_hunger_custom_buff:GetModifierPhysicalArmorBonus()
    return self.ability:GetSpecialValueFor("bonus_armor_per_unit") * self:GetStackCount()
end

modifier_axe_battle_hunger_custom_debuff = class({
    IsHidden = function() 
		return false 
	end,
	IsPurgable = function() 
		return true 
	end,
	IsPurgeException = function()
		return true
	end,
	IsDebuff = function()
		return true
	end,
	DeclareFunctions = function() 
		return 
		{
			MODIFIER_PROPERTY_MOVESPEED_BONUS_PERCENTAGE,
            MODIFIER_PROPERTY_DAMAGEOUTGOING_PERCENTAGE
		} 
	end,
	GetModifierMoveSpeedBonus_Percentage = function(self) 
		return self.slow 
	end,
	GetModifierDamageOutgoing_Percentage = function(self) 
		return self.damgeReducion
	end
})

function modifier_axe_battle_hunger_custom_debuff:OnCreated()	
    self.parent = self:GetParent()
    self.caster = self:GetCaster()
    self:OnRefresh()
	if(not IsServer()) then
		return
	end
    self:StartIntervalThink(self.damageInterval)
    self:PlayEffects()
    self.damageTable = {
		victim = self.parent,
		attacker = self.caster,
		ability = self.ability,
		damage_type = self.ability:GetAbilityDamageType(),
		damage_flags = DOTA_DAMAGE_FLAG_NONE
	}
    if (self:GetCaster():HasTalent("talent_axe_battle_hunger_passive")) then
        local modifier = self.caster:FindModifierByName( "modifier_axe_battle_hunger_custom_buff" )
        if modifier then
            modifier:IncrementStackCount()
        end
    end
end

function modifier_axe_battle_hunger_custom_debuff:OnRefresh()
	if(not IsServer()) then
		return
	end
	self.ability = self:GetAbility() or self.ability
	if (not self.ability or self.ability:IsNull()) then 
		return 
	end
    self.slow = self.ability:GetSpecialValueFor("slow")
    self.damage = self.ability:GetSpecialValueFor("damage_per_second")
    self.multiplier = self.ability:GetSpecialValueFor("multiplier")/100
    self.damageInterval = self.ability:GetSpecialValueFor("damage_interval")
    self.damgeReducion = 0

    if(self.caster:HasTalent("talent_axe_battle_hunger_damage_reduction")) then
        self.damgeReducion = -1 * self.ability:GetSpecialValueFor("damage_reduction")
    end
end

function modifier_axe_battle_hunger_custom_debuff:OnDestroy()
	if IsServer() then
		local modifier = self.caster:FindModifierByName( "modifier_axe_battle_hunger_custom_buff" )
		if modifier then
			modifier:DecrementStackCount()
		end
	end
end

function modifier_axe_battle_hunger_custom_debuff:OnIntervalThink()
    local strength = self.caster:GetStrength()
    local armor = self.caster:GetPhysicalArmorBaseValue()
    local damage = self.damage + self.multiplier * (strength + armor)
	self.damageTable.damage = damage * (self.parent:GetSpellAmplification(false) + 1)
	ApplyDamage(self.damageTable)
end

function modifier_axe_battle_hunger_custom_debuff:PlayEffects()
	local particle_cast = "particles/units/heroes/hero_axe/axe_battle_hunger.vpcf"
    local effect_cast = ParticleManager:CreateParticle( particle_cast, PATTACH_OVERHEAD_FOLLOW, self.parent )
    self:AddParticle(effect_cast, false, false, -1, false, true)

    local particle_cast = "particles/econ/items/axe/axe_cinder/axe_cinder_battle_hunger_flames.vpcf"
    local effect_cast = ParticleManager:CreateParticle( particle_cast, PATTACH_ABSORIGIN_FOLLOW, self.parent )
    self:AddParticle(effect_cast, false, false, -1, false, true)
end

LinkLuaModifier( "modifier_axe_battle_hunger_custom_buff", "abilities/heroes/axe/battle_hunger", LUA_MODIFIER_MOTION_NONE )
LinkLuaModifier( "modifier_axe_battle_hunger_custom_debuff", "abilities/heroes/axe/battle_hunger", LUA_MODIFIER_MOTION_NONE )
LinkLuaModifier( "modifier_axe_battle_hunger_custom_aura", "abilities/heroes/axe/battle_hunger", LUA_MODIFIER_MOTION_NONE )