item_crimson_guard_custom_base = class({
	GetIntrinsicModifierName = function()
		return "modifier_item_crimson_guard_custom"
	end
})

LinkLuaAbility(item_crimson_guard_custom_base, "items/item_crimson_guard")

modifier_item_crimson_guard_custom = class({
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
            MODIFIER_PROPERTY_PHYSICAL_ARMOR_BONUS,
            MODIFIER_PROPERTY_HEALTH_BONUS,
            MODIFIER_PROPERTY_HEALTH_REGEN_CONSTANT
        }
    end,    
    GetModifierPhysicalArmorBonus = function(self)
        return self.bonusArmorBonus
    end,
    GetModifierHealthBonus = function(self)
        return self.bonusHealth
    end,
    GetModifierConstantHealthRegen = function(self)
        return self.healthRegen
    end,
    GetModifierIncomingPhysicalDamageConstant = function(self)
        return self.incomingPhysicalDamage
    end,
    GetAttributes = function()
		return MODIFIER_ATTRIBUTE_MULTIPLE
	end
})

function modifier_item_crimson_guard_custom:OnCreated()
    self.parent = self:GetParent()
    self.ability = self:GetAbility()
    self:OnRefresh()
end

function modifier_item_crimson_guard_custom:OnRefresh()
    self.ability = self:GetAbility() or self.ability
    if(not self.ability or self.ability:IsNull()) then
        return
    end
    self.healthRegen = self.ability:GetSpecialValueFor("bonus_health_regen")
	self.bonusHealth = self.ability:GetSpecialValueFor("bonus_health")
    self.bonusArmorBonus = self.ability:GetSpecialValueFor("bonus_armor")
    if(not IsServer()) then
        return
    end
    self.parent:AddNewModifier(self.parent, self.ability, "modifier_item_crimson_guard_custom_damage_block", { duration = -1 })
end

modifier_item_crimson_guard_custom_damage_block = class({
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
        return 
        {
            MODIFIER_PROPERTY_INCOMING_PHYSICAL_DAMAGE_CONSTANT
        }
    end,
    GetModifierIncomingPhysicalDamageConstant = function(self)
        return self:GetAbility():GetSpecialValueFor("block_physical_damage") --OnRefresh не хочет обновлять занчение
    end
})

function modifier_item_crimson_guard_custom_damage_block:OnCreated()
    self.parent = self:GetParent()
    self.ability = self:GetAbility()
    if(not IsServer()) then
        return
    end
    -- хз почему, но иногда не удаляется через OnDestroy
    self.parentModifierName = self.ability:GetIntrinsicModifierName()
    self:StartIntervalThink(0.25)
end

function modifier_item_crimson_guard_custom_damage_block:OnIntervalThink()
    if(self.parent:HasModifier(self.parentModifierName)) then
        return
    end
    self:Destroy()
end

LinkLuaModifier("modifier_item_crimson_guard_custom", "items/item_crimson_guard", LUA_MODIFIER_MOTION_NONE)
LinkLuaModifier("modifier_item_crimson_guard_custom_damage_block", "items/item_crimson_guard", LUA_MODIFIER_MOTION_NONE)