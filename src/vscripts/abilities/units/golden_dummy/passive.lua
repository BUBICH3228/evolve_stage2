golden_dummy_passive = class({
	GetIntrinsicModifierName = function()
		return "modifier_golden_dummy_passive"
	end
})

modifier_golden_dummy_passive = class({
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
		}
	end,
	CheckState = function()
		return {
			[MODIFIER_STATE_MAGIC_IMMUNE] = true
		}
	end,
})

function modifier_golden_dummy_passive:OnCreated()
	self.parent = self:GetParent()
	self.ability = self:GetAbility()
	self:OnRefresh()
end

function modifier_golden_dummy_passive:OnRefresh( kv )
	self.goldDuration = self.ability:GetSpecialValueFor("gold_duration")
end

function modifier_golden_dummy_passive:OnAttackLanded(kv)
	if(kv.target ~= self.parent) then
		return
	end
	if(kv.attacker:IsRealHero() and kv.attacker:IsIllusion() == false) then
		kv.attacker:AddNewModifier(self.parent, self.ability, "modifier_golden_dummy_passive_buff", {duration = self.goldDuration})
	end
end

modifier_golden_dummy_passive_buff = class({
	IsHidden = function()
        return false
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
	end
})

function modifier_golden_dummy_passive_buff:OnCreated()
	self.parent = self:GetParent()
	self:OnRefresh()

	if(not IsServer()) then
		return
	end
	self:StartIntervalThink(1)
end

function modifier_golden_dummy_passive_buff:OnRefresh()
    self.ability = self:GetAbility()
    if(not self.ability or self.ability:IsNull()) then
        return
    end
	self.goldCount = self.ability:GetSpecialValueFor("gold_count")
	self.xpCount = self.ability:GetSpecialValueFor("xp_count")
end

function modifier_golden_dummy_passive_buff:OnIntervalThink()
	local playerHero = PlayerResource:GetSelectedHeroEntity(self.parent:GetPlayerID())
    local palyer = PlayerResource:GetPlayer(self.parent:GetPlayerID())
	playerHero:AddExperience(self.xpCount, 0, true, true)
	playerHero:ModifyGold(self.goldCount, false, 0)
	SendOverheadEventMessage(palyer, OVERHEAD_ALERT_GOLD, playerHero, self.goldCount, nil)
end

LinkLuaModifier("modifier_golden_dummy_passive", "abilities/units/golden_dummy/passive", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_golden_dummy_passive_buff", "abilities/units/golden_dummy/passive", LUA_MODIFIER_MOTION_NONE)