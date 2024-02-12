axe_culling_blade_custom = class({
	GetIntrinsicModifierName = function() 
		return "modifier_axe_culling_blade_custom" 
    end
})

function axe_culling_blade_custom:Precache(context)
    PrecacheResource("particle", "particles/units/heroes/hero_axe/axe_culling_blade_kill.vpcf", context)
	PrecacheResource("particle", "particles/units/heroes/hero_axe/axe_culling_blade.vpcf", context)
end

modifier_axe_culling_blade_custom = class({
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
    RemoveOnDeath = function()
		return false
	end,
	DeclareFunctions = function() 
		return 
		{
			MODIFIER_EVENT_ON_ATTACK_LANDED
		} 
	end
})

function modifier_axe_culling_blade_custom:OnCreated()
	self:OnRefresh()
	self.parent = self:GetParent()
	if(not IsServer()) then
		return
	end
    self.targetTeam = self.ability:GetAbilityTargetTeam()
    self.targetType = self.ability:GetAbilityTargetType()
    self.targetFlags = self.ability:GetAbilityTargetFlags()
    self.parent:AddNewModifier(self.parent, self.ability, "modifier_axe_culling_blade_custom_buff", {duration = -1})

	self.damageTable = {
        attacker = self.parent,
        damage_type = self.ability:GetAbilityDamageType(),
        ability = self.ability,
        damage_flags = DOTA_DAMAGE_FLAG_NO_SPELL_AMPLIFICATION,
    }
end

function modifier_axe_culling_blade_custom:OnRefresh()
    if(not IsServer()) then
		return
	end
	self.ability = self:GetAbility() or self.ability
	if (not self.ability or self.ability:IsNull()) then 
		return 
	end
    self.chance = self.ability:GetSpecialValueFor("trigger_chance")
	self.stackPerCreep = self.ability:GetSpecialValueFor("stack_per_creep")
	self.stackPerBoss = self.ability:GetSpecialValueFor("stack_per_boss")
end

function modifier_axe_culling_blade_custom:OnAttackLanded(kv)
	if (not self.ability:IsCooldownReady()) then
		return
	end

	if self.parent:PassivesDisabled() then 
        return
    end

    if (kv.attacker ~= self.parent) then
        return 
    end

	if (kv.attacker:IsIllusion()) then
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

	if RandomInt(1,100) > self.chance then 
        return 
    end

    local success = false

    if (kv.target:IsBoss()) then
        local multiplier = self.ability:GetSpecialValueFor("multiplier")/100
        local pureDamage = self.ability:GetSpecialValueFor("pure_damage")
        local armor = self.parent:GetPhysicalArmorBaseValue()
        local strength = self.parent:GetStrength()

        local damage = (pureDamage + multiplier * (strength + armor)) * (self.parent:GetSpellAmplification(false) + 1)
        self.damageTable.victim = kv.target
        self.damageTable.damage = damage
		ApplyDamage( self.damageTable )
		if (not kv.target:IsAlive()) then
			local stacks = self.parent:GetModifierStackCount("modifier_axe_culling_blade_custom_buff", self.parent)
        	self.parent:SetModifierStackCount("modifier_axe_culling_blade_custom_buff", self.parent, (stacks + self.stackPerBoss))
		end
    else
        kv.target:Kill(self.ability,self.parent)
        local stacks = self.parent:GetModifierStackCount("modifier_axe_culling_blade_custom_buff", self.parent)
        self.parent:SetModifierStackCount("modifier_axe_culling_blade_custom_buff", self.parent, (stacks + self.stackPerCreep))
        success = true
    end

	self.ability:UseResources( false,false, false, true )

	self:PlayEffects(kv.target, success)
end

function modifier_axe_culling_blade_custom:PlayEffects(target, success)
    self.parent:StartGesture(ACT_DOTA_CAST_ABILITY_4)

	local particle_cast = ""
	local sound_cast = ""

    if success then
		particle_cast = "particles/units/heroes/hero_axe/axe_culling_blade_kill.vpcf"
		sound_cast = "Hero_Axe.Culling_Blade_Success"
	else
		particle_cast = "particles/units/heroes/hero_axe/axe_culling_blade.vpcf"
		sound_cast = "Hero_Axe.Culling_Blade_Fail"
	end

	local direction = (target:GetOrigin()-self:GetCaster():GetOrigin()):Normalized()

	local effect_cast = ParticleManager:CreateParticle( particle_cast, PATTACH_ABSORIGIN_FOLLOW, target )
	ParticleManager:SetParticleControl( effect_cast, 4, target:GetOrigin() )
	ParticleManager:SetParticleControlForward( effect_cast, 3, direction )
	ParticleManager:SetParticleControlForward( effect_cast, 4, direction )
	ParticleManager:ReleaseParticleIndex( effect_cast )

	EmitSoundOn( sound_cast, target )
end

modifier_axe_culling_blade_custom_buff = class({
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
    RemoveOnDeath = function()
		return false
	end,
	DeclareFunctions = function() 
		return 
		{
			MODIFIER_PROPERTY_STATS_STRENGTH_BONUS,
            MODIFIER_PROPERTY_PHYSICAL_ARMOR_BONUS
		} 
	end
})

function modifier_axe_culling_blade_custom_buff:OnCreated()
	self.ability = self:GetAbility()
end

function modifier_axe_culling_blade_custom_buff:GetModifierPhysicalArmorBonus()
	return self.ability:GetSpecialValueFor("armor_per_stack") * self:GetStackCount()
end

function modifier_axe_culling_blade_custom_buff:GetModifierBonusStats_Strength()
	return self.ability:GetSpecialValueFor("strength_per_stack") * self:GetStackCount()
end

LinkLuaModifier( "modifier_axe_culling_blade_custom", "abilities/heroes/axe/culling_blade", LUA_MODIFIER_MOTION_NONE )
LinkLuaModifier( "modifier_axe_culling_blade_custom_buff", "abilities/heroes/axe/culling_blade", LUA_MODIFIER_MOTION_NONE )