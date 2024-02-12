talent_base_class = class({
	GetBehavior = function()
		return DOTA_ABILITY_BEHAVIOR_PASSIVE + DOTA_ABILITY_BEHAVIOR_HIDDEN + DOTA_ABILITY_BEHAVIOR_NOT_LEARNABLE
	end,
	IsAttributeBonus = function()
		return true
	end
})