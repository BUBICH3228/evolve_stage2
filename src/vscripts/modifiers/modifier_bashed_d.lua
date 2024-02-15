modifier_bashed_d = class({
	IsHidden = function()
        return false
    end,
    IsPurgable = function()
        return false
    end,
    IsDebuff = function()
        return true
    end,
    IsStunDebuff = function()
        return true
    end,
    DeclareFunctions = function()
        return {
            MODIFIER_PROPERTY_OVERRIDE_ANIMATION
        }
    end,
    CheckState = function()
		return {
			[MODIFIER_STATE_STUNNED] = true
		}
	end,
    GetEffectAttachType = function()
        return PATTACH_OVERHEAD_FOLLOW
    end,
    GetOverrideAnimation = function()
        return ACT_DOTA_DISABLED
    end,
    GetEffectName = function()
        return "particles/generic_gameplay/generic_bashed_d.vpcf"
    end
})

LinkLuaModifier("modifier_bashed_d", "modifiers/modifier_bashed_d", LUA_MODIFIER_MOTION_NONE)