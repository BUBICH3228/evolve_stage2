axe_counter_helix_custom = class({
	GetIntrinsicModifierName = function() 
		return "modifier_axe_counter_helix_custom" 
	end,
	GetRadius = function(self)
		return self:GetSpecialValueFor("radius") 
	end
})

function axe_counter_helix_custom:Precache(context)
    PrecacheResource("particle", "particles/units/heroes/hero_axe/axe_counterhelix.vpcf", context)
end

modifier_axe_counter_helix_custom = class({
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
			MODIFIER_EVENT_ON_ATTACK_LANDED
		} 
	end
})

function modifier_axe_counter_helix_custom:OnCreated()
	self:OnRefresh()
	self.parent = self:GetParent()
	if(not IsServer()) then
		return
	end
    self.targetTeam = self.ability:GetAbilityTargetTeam()
    self.targetType = self.ability:GetAbilityTargetType()
    self.targetFlags = self.ability:GetAbilityTargetFlags()

	self.damageTable = {
        attacker = self.parent,
        damage_type = self.ability:GetAbilityDamageType(),
        ability = self.ability,
        damage_flags = DOTA_DAMAGE_FLAG_NO_SPELL_AMPLIFICATION,
    }
end

function modifier_axe_counter_helix_custom:OnRefresh()
	if(not IsServer()) then
		return
	end
	self.ability = self:GetAbility() or self.ability
	if (not self.ability or self.ability:IsNull()) then 
		return 
	end
    self.radius = self.ability:GetRadius()
    self.chance = self.ability:GetSpecialValueFor("trigger_chance")
	self.stackMax = self.ability:GetSpecialValueFor("stack_max")
	self.duration = self.ability:GetSpecialValueFor("duration")
end

function modifier_axe_counter_helix_custom:OnAttackLanded(kv)
	if (not self.ability:IsCooldownReady()) then
		return
	end

    if(self.parent:HasTalent("talent_axe_counter_helix_your_attacks")) then
        if ( (kv.attacker ~= self.parent or kv.attacker:IsIllusion()) and kv.target ~= self.parent) then
			return
		end
	else
		if (kv.target ~= self.parent) then
        	return 
    	end
    end

	if (not kv.attacker == self.parent) then
		if(UnitFilter(
        kv.attacker, 
        self.targetTeam, 
        self.targetType, 
        self.targetFlags, 
        self.parent:GetTeamNumber()
		) ~= UF_SUCCESS) then
			return
		end
	end
	
	if self.parent:PassivesDisabled() then 
        return
    end

	if (RollPseudoRandomPercentage(self.chance,self.ability) == false) then
		return
	end

	local enemies = FindUnitsInRadius(
		self.parent:GetTeamNumber(),
		self.parent:GetOrigin(),
		nil,
		self.radius,
		self.targetTeam,
		self.targetType,
		self.targetFlags,
		0,
		false
	)

    local multiplier = self.ability:GetSpecialValueFor("multiplier")/100
    local pureDamage = self.ability:GetSpecialValueFor("pure_damage")
    local strength = self.parent:GetStrength()

    local damage = (pureDamage + multiplier * strength) * (self.parent:GetSpellAmplification(false) + 1)

	for _,enemy in pairs(enemies) do
		self.damageTable.victim = enemy
		self.damageTable.damage = damage
		ApplyDamage( self.damageTable )
		if (self.parent:HasScepter()) then
			enemy:AddNewModifier(self.parent,self.ability,"modifier_axe_counter_helix_custom_debuff",{duration = self.duration})
			local stack = math.min(enemy:GetModifierStackCount("modifier_axe_counter_helix_custom_debuff",self.ability) + 1,self.stackMax)
			enemy:SetModifierStackCount("modifier_axe_counter_helix_custom_debuff",self.ability,stack)
		end
	end

	self.ability:UseResources( false,false, false, true )

	self:PlayEffects()
end

function modifier_axe_counter_helix_custom:PlayEffects()
	local particle_cast = "particles/units/heroes/hero_axe/axe_counterhelix.vpcf"
	local sound_cast = "Hero_Axe.CounterHelix"

    self.parent:StartGesture(ACT_DOTA_CAST_ABILITY_3)
	local effect_cast = ParticleManager:CreateParticle( particle_cast, PATTACH_ABSORIGIN_FOLLOW, self.parent )
	ParticleManager:ReleaseParticleIndex( effect_cast )
    
	EmitSoundOn( sound_cast, self.parent )
end

modifier_axe_counter_helix_custom_debuff = class({
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
			MODIFIER_PROPERTY_INCOMING_DAMAGE_PERCENTAGE
		} 
	end
})

function modifier_axe_counter_helix_custom_debuff:OnCreated(kv)	
    self.ability = self:GetAbility()
end


function modifier_axe_counter_helix_custom_debuff:GetModifierIncomingDamage_Percentage()
	return self.ability:GetSpecialValueFor("incoming_damage_per_stack") * self:GetStackCount()
end

LinkLuaModifier( "modifier_axe_counter_helix_custom", "abilities/heroes/axe/counter_helix", LUA_MODIFIER_MOTION_NONE )
LinkLuaModifier( "modifier_axe_counter_helix_custom_debuff", "abilities/heroes/axe/counter_helix", LUA_MODIFIER_MOTION_NONE )