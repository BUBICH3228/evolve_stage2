antimage_mana_break_custom = class({
	GetIntrinsicModifierName = function(self)
        if (not self:GetToggleState()) then
		    return "modifier_antimage_mana_break_custom" 
        end
	end,
    GetCastRange = function(self)
		return self:GetSpecialValueFor("talent_radius")
	end
})

function antimage_mana_break_custom:Precache(context)
    PrecacheResource("particle", "particles/generic_gameplay/generic_manaburn.vpcf", context)
    PrecacheResource("particle", "particles/units/heroes/hero_antimage/antimage_manabreak_slow_body_flash.vpcf", context)
    PrecacheResource("particle", "particles/custom/units/heroes/antimage/mana_break/antimage_mana_break_talent.vpcf", context)
end

function antimage_mana_break_custom:GetBehavior()
    local caster = self:GetCaster()
    if(caster:HasTalent("talent_antimage_mana_break_toggle")) then
        return DOTA_ABILITY_BEHAVIOR_TOGGLE
    end
    return self.BaseClass.GetBehavior(self)
end

function antimage_mana_break_custom:OnToggle()
    if(not IsServer()) then
        return
    end
    local caster = self:GetCaster()

    if self:GetToggleState() then
        caster:AddNewModifier(caster,self,"modifier_antimage_mana_break_custom_buff",{ duration = -1 })
		caster:RemoveModifierByName("modifier_antimage_mana_break_custom")
	else
        caster:AddNewModifier(caster, self, "modifier_antimage_mana_break_custom", { duration = -1 })
        caster:RemoveModifierByName("modifier_antimage_mana_break_custom_buff")
	end
end

modifier_antimage_mana_break_custom = class({
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
			MODIFIER_PROPERTY_PROCATTACK_BONUS_DAMAGE_PHYSICAL
		} 
	end
})

function modifier_antimage_mana_break_custom:OnCreated()
	self:OnRefresh()
	self.parent = self:GetParent()
	if(not IsServer()) then
		return
	end
    self.targetTeam = self.ability:GetAbilityTargetTeam()
    self.targetType = self.ability:GetAbilityTargetType()
    self.targetFlags = self.ability:GetAbilityTargetFlags()
end

function modifier_antimage_mana_break_custom:OnRefresh()
	self.ability = self:GetAbility() or self.ability
	if (not self.ability or self.ability:IsNull()) then 
		return 
	end
    self.illusionPercentage = self.ability:GetSpecialValueFor("illusion_percentage")/100
	self.burningManaPerHit = self.ability:GetSpecialValueFor("mana_per_hit")
    self.burningManaPerHitPct = self.ability:GetSpecialValueFor("mana_per_hit_pct")/100
	self.pctDamagePerBurn = self.ability:GetSpecialValueFor("percent_damage_per_burn")/100
    self.duration = self.ability:GetSpecialValueFor("slow_duration")
	self.damagePctPerMaxMana = self.ability:GetSpecialValueFor("damage_pct_per_max_mana")/100
end

function modifier_antimage_mana_break_custom:GetModifierProcAttack_BonusDamage_Physical(kv)
    if self.parent:PassivesDisabled() then 
        return
    end

    if (kv.attacker ~= self.parent) then
        return 
    end

    if(UnitFilter(
        kv.target, 
        self.targetTeam, 
        self.targetType, 
        self.targetFlags, 
        self.parent:GetTeamNumber()
    ) ~= UF_SUCCESS) then
		return
	end
    
    local manaBurn = self.burningManaPerHit + kv.target:GetMaxMana() * self.burningManaPerHitPct 
    local newManaBurn =  math.min( kv.target:GetMana(), manaBurn )
    if (kv.attacker:IsIllusion()) then
        newManaBurn = newManaBurn * self.illusionPercentage
    end

    if (kv.target:GetMana() < manaBurn) then
        if (not kv.target:HasModifier("modifier_antimage_mana_break_custom_debuff")) then
            self.ability:PlayEffects2( kv.target )
        end
        kv.target:AddNewModifier(self.parent,self.ability,"modifier_antimage_mana_break_custom_debuff",{duration = self.duration})
    end

	kv.target:Script_ReduceMana( newManaBurn , nil)
    
	self.ability:PlayEffects1( kv.target )

	local totalDamage = newManaBurn * self.pctDamagePerBurn

	if ( self.parent:HasTalent("talent_antimage_mana_break_damage_max_mana")) then
		totalDamage = kv.target:GetMaxMana() * self.damagePctPerMaxMana
	end

	return totalDamage
end

function antimage_mana_break_custom:PlayEffects1(target)
    local particle_cast = "particles/generic_gameplay/generic_manaburn.vpcf"
	local sound_cast = "Hero_Antimage.ManaBreak"

	local effect_cast = ParticleManager:CreateParticle( particle_cast, PATTACH_ABSORIGIN, target )
	ParticleManager:ReleaseParticleIndex( effect_cast )
	EmitSoundOn( sound_cast, target )
end

