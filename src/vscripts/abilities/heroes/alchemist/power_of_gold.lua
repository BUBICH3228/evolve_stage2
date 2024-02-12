alchemist_power_of_gold = class({
  GetIntrinsicModifierName = function()
    return "modifier_hero_alchemist_power_of_gold"
  end
})

modifier_hero_alchemist_power_of_gold = class({
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
  DeclareFunctions = function()
      return {
          MODIFIER_PROPERTY_STATS_INTELLECT_BONUS,
          MODIFIER_PROPERTY_STATS_AGILITY_BONUS,
          MODIFIER_PROPERTY_STATS_STRENGTH_BONUS,
      }
  end,
  GetModifierBonusStats_Strength = function(self)
    return self:GetStackCount()
  end,
  GetModifierBonusStats_Agility = function(self)
    return self:GetStackCount()
  end,
  GetModifierBonusStats_Intellect = function(self)
      return self:GetStackCount()
  end
})

function modifier_hero_alchemist_power_of_gold:OnCreated()
  self.ability = self:GetAbility()
  self.parent = self:GetParent()
  self:OnRefresh()
  if(not IsServer()) then
    return
  end
  self:StartIntervalThink(1)
end

function modifier_hero_alchemist_power_of_gold:OnRefresh()
  self.ability = self:GetAbility() or self.ability
  if(not self.ability or self.ability:IsNull()) then
      return
  end
  self.attributesPerStack = self.ability:GetSpecialValueFor("attributes_per_stack")
  self.totalEarnedGoldForStack = self.ability:GetSpecialValueFor("total_earned_gold_for_stack")
end

function modifier_hero_alchemist_power_of_gold:OnIntervalThink()
  self:SetStackCount((PlayerResource:GetTotalEarnedGold(self.parent:GetPlayerOwnerID()) / self.totalEarnedGoldForStack) * self.attributesPerStack)
end

LinkLuaModifier("modifier_hero_alchemist_power_of_gold", "abilities/heroes/alchemist/power_of_gold", LUA_MODIFIER_MOTION_NONE)
