axe_berserkers_call_custom = class({
    GetIntrinsicModifierName = function(self) 
        if(self:GetCaster():HasTalent("talent_axe_berserkers_call_passive")) then
		    return "modifier_axe_berserkers_call_custom_buff" 
        end
	end,
	GetRadius = function(self) 
		return self:GetSpecialValueFor("radius") 
	end
})

function axe_berserkers_call_custom:Precache(context)
    PrecacheResource("particle", "particles/status_fx/status_effect_beserkers_call.vpcf", context)
end

function axe_berserkers_call_custom:GetBehavior()
    local caster = self:GetCaster()
    if(caster:HasTalent("talent_axe_berserkers_call_passive")) then
        return DOTA_ABILITY_BEHAVIOR_PASSIVE
    end
    return self.BaseClass.GetBehavior(self)
end

function axe_berserkers_call_custom:GetCastRange(vLocation,hTarget)
    local caster = self:GetCaster()
    if(caster:HasTalent("talent_axe_berserkers_call_passive")) then
        return 0
    end
    return self.BaseClass.GetCastRange(self, vLocation, hTarget)
end

function axe_berserkers_call_custom:GetManaCost(iLevel)
    local caster = self:GetCaster()
    if(caster:HasTalent("talent_axe_berserkers_call_passive")) then
        return 0
    end
    return self.BaseClass.GetManaCost(self, iLevel)
end

function axe_berserkers_call_custom:GetCooldown(iLevel)
    local caster = self:GetCaster()
    if(caster:HasTalent("talent_axe_berserkers_call_passive")) then
        return 0
    end
    return self.BaseClass.GetCooldown(self, iLevel)
end

function axe_berserkers_call_custom:OnSpellStart()
    local caster = self:GetCaster()
    local point = caster:GetAbsOrigin()
    caster:AddNewModifier(caster, self, "modifier_axe_berserkers_call_custom_buff", {duration = self:GetSpecialValueFor("duration")})

    local sound_cast = "Hero_Axe.Berserkers_Call"
    EmitSoundOn( sound_cast, caster )
end

modifier_axe_berserkers_call_custom_buff = class({
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
		return 
		{
			MODIFIER_PROPERTY_PHYSICAL_ARMOR_BONUS,
            MODIFIER_EVENT_ON_ATTACKED
		} 
	end,
	GetModifierPhysicalArmorBonus = function(self) 
		return self:GetAbility():GetSpecialValueFor("bonus_armor")
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
        return "modifier_axe_berserkers_call_custom_debuff" 
    end,
	GetAuraDuration = function()
		return 0
	end
})

function modifier_axe_berserkers_call_custom_buff:OnCreated()	
    self.parent = self:GetParent()
    self:OnRefresh()
    if(not IsServer()) then
		return
	end
    self.damageTable = {
        attacker = self.parent,
        damage_type = self.ability:GetAbilityDamageType(),
        ability = self.ability,
        damage_flags = DOTA_DAMAGE_FLAG_NO_SPELL_AMPLIFICATION + DOTA_DAMAGE_FLAG_REFLECTION,
    }
end

function modifier_axe_berserkers_call_custom_buff:OnRefresh()
	if(not IsServer()) then
		return
	end
	self.ability = self:GetAbility() or self.ability
	if (not self.ability or self.ability:IsNull()) then 
		return 
	end
    self.returnDamagePct = self.ability:GetSpecialValueFor("reflection_pct")/100
    self.targetTeam = self.ability:GetAbilityTargetTeam()
    self.targetType = self.ability:GetAbilityTargetType()
    self.targetFlags = self.ability:GetAbilityTargetFlags()

    if (self.parent:HasTalent("talent_axe_berserkers_call_passive")) then
        self.radius = self.ability:GetSpecialValueFor("aura_radius")
    else
        self.radius =  self.ability:GetSpecialValueFor("radius")
    end

end

function modifier_axe_berserkers_call_custom_buff:OnAttacked(kv)
	if (kv.target ~= self.parent) then
    	return 
    end

    if(UnitFilter(
        kv.attacker, 
        self.targetTeam, 
        self.targetType, 
        self.targetFlags, 
        self.parent:GetTeamNumber()
    ) ~= UF_SUCCESS) then
		return
	end
    
	self.damageTable.victim = kv.attacker
	self.damageTable.damage = kv.attacker:GetBaseDamageMax() * self.returnDamagePct
	ApplyDamage( self.damageTable )
end

modifier_axe_berserkers_call_custom_debuff = class({
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

function modifier_axe_berserkers_call_custom_debuff:OnCreated()	
	if(not IsServer()) then
		return
	end
    self.parent = self:GetParent()
    self.caster = self:GetCaster()
    self.parent:MoveToTargetToAttack(self.caster)
    self.parent:SetForceAttackTarget(self.caster)
    self.isRestricted = true
end

function modifier_axe_berserkers_call_custom_debuff:OnDestroy()
    if(not IsServer()) then
        return
    end
    self.parent:SetForceAttackTarget(nil)
end

LinkLuaModifier( "modifier_axe_berserkers_call_custom_buff", "abilities/heroes/axe/berserkers_call", LUA_MODIFIER_MOTION_NONE )
LinkLuaModifier( "modifier_axe_berserkers_call_custom_debuff", "abilities/heroes/axe/berserkers_call", LUA_MODIFIER_MOTION_NONE )