function antimage_mana_break_custom:PlayEffects2(target)
    local particle_cast = "particles/units/heroes/hero_antimage/antimage_manabreak_slow_body_flash.vpcf"
	local sound_cast = "Hero_Antimage.ManaBreak"

	local effect_cast = ParticleManager:CreateParticle( particle_cast, PATTACH_ABSORIGIN, target )
	ParticleManager:ReleaseParticleIndex( effect_cast )
	EmitSoundOn( sound_cast, target )
end

modifier_antimage_mana_break_custom_debuff = class({
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
			MODIFIER_PROPERTY_MOVESPEED_BONUS_PERCENTAGE  
		} 
	end,
    GetModifierMoveSpeedBonus_Percentage = function(self)
        return self.slow
    end
})

function modifier_antimage_mana_break_custom_debuff:OnCreated()
	self:OnRefresh()
end

function modifier_antimage_mana_break_custom_debuff:OnRefresh()
	self.ability = self:GetAbility() or self.ability
	if (not self.ability or self.ability:IsNull()) then 
		return 
	end
    self.slow = -1 * self.ability:GetSpecialValueFor("move_slow")
end

modifier_antimage_mana_break_custom_buff = class({
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
    GetEffectName = function()
        return "particles/custom/units/heroes/antimage/mana_break/antimage_mana_break_talent.vpcf"
    end
})

function modifier_antimage_mana_break_custom_buff:OnCreated()
	self:OnRefresh()
    self.parent = self:GetParent()
    if (not IsServer()) then
        return
    end
    self.targetTeam = self.ability:GetAbilityTargetTeam()
    self.targetType = self.ability:GetAbilityTargetType()
    self.targetFlags = self.ability:GetAbilityTargetFlags()

    self.damageTable = {
		attacker = self.parent,
		ability = self.ability,
		damage_type = self.ability:GetAbilityDamageType(),
		damage_flags = DOTA_DAMAGE_FLAG_NO_SPELL_AMPLIFICATION
	}
	
    self:StartIntervalThink(self.tickInterval)
	
end

function modifier_antimage_mana_break_custom_buff:OnRefresh()
	self.ability = self:GetAbility() or self.ability
	if (not self.ability or self.ability:IsNull()) then 
		return 
	end
    self.radius = self.ability:GetCastRange()
    self.illusionPercentage = self.ability:GetSpecialValueFor("illusion_percentage")/100
    self.burningManaPerHit = self.ability:GetSpecialValueFor("mana_per_hit")
    self.burningManaPerHitPct = self.ability:GetSpecialValueFor("mana_per_hit_pct")/100
	self.pctDamagePerBurn = self.ability:GetSpecialValueFor("percent_damage_per_burn")/100
    self.talentManaBurn = self.ability:GetSpecialValueFor("talent_burn_pct")/100
	self.tickInterval = self.ability:GetSpecialValueFor("talent_tick_interval")
	self.duration = self.ability:GetSpecialValueFor("slow_duration")
	self.damagePctPerMaxMana = self.ability:GetSpecialValueFor("damage_pct_per_max_mana")/100
end

function modifier_antimage_mana_break_custom_buff:OnIntervalThink()
    local enemies = FindUnitsInRadius(
		self.parent:GetTeamNumber(),
		self.parent:GetAbsOrigin(),
		nil,
		self.radius,
		self.targetTeam,
		self.targetType,
		self.targetFlags,
		FIND_ANY_ORDER,
		false
	)

    for _,enemy in pairs(enemies) do
        local manaBurn = self.burningManaPerHit + enemy:GetMaxMana() * self.burningManaPerHitPct * self.talentManaBurn
        local newManaBurn = math.min( enemy:GetMana(), manaBurn ) 
        if (self.parent:IsIllusion()) then
            newManaBurn = newManaBurn * self.illusionPercentage
        end
        local damage = newManaBurn

		local totalDamage = damage * self.pctDamagePerBurn
		if ( self.parent:HasTalent("talent_antimage_mana_break_damage_max_mana")) then
			totalDamage = enemy:GetMaxMana() * self.damagePctPerMaxMana
		end
        self.damageTable.damage = totalDamage 
        self.damageTable.victim = enemy
        ApplyDamage(self.damageTable)

        if (enemy:GetMana() < manaBurn) then
            if (not enemy:HasModifier("modifier_antimage_mana_break_custom_debuff")) then
                self.ability:PlayEffects2( enemy )
            end
            enemy:AddNewModifier(self.parent,self.ability,"modifier_antimage_mana_break_custom_debuff",{duration = self.duration})
        end

        enemy:Script_ReduceMana(newManaBurn,nil)
        self.ability:PlayEffects1( enemy )
    end
end

LinkLuaModifier( "modifier_antimage_mana_break_custom", "abilities/heroes/antimage/mana_break", LUA_MODIFIER_MOTION_NONE )
LinkLuaModifier( "modifier_antimage_mana_break_custom_buff", "abilities/heroes/antimage/mana_break", LUA_MODIFIER_MOTION_NONE )
LinkLuaModifier( "modifier_antimage_mana_break_custom_debuff", "abilities/heroes/antimage/mana_break", LUA_MODIFIER_MOTION_NONE )