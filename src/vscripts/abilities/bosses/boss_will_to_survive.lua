boss_will_to_survive = class({
	GetIntrinsicModifierName = function()
		return "modifier_boss_will_to_survive"
	end,
    GetCastRange = function(self)
        return self:GetSpecialValueFor("radius")
    end
})

modifier_boss_will_to_survive = class({
    IsHidden = function(self)
        return self:GetStackCount() > 0
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
			MODIFIER_PROPERTY_HEALTH_REGEN_PERCENTAGE
        }
    end
})

function modifier_boss_will_to_survive:OnCreated()
    --[[
    -- По неизвестным причинам крипы из хамера иногда багают пассивные абилки как минимум на клиенте, спасибо габену (самая первая пачка на карте)
    -- Этот костыль фиксит это
    --]]
    if(GameRules:GetGameTime() < 5) then
        if(IsServer()) then
            local parent = self:GetParent()
            local ability = self:GetAbility()
            local modifierName = self:GetName()
            Timers:CreateTimer(6, function()
                parent:AddNewModifier(parent, ability, modifierName, {duration = -1})
            end)
        end
        self:Destroy()
        return
    end
    self.parent = self:GetParent()
    self:OnRefresh()
	if(not IsServer()) then
		return
	end
	self:OnIntervalThink()
	self:StartIntervalThink(self.thinkInterval)
end

function modifier_boss_will_to_survive:OnRefresh()
    self.ability = self:GetAbility() or self.ability
    if(not self.ability or self.ability:IsNull() == true) then
        return
    end
	self.thinkInterval = self.ability:GetSpecialValueFor("activation_delay") 
	self.bonusMaxHpPctRegeneration = self.ability:GetSpecialValueFor("bonus_regen_pct")
	self.searchRadius = self.ability:GetCastRange()
end

function modifier_boss_will_to_survive:GetModifierHealthRegenPercentage()
	if(self:GetStackCount() == 0) then
		return self.bonusMaxHpPctRegeneration
	end
	return 0
end

function modifier_boss_will_to_survive:OnIntervalThink()
	local enemies = FindUnitsInRadius(
        self.parent:GetTeamNumber(),
        self.parent:GetAbsOrigin(),
        nil,
        self.searchRadius,
        DOTA_UNIT_TARGET_TEAM_ENEMY,
        DOTA_UNIT_TARGET_ALL,
        DOTA_UNIT_TARGET_FLAG_MAGIC_IMMUNE_ENEMIES + DOTA_UNIT_TARGET_FLAG_INVULNERABLE + DOTA_UNIT_TARGET_FLAG_OUT_OF_WORLD,
        FIND_ANY_ORDER,
        false
    )
	self:SetStackCount(#enemies)
end

LinkLuaModifier("modifier_boss_will_to_survive", "abilities/bosses/boss_will_to_survive", LUA_MODIFIER_MOTION_NONE)