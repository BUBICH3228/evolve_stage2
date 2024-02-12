antimage_blink_custom = class({
	GetAOERadius = function(self) 
		return self:GetSpecialValueFor("radius") 
	end
})

function antimage_blink_custom:Precache(context)
    PrecacheResource("particle", "particles/units/heroes/hero_antimage/antimage_blink_start.vpcf", context)
    PrecacheResource("particle", "particles/units/heroes/hero_antimage/antimage_blink_end.vpcf", context)
	PrecacheResource("particle", "particles/custom/units/heroes/antimage/blinlk/antimage_blink_impact.vpcf", context)
	PrecacheResource("particle", "particles/custom/units/heroes/antimage/blinlk/antimage_blink_talent.vpcf", context)
end

local tableIllusions = {}

function antimage_blink_custom:OnSpellStart()
    local caster = self:GetCaster()
    local point   = self:GetCursorPosition()
    local origin = caster:GetAbsOrigin()
    local max_range = self:GetSpecialValueFor("AbilityCastRange")
	local spellAmp = 1 + caster:GetSpellAmplification(false)

    local damageTable = {
        damage = 0,
		attacker = caster,
        ability = self, 
		damage_type = self:GetAbilityDamageType(),
		damage_flags = DOTA_DAMAGE_FLAG_NO_SPELL_AMPLIFICATION
	}

	if ( caster:HasTalent("talent_antimage_blink_ilussion")) then
		if(TableLength(tableIllusions) > 0) then
			for illusion,_ in pairs(tableIllusions) do
				if not illusion:IsNull() then
					illusion:ForceKill( false )
				end
				tableIllusions[ illusion ]	= nil	
			end
		end
		
	
		local illusions = CreateIllusions(
			caster,
			caster,
			{
				outgoing_damage = self:GetSpecialValueFor("talent_outgoing_damage"),
				incoming_damage = self:GetSpecialValueFor("talent_incoming_damage"),
				duration = self:GetSpecialValueFor("talent_illusion_duration"),
			},
			self:GetSpecialValueFor("talent_images_count"),
			75,
			true,
			true
		)
	
		for _,illusion in pairs(illusions) do
			tableIllusions[ illusion ] = true
		end
	end

    local direction = (point - origin)
	if direction:Length2D() > max_range then
		direction = direction:Normalized() * max_range
	end

	FindClearSpaceForUnit( caster, origin + direction, true )

    local enemies = FindUnitsInRadius(
		caster:GetTeamNumber(),
		caster:GetAbsOrigin(),
		nil,
		self:GetSpecialValueFor("radius"),
		self:GetAbilityTargetTeam(),
		self:GetAbilityTargetType(),
		self:GetAbilityTargetFlags(),
		FIND_ANY_ORDER,
		false
	)

	local damage = self:GetSpecialValueFor("damage")
    local totalDamage = damage * spellAmp
	damageTable.damage = totalDamage
	
    for _, enemy in ipairs(enemies) do 
        damageTable.victim = enemy
        ApplyDamage(damageTable)
    end

	if (caster:HasTalent("talent_antimage_blink_damage_between_points")) then
		local target = GetGroundPosition( origin + direction, nil )
		local enemies = FindUnitsInLine(
			caster:GetTeamNumber(),
			origin,
			target,
			nil,
			self:GetSpecialValueFor("radius"),
			self:GetAbilityTargetTeam(),
			self:GetAbilityTargetType(),
			self:GetAbilityTargetFlags()
		)

		local damage = caster:GetAgility() * (self:GetSpecialValueFor("damage_per_agi")/100)
    	local totalDamage = damage * spellAmp
		damageTable.damage = totalDamage

		for _,enemy in pairs(enemies) do
			damageTable.victim = enemy
        	ApplyDamage(damageTable)
			local effect_cast = ParticleManager:CreateParticle( "particles/custom/units/heroes/antimage/blinlk/antimage_blink_impact.vpcf", PATTACH_ABSORIGIN_FOLLOW, enemy )
			ParticleManager:ReleaseParticleIndex( effect_cast )
		end
		self:PlayEffects1(origin, target)
	end

    self:PlayEffects(origin, direction, caster )
end

function antimage_blink_custom:PlayEffects(origin, direction, caster )
    local particle_cast = "particles/units/heroes/hero_antimage/antimage_blink_start.vpcf"
	local sound_cast = "Hero_Antimage.Blink_out"

	local effect_cast = ParticleManager:CreateParticle( particle_cast, PATTACH_ABSORIGIN_FOLLOW, caster )
	ParticleManager:SetParticleControl( effect_cast, 0, origin )
	ParticleManager:SetParticleControlForward( effect_cast, 0, direction:Normalized() )
	ParticleManager:ReleaseParticleIndex( effect_cast )
	EmitSoundOnLocationWithCaster( origin, sound_cast, caster )

    particle_cast = "particles/units/heroes/hero_antimage/antimage_blink_end.vpcf"
	sound_cast = "Hero_Antimage.Blink_in"
	effect_cast = ParticleManager:CreateParticle( particle_cast_b, PATTACH_ABSORIGIN, caster )
	ParticleManager:SetParticleControl( effect_cast, 0, caster:GetAbsOrigin() )
	ParticleManager:SetParticleControlForward( effect_cast, 0, direction:Normalized() )
	ParticleManager:ReleaseParticleIndex( effect_cast )
	EmitSoundOnLocationWithCaster( caster:GetAbsOrigin(), sound_cast, caster )
end

function antimage_blink_custom:PlayEffects1( origin, target )
	local particle_cast = "particles/custom/units/heroes/antimage/blinlk/antimage_blink_talent.vpcf"
	local sound_start = "Hero_VoidSpirit.AstralStep.Start"
	local sound_end = "Hero_VoidSpirit.AstralStep.End"

	local effect_cast = ParticleManager:CreateParticle( particle_cast, PATTACH_WORLDORIGIN, self:GetCaster() )
	ParticleManager:SetParticleControl( effect_cast, 0, origin )
	ParticleManager:SetParticleControl( effect_cast, 1, target )
	ParticleManager:ReleaseParticleIndex( effect_cast )

	EmitSoundOnLocationWithCaster( origin, sound_start, self:GetCaster() )
	EmitSoundOnLocationWithCaster( target, sound_end, self:GetCaster() )
end
