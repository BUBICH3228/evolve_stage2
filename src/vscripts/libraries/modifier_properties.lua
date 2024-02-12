if(IsClient()) then
    return
end

ModifierProperties = ModifierProperties or class({})

function ModifierProperties:Init()
    CustomEvents:RegisterEventHandler(CUSTOM_EVENT_ON_MODIFIER_ADDED, function(kv)
        ModifierProperties:OnModifierAdded(kv.modifier)
    end)
    CustomEvents:RegisterEventHandler(CUSTOM_EVENT_ON_MODIFIER_DESTROYED, function(kv)
        ModifierProperties:OnModifierRemoved(kv.modifier)
    end)
    ModifierProperties._verySmallValueThatWillBeNotReached = 100e-100
    ModifierProperties._veryBigValueThatWillBeNotReached = 100e100
    ModifierProperties._modifierProperties = {}
    ModifierProperties:FindModifierPropertiesGetters()
    ModifierProperties:FindModifierCustomPropertiesGetters()
end

function ModifierProperties:OnModifierAdded(modifier)
    if(modifier.DeclareFunctions == nil) then
        return
    end


    local parent = modifier:GetParent()
    local properties = modifier:DeclareFunctions()

    for _, modifierProperty in pairs(properties) do
        ModifierProperties._modifierProperties[modifierProperty] = ModifierProperties._modifierProperties[modifierProperty] or {}
        ModifierProperties._modifierProperties[modifierProperty][parent] = ModifierProperties._modifierProperties[modifierProperty][parent] or {}
        table.insert(ModifierProperties._modifierProperties[modifierProperty][parent], modifier)
    end
end

function ModifierProperties:OnModifierRemoved(modifier)
    if(modifier.DeclareFunctions == nil) then
        return
    end 

    local parent = modifier:GetParent()
    local properties = modifier:DeclareFunctions()

    for _, modifierProperty in pairs(properties) do
        ModifierProperties._modifierProperties[modifierProperty] = ModifierProperties._modifierProperties[modifierProperty] or {}
        ModifierProperties._modifierProperties[modifierProperty][parent] = ModifierProperties._modifierProperties[modifierProperty][parent] or {}

        local isThereIsAtLeastOneModifierLeft = false

        ArrayRemove(ModifierProperties._modifierProperties[modifierProperty][parent], function(t, i, j)
            local modifierInTable = t[i]
            if(modifierInTable ~= modifier) then
                isThereIsAtLeastOneModifierLeft = true
                return true
            end
            return false
        end)

        if(isThereIsAtLeastOneModifierLeft == false) then
            ModifierProperties._modifierProperties[modifierProperty][parent] = nil
        end
    end
end

function ModifierProperties:CalculateSpellCriticalStrikeMultiplier(attacker, ability, event)
    CheckType(attacker, "attacker", "unit")

    local modifierFunction = MODIFIER_PROPERTY_MOUNTAIN_PRE_SPELL_CRITICAL_STRIKE
    local modifiers = ModifierProperties:GetModifiersWithProperty(attacker, modifierFunction)

    if(modifiers == nil) then
        return nil
    end

    local getterName = ModifierProperties:GetModifierPropertyGetter(modifierFunction)

    if(getterName == nil) then
        Debug_PrintError("Modifier property '"..tostring(modifierFunction).."' not exists.")
        return nil
    end

    table.sort(modifiers, function(a, b)
        return a:GetSpellCritDamage() > b:GetSpellCritDamage()
    end)

    local eventData = {
        inflictor = ability,
        attacker = attacker,
        victim = EntIndexToHScript(event.entindex_victim_const),
        damage_type = event.damagetype_const,
        damage = event.damage
    }

    local status, result = false, 0

    for _, modifier in ipairs(modifiers) do
        status, result = xpcall(modifier[getterName], Debug_PrintError, modifier, eventData)
        if(status == true) then
            local spellCriticalStrikeMultiplier = tonumber(result)
            if(spellCriticalStrikeMultiplier and spellCriticalStrikeMultiplier > 0) then
                return 1 + (spellCriticalStrikeMultiplier / 100)
            end
        end
    end

    return nil
end

function ModifierProperties:GetModifiersPropertyHighestPriority(npc, modifierFunction, eventData)
    CheckType(npc, "npc", "unit")
    CheckType(modifierFunction, "modifierFunction", "number")

    local getterName = ModifierProperties:GetModifierPropertyGetter(modifierFunction)
    local propertyValue = 0

    if(getterName == nil) then
        Debug_PrintError("Modifier property '"..tostring(modifierFunction).."' not exists.")
        return propertyValue
    end

    local modifiers = ModifierProperties:GetModifiersWithProperty(npc, modifierFunction)

    if(modifiers == nil) then
        return propertyValue
    end

    table.sort(modifiers, function(a, b)
        local firstModifierPriority = a.modifier:GetPriority()
        local secondModifierPriority = b.modifier:GetPriority()
        if(firstModifierPriority == secondModifierPriority) then 
            return a.modifier:GetCreationTime() < b.modifier:GetCreationTime() 
        else 
            return firstModifierPriority > secondModifierPriority
        end
    end)

    local status, result = false, 0

    for _, modifier in ipairs(modifiers) do
        status, result = xpcall(modifier[getterName], Debug_PrintError, modifier, eventData)
        result = tonumber(result)
        if(status == true and result ~= nil) then
            return result
        end
    end

    return propertyValue
end

function ModifierProperties:GetModifiersPropertyPercentageMultiplicative(npc, modifierFunction, eventData)
    CheckType(npc, "npc", "unit")
    CheckType(modifierFunction, "modifierFunction", "number")

    local getterName = ModifierProperties:GetModifierPropertyGetter(modifierFunction)

    if(getterName == nil) then
        Debug_PrintError("Modifier property '"..tostring(modifierFunction).."' not exists.")
        return 0
    end

    local modifiers = ModifierProperties:GetModifiersWithProperty(npc, modifierFunction)

    if(modifiers == nil) then
        return 0
    end

    local currentValue = 1
    local isAtLeastOnePropertyCalled = false
    local status, result = false, 0

    for _, modifier in pairs(modifiers) do
        status, result = xpcall(modifier[getterName], Debug_PrintError, modifier)
        result = tonumber(result)
        if(status == true and result ~= nil) then
            currentValue = currentValue * (1 - (result / 100))
            isAtLeastOnePropertyCalled = true
        end
    end
    
    if(isAtLeastOnePropertyCalled) then
        return 1 - currentValue
    end

    return 0
end

function ModifierProperties:GetModifiersPropertyHighestValue(npc, modifierFunction, eventData)
    CheckType(npc, "npc", "unit")
    CheckType(modifierFunction, "modifierFunction", "number")

    local getterName = ModifierProperties:GetModifierPropertyGetter(modifierFunction)

    if(getterName == nil) then
        Debug_PrintError("Modifier property '"..tostring(modifierFunction).."' not exists.")
        return nil
    end

    local modifiers = ModifierProperties:GetModifiersWithProperty(npc, modifierFunction)

    if(modifiers == nil) then
        return nil
    end

    local currentValue = ModifierProperties:GetModifierPropertyVerySmallValue()
    local isAtLeastOnePropertyCalled = false
    local status, result = false, 0

    for _, modifier in pairs(modifiers) do
        status, result = xpcall(modifier[getterName], Debug_PrintError, modifier)
        result = tonumber(result)
        if(status == true and result ~= nil) then
            isAtLeastOnePropertyCalled = true
            if(result > currentValue) then
                currentValue = result
            end
        end
    end

    if(isAtLeastOnePropertyCalled) then
        return currentValue
    end

    return nil
end

function ModifierProperties:GetModifiersPropertyLowestValue(npc, modifierFunction, eventData)
    CheckType(npc, "npc", "unit")
    CheckType(modifierFunction, "modifierFunction", "number")

    local getterName = ModifierProperties:GetModifierPropertyGetter(modifierFunction)

    if(getterName == nil) then
        Debug_PrintError("Modifier property '"..tostring(modifierFunction).."' not exists.")
        return nil
    end

    local modifiers = ModifierProperties:GetModifiersWithProperty(npc, modifierFunction)

    if(modifiers == nil) then
        return nil
    end

    local currentValue = ModifierProperties:GetModifierPropertyVeryBigValue()
    local isAtLeastOnePropertyCalled = false
    local status, result = false, 0

    for _, modifier in pairs(modifiers) do
        status, result = xpcall(modifier[getterName], Debug_PrintError, modifier)
        result = tonumber(result)
        if(status == true and result ~= nil) then
            isAtLeastOnePropertyCalled = true
            if(result < currentValue) then
                currentValue = result
            end
        end
    end
    
    if(isAtLeastOnePropertyCalled) then
        return currentValue
    end

    return nil
end

function ModifierProperties:GetModifiersPropertyAdditive(npc, modifierFunction, eventData)
    CheckType(npc, "npc", "unit")
    CheckType(modifierFunction, "modifierFunction", "number")

    local getterName = ModifierProperties:GetModifierPropertyGetter(modifierFunction)
    local propertyValue = 0

    if(getterName == nil) then
        Debug_PrintError("Modifier property '"..tostring(modifierFunction).."' not exists.")
        return propertyValue
    end
    
    local modifiers = ModifierProperties:GetModifiersWithProperty(npc, modifierFunction)

    if(modifiers == nil) then
        return propertyValue
    end

    local status, result = false, 0

    for _, modifier in ipairs(modifiers) do
        status, result = xpcall(modifier[getterName], Debug_PrintError, modifier, eventData)
        result = tonumber(result)
        if(status == true and result ~= nil) then
            propertyValue = propertyValue + result
        end
    end

    return propertyValue
end

function ModifierProperties:GetModifiersWithProperty(npc, modifierFunction)
    CheckType(npc, "npc", "unit")
    CheckType(modifierFunction, "modifierFunction", "number")

    if(ModifierProperties._modifierProperties[modifierFunction] and ModifierProperties._modifierProperties[modifierFunction][npc]) then
        return ModifierProperties._modifierProperties[modifierFunction][npc]
    end

    return nil
end

function ModifierProperties:GetModifierPropertyGetter(modifierFunction)
    CheckType(modifierFunction, "modifierFunction", "number")

    return ModifierProperties._modifierPropertyGetters[modifierFunction]
end

function ModifierProperties:GetModifierPropertyVerySmallValue()
    if(ModifierProperties._veryBigValueThatWillBeNotReached == nil) then
        ModifierProperties._veryBigValueThatWillBeNotReached = 100e-100
    end
    return ModifierProperties._veryBigValueThatWillBeNotReached
end

function ModifierProperties:GetModifierPropertyVeryBigValue()
    if(ModifierProperties._veryBigValueThatWillBeNotReached == nil) then
        ModifierProperties._veryBigValueThatWillBeNotReached = 100e100
    end
    return ModifierProperties._veryBigValueThatWillBeNotReached
end

function ModifierProperties:PrintModifierPropertyGettersTable()
    print("ModifierProperties._modifierPropertyGetters = {")
    for modifierPropertyName, modifierPropertyGetter in pairs(_G.EDesc.modifierfunction) do
        print("\t["..modifierPropertyName.."] = \""..modifierPropertyGetter.."\",")
    end
    print("}")
end

function ModifierProperties:FindModifierCustomPropertiesGetters()
    for modifierProperty, modifierPropertyGetter in pairs(_G.CUSTOM_MODIFIER_PROPERTIES_GETTERS) do
        ModifierProperties._modifierPropertyGetters[_G[modifierProperty]] = modifierPropertyGetter
    end
end

-- Сгенерировано ModifierProperties:PrintModifierPropertyGettersTable() 17.12.2022
function ModifierProperties:FindModifierPropertiesGetters()
    ModifierProperties._modifierPropertyGetters = {
        [MODIFIER_PROPERTY_MANA_REGEN_CONSTANT] = "GetModifierConstantManaRegen",
        [MODIFIER_PROPERTY_MANA_REGEN_CONSTANT_UNIQUE] = "GetModifierConstantManaRegenUnique",
        [MODIFIER_PROPERTY_MANA_REGEN_TOTAL_PERCENTAGE] = "GetModifierTotalPercentageManaRegen",
        [MODIFIER_PROPERTY_HEALTH_REGEN_CONSTANT] = "GetModifierConstantHealthRegen",
        [MODIFIER_PROPERTY_HEALTH_REGEN_PERCENTAGE] = "GetModifierHealthRegenPercentage",
        [MODIFIER_PROPERTY_HEALTH_REGEN_PERCENTAGE_UNIQUE] = "GetModifierHealthRegenPercentageUnique",
        [MODIFIER_PROPERTY_HEALTH_BONUS] = "GetModifierHealthBonus",
        [MODIFIER_PROPERTY_MANA_BONUS] = "GetModifierManaBonus",
        [MODIFIER_PROPERTY_EXTRA_STRENGTH_BONUS] = "GetModifierExtraStrengthBonus",
        [MODIFIER_PROPERTY_EXTRA_HEALTH_BONUS] = "GetModifierExtraHealthBonus",
        [MODIFIER_PROPERTY_EXTRA_MANA_BONUS] = "GetModifierExtraManaBonus",
        [MODIFIER_PROPERTY_EXTRA_MANA_BONUS_PERCENTAGE] = "GetModifierExtraManaBonusPercentage",
        [MODIFIER_PROPERTY_EXTRA_HEALTH_PERCENTAGE] = "GetModifierExtraHealthPercentage",
        [MODIFIER_PROPERTY_EXTRA_MANA_PERCENTAGE] = "GetModifierExtraManaPercentage",
        [MODIFIER_PROPERTY_STATS_STRENGTH_BONUS] = "GetModifierBonusStats_Strength",
        [MODIFIER_PROPERTY_STATS_AGILITY_BONUS] = "GetModifierBonusStats_Agility",
        [MODIFIER_PROPERTY_STATS_INTELLECT_BONUS] = "GetModifierBonusStats_Intellect",
        [MODIFIER_EVENT_ON_PROCESS_UPGRADE] = "Unused",
        [MODIFIER_PROPERTY_STATS_STRENGTH_BONUS_PERCENTAGE] = "GetModifierBonusStats_Strength_Percentage",
        [MODIFIER_PROPERTY_STATS_AGILITY_BONUS_PERCENTAGE] = "GetModifierBonusStats_Agility_Percentage",
        [MODIFIER_PROPERTY_STATS_INTELLECT_BONUS_PERCENTAGE] = "GetModifierBonusStats_Intellect_Percentage",
        [MODIFIER_PROPERTY_CAST_RANGE_BONUS] = "GetModifierCastRangeBonus",
        [MODIFIER_EVENT_ON_ORB_EFFECT] = "Unused",
        [MODIFIER_PROPERTY_CAST_RANGE_BONUS_PERCENTAGE] = "GetModifierCastRangeBonusPercentage",
        [MODIFIER_EVENT_ON_PROCESS_CLEAVE] = "OnProcessCleave",
        [MODIFIER_PROPERTY_CAST_RANGE_BONUS_TARGET] = "GetModifierCastRangeBonusTarget",
        [MODIFIER_EVENT_ON_DAMAGE_CALCULATED] = "OnDamageCalculated",
        [MODIFIER_PROPERTY_CAST_RANGE_BONUS_STACKING] = "GetModifierCastRangeBonusStacking",
        [MODIFIER_EVENT_ON_MAGIC_DAMAGE_CALCULATED] = "OnMagicDamageCalculated",
        [MODIFIER_PROPERTY_ATTACK_RANGE_BASE_OVERRIDE] = "GetModifierAttackRangeOverride",
        [MODIFIER_EVENT_ON_ATTACKED] = "OnAttacked",
        [MODIFIER_PROPERTY_ATTACK_RANGE_BONUS] = "GetModifierAttackRangeBonus",
        [MODIFIER_EVENT_ON_DEATH] = "OnDeath",
        [MODIFIER_PROPERTY_ATTACK_RANGE_BONUS_UNIQUE] = "GetModifierAttackRangeBonusUnique",
        [MODIFIER_EVENT_ON_RESPAWN] = "OnRespawn",
        [MODIFIER_PROPERTY_ATTACK_RANGE_BONUS_PERCENTAGE] = "GetModifierAttackRangeBonusPercentage",
        [MODIFIER_EVENT_ON_SPENT_MANA] = "OnSpentMana",
        [MODIFIER_PROPERTY_MAX_ATTACK_RANGE] = "GetModifierMaxAttackRange",
        [MODIFIER_EVENT_ON_TELEPORTING] = "OnTeleporting",
        [MODIFIER_PROPERTY_PROJECTILE_SPEED_BONUS] = "GetModifierProjectileSpeedBonus",
        [MODIFIER_EVENT_ON_TELEPORTED] = "OnTeleported",
        [MODIFIER_PROPERTY_PROJECTILE_SPEED_BONUS_PERCENTAGE] = "GetModifierProjectileSpeedBonusPercentage",
        [MODIFIER_EVENT_ON_SET_LOCATION] = "OnSetLocation",
        [MODIFIER_PROPERTY_PROJECTILE_NAME] = "GetModifierProjectileName",
        [MODIFIER_EVENT_ON_HEALTH_GAINED] = "OnHealthGained",
        [MODIFIER_PROPERTY_REINCARNATION] = "ReincarnateTime",
        [MODIFIER_EVENT_ON_MANA_GAINED] = "OnManaGained",
        [MODIFIER_PROPERTY_RESPAWNTIME] = "GetModifierConstantRespawnTime",
        [MODIFIER_EVENT_ON_TAKEDAMAGE_KILLCREDIT] = "OnTakeDamageKillCredit",
        [MODIFIER_PROPERTY_RESPAWNTIME_PERCENTAGE] = "GetModifierPercentageRespawnTime",
        [MODIFIER_EVENT_ON_HERO_KILLED] = "OnHeroKilled",
        [MODIFIER_PROPERTY_RESPAWNTIME_STACKING] = "GetModifierStackingRespawnTime",
        [MODIFIER_EVENT_ON_HEAL_RECEIVED] = "OnHealReceived",
        [MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE] = "GetModifierPercentageCooldown",
        [MODIFIER_EVENT_ON_BUILDING_KILLED] = "OnBuildingKilled",
        [MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE_ONGOING] = "GetModifierPercentageCooldownOngoing",
        [MODIFIER_EVENT_ON_MODEL_CHANGED] = "OnModelChanged",
        [MODIFIER_PROPERTY_CASTTIME_PERCENTAGE] = "GetModifierPercentageCasttime",
        [MODIFIER_EVENT_ON_MODIFIER_ADDED] = "OnModifierAdded",
        [MODIFIER_PROPERTY_ATTACK_ANIM_TIME_PERCENTAGE] = "GetModifierPercentageAttackAnimTime",
        [MODIFIER_PROPERTY_TOOLTIP] = "OnTooltip",
        [MODIFIER_PROPERTY_MANACOST_PERCENTAGE] = "GetModifierPercentageManacost",
        [MODIFIER_PROPERTY_MODEL_CHANGE] = "GetModifierModelChange",
        [MODIFIER_PROPERTY_MANACOST_PERCENTAGE_STACKING] = "GetModifierPercentageManacostStacking",
        [MODIFIER_PROPERTY_MODEL_SCALE] = "GetModifierModelScale",
        [MODIFIER_PROPERTY_DEATHGOLDCOST] = "GetModifierConstantDeathGoldCost",
        [MODIFIER_PROPERTY_IS_SCEPTER] = "GetModifierScepter",
        [MODIFIER_PROPERTY_EXP_RATE_BOOST] = "GetModifierPercentageExpRateBoost",
        [MODIFIER_PROPERTY_IS_SHARD] = "GetModifierShard",
        [MODIFIER_PROPERTY_GOLD_RATE_BOOST] = "GetModifierPercentageGoldRateBoost",
        [MODIFIER_PROPERTY_RADAR_COOLDOWN_REDUCTION] = "GetModifierRadarCooldownReduction",
        [MODIFIER_PROPERTY_PREATTACK_CRITICALSTRIKE] = "GetModifierPreAttack_CriticalStrike",
        [MODIFIER_PROPERTY_TRANSLATE_ACTIVITY_MODIFIERS] = "GetActivityTranslationModifiers",
        [MODIFIER_PROPERTY_PREATTACK_TARGET_CRITICALSTRIKE] = "GetModifierPreAttack_Target_CriticalStrike",
        [MODIFIER_PROPERTY_TRANSLATE_ATTACK_SOUND] = "GetAttackSound",
        [MODIFIER_PROPERTY_MAGICAL_CONSTANT_BLOCK] = "GetModifierMagical_ConstantBlock",
        [MODIFIER_PROPERTY_LIFETIME_FRACTION] = "GetUnitLifetimeFraction",
        [MODIFIER_PROPERTY_PHYSICAL_CONSTANT_BLOCK] = "GetModifierPhysical_ConstantBlock",
        [MODIFIER_PROPERTY_PROVIDES_FOW_POSITION] = "GetModifierProvidesFOWVision",
        [MODIFIER_PROPERTY_PHYSICAL_CONSTANT_BLOCK_SPECIAL] = "GetModifierPhysical_ConstantBlockSpecial",
        [MODIFIER_PROPERTY_SPELLS_REQUIRE_HP] = "GetModifierSpellsRequireHP",
        [MODIFIER_PROPERTY_TOTAL_CONSTANT_BLOCK_UNAVOIDABLE_PRE_ARMOR] = "GetModifierPhysical_ConstantBlockUnavoidablePreArmor",
        [MODIFIER_PROPERTY_FORCE_DRAW_MINIMAP] = "GetForceDrawOnMinimap",
        [MODIFIER_PROPERTY_TOTAL_CONSTANT_BLOCK] = "GetModifierTotal_ConstantBlock",
        [MODIFIER_PROPERTY_DISABLE_TURNING] = "GetModifierDisableTurning",
        [MODIFIER_PROPERTY_OVERRIDE_ANIMATION] = "GetOverrideAnimation",
        [MODIFIER_PROPERTY_IGNORE_CAST_ANGLE] = "GetModifierIgnoreCastAngle",
        [MODIFIER_PROPERTY_CHANGE_ABILITY_VALUE] = "GetModifierChangeAbilityValue",
        [MODIFIER_PROPERTY_OVERRIDE_ANIMATION_RATE] = "GetOverrideAnimationRate",
        [MODIFIER_PROPERTY_OVERRIDE_ABILITY_SPECIAL] = "GetModifierOverrideAbilitySpecial",
        [MODIFIER_PROPERTY_ABSORB_SPELL] = "GetAbsorbSpell",
        [MODIFIER_PROPERTY_OVERRIDE_ABILITY_SPECIAL_VALUE] = "GetModifierOverrideAbilitySpecialValue",
        [MODIFIER_PROPERTY_REFLECT_SPELL] = "GetReflectSpell",
        [MODIFIER_PROPERTY_ABILITY_LAYOUT] = "GetModifierAbilityLayout",
        [MODIFIER_PROPERTY_DISABLE_AUTOATTACK] = "GetDisableAutoAttack",
        [MODIFIER_EVENT_ON_DOMINATED] = "OnDominated",
        [MODIFIER_PROPERTY_BONUS_DAY_VISION] = "GetBonusDayVision",
        [MODIFIER_EVENT_ON_KILL] = "OnKill",
        [MODIFIER_PROPERTY_BONUS_NIGHT_VISION] = "GetBonusNightVision",
        [MODIFIER_EVENT_ON_ASSIST] = "OnAssist",
        [MODIFIER_PROPERTY_BONUS_NIGHT_VISION_UNIQUE] = "GetBonusNightVisionUnique",
        [MODIFIER_PROPERTY_TEMPEST_DOUBLE] = "GetModifierTempestDouble",
        [MODIFIER_PROPERTY_BONUS_VISION_PERCENTAGE] = "GetBonusVisionPercentage",
        [MODIFIER_PROPERTY_PRESERVE_PARTICLES_ON_MODEL_CHANGE] = "PreserveParticlesOnModelChanged",
        [MODIFIER_PROPERTY_FIXED_DAY_VISION] = "GetFixedDayVision",
        [MODIFIER_EVENT_ON_ATTACK_FINISHED] = "OnAttackFinished",
        [MODIFIER_PROPERTY_FIXED_NIGHT_VISION] = "GetFixedNightVision",
        [MODIFIER_PROPERTY_IGNORE_COOLDOWN] = "GetModifierIgnoreCooldown",
        [MODIFIER_PROPERTY_MIN_HEALTH] = "GetMinHealth",
        [MODIFIER_PROPERTY_CAN_ATTACK_TREES] = "GetModifierCanAttackTrees",
        [MODIFIER_PROPERTY_ABSOLUTE_NO_DAMAGE_PHYSICAL] = "GetAbsoluteNoDamagePhysical",
        [MODIFIER_PROPERTY_VISUAL_Z_DELTA] = "GetVisualZDelta",
        [MODIFIER_PROPERTY_ABSOLUTE_NO_DAMAGE_MAGICAL] = "GetAbsoluteNoDamageMagical",
        [MODIFIER_PROPERTY_ABSOLUTE_NO_DAMAGE_PURE] = "GetAbsoluteNoDamagePure",
        [MODIFIER_PROPERTY_TOOLTIP2] = "OnTooltip2",
        [MODIFIER_EVENT_ON_ATTACK_RECORD_DESTROY] = "OnAttackRecordDestroy",
        [MODIFIER_EVENT_ON_PROJECTILE_OBSTRUCTION_HIT] = "OnProjectileObstructionHit",
        [MODIFIER_PROPERTY_SUPPRESS_TELEPORT] = "GetSuppressTeleport",
        [MODIFIER_EVENT_ON_ATTACK_CANCELLED] = "OnAttackCancelled",
        [MODIFIER_PROPERTY_XP_DURING_DEATH] = "GetModifierXPDuringDeath",
        [MODIFIER_PROPERTY_TURN_RATE_PERCENTAGE] = "GetModifierTurnRate_Percentage",
        [MODIFIER_PROPERTY_ATTACKSPEED_REDUCTION_PERCENTAGE] = "GetModifierAttackSpeedReductionPercentage",
        [MODIFIER_PROPERTY_MOVESPEED_REDUCTION_PERCENTAGE] = "GetModifierMoveSpeedReductionPercentage",
        [MODIFIER_PROPERTY_ATTACK_WHILE_MOVING_TARGET] = "",
        [MODIFIER_PROPERTY_ALWAYS_ALLOW_ATTACK] = "GetAlwaysAllowAttack",
        [MODIFIER_PROPERTY_ATTACKSPEED_PERCENTAGE] = "GetModifierAttackSpeedPercentage",
        [MODIFIER_PROPERTY_ALWAYS_ETHEREAL_ATTACK] = "GetAllowEtherealAttack",
        [MODIFIER_EVENT_ON_ATTEMPT_PROJECTILE_DODGE] = "OnAttemptProjectileDodge",
        [MODIFIER_PROPERTY_OVERRIDE_ATTACK_MAGICAL] = "GetOverrideAttackMagical",
        [MODIFIER_EVENT_ON_PREDEBUFF_APPLIED] = "OnPreDebuffApplied",
        [MODIFIER_PROPERTY_UNIT_STATS_NEEDS_REFRESH] = "GetModifierUnitStatsNeedsRefresh",
        [MODIFIER_PROPERTY_COOLDOWN_PERCENTAGE_STACKING] = "GetModifierPercentageCooldownStacking",
        [MODIFIER_PROPERTY_BOUNTY_CREEP_MULTIPLIER] = "Unused",
        [MODIFIER_PROPERTY_SPELL_REDIRECT_TARGET] = "GetModifierSpellRedirectTarget",
        [MODIFIER_PROPERTY_UNIT_DISALLOW_UPGRADING] = "GetModifierUnitDisllowUpgrading",
        [MODIFIER_PROPERTY_DODGE_PROJECTILE] = "GetModifierDodgeProjectile",
        [MODIFIER_PROPERTY_TRIGGER_COSMETIC_AND_END_ATTACK] = "GetTriggerCosmeticAndEndAttack",
        [MODIFIER_FUNCTION_LAST] = "",
        [MODIFIER_PROPERTY_MAX_DEBUFF_DURATION] = "GetModifierMaxDebuffDuration",
        [MODIFIER_PROPERTY_PRIMARY_STAT_DAMAGE_MULTIPLIER] = "GetPrimaryStatDamageMultiplier",
        [MODIFIER_PROPERTY_PREATTACK_DEADLY_BLOW] = "GetModifierPreAttack_DeadlyBlow",
        [MODIFIER_PROPERTY_ALWAYS_AUTOATTACK_WHILE_HOLD_POSITION] = "GetAlwaysAutoAttackWhileHoldPosition",
        [MODIFIER_EVENT_ON_SPELL_TARGET_READY] = "OnSpellTargetReady",
        [MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE] = "GetModifierPreAttack_BonusDamage",
        [MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE_TARGET] = "GetModifierPreAttack_BonusDamage_Target",
        [MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE_PROC] = "GetModifierPreAttack_BonusDamage_Proc",
        [MODIFIER_PROPERTY_PREATTACK_BONUS_DAMAGE_POST_CRIT] = "GetModifierPreAttack_BonusDamagePostCrit",
        [MODIFIER_PROPERTY_BASEATTACK_BONUSDAMAGE] = "GetModifierBaseAttack_BonusDamage",
        [MODIFIER_PROPERTY_PROCATTACK_BONUS_DAMAGE_PHYSICAL] = "GetModifierProcAttack_BonusDamage_Physical",
        [MODIFIER_PROPERTY_PROCATTACK_CONVERT_PHYSICAL_TO_MAGICAL] = "GetModifierProcAttack_ConvertPhysicalToMagical",
        [MODIFIER_PROPERTY_PROCATTACK_BONUS_DAMAGE_MAGICAL] = "GetModifierProcAttack_BonusDamage_Magical",
        [MODIFIER_PROPERTY_PROCATTACK_BONUS_DAMAGE_PURE] = "GetModifierProcAttack_BonusDamage_Pure",
        [MODIFIER_PROPERTY_PROCATTACK_BONUS_DAMAGE_MAGICAL_TARGET] = "GetModifierProcAttack_BonusDamage_Magical_Target",
        [MODIFIER_PROPERTY_PROCATTACK_FEEDBACK] = "GetModifierProcAttack_Feedback",
        [MODIFIER_PROPERTY_OVERRIDE_ATTACK_DAMAGE] = "GetModifierOverrideAttackDamage",
        [MODIFIER_PROPERTY_PRE_ATTACK] = "GetModifierPreAttack",
        [MODIFIER_PROPERTY_INVISIBILITY_LEVEL] = "GetModifierInvisibilityLevel",
        [MODIFIER_PROPERTY_INVISIBILITY_ATTACK_BEHAVIOR_EXCEPTION] = "GetModifierInvisibilityAttackBehaviorException",
        [MODIFIER_PROPERTY_PERSISTENT_INVISIBILITY] = "GetModifierPersistentInvisibility",
        [MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT] = "GetModifierMoveSpeedBonus_Constant",
        [MODIFIER_PROPERTY_MOVESPEED_BASE_OVERRIDE] = "GetModifierMoveSpeedOverride",
        [MODIFIER_PROPERTY_MOVESPEED_BONUS_PERCENTAGE] = "GetModifierMoveSpeedBonus_Percentage",
        [MODIFIER_PROPERTY_MOVESPEED_BONUS_PERCENTAGE_UNIQUE] = "GetModifierMoveSpeedBonus_Percentage_Unique",
        [MODIFIER_PROPERTY_MOVESPEED_BONUS_UNIQUE] = "GetModifierMoveSpeedBonus_Special_Boots",
        [MODIFIER_PROPERTY_MOVESPEED_BONUS_UNIQUE_2] = "GetModifierMoveSpeedBonus_Special_Boots_2",
        [MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT_UNIQUE] = "GetModifierMoveSpeedBonus_Constant_Unique",
        [MODIFIER_PROPERTY_MOVESPEED_BONUS_CONSTANT_UNIQUE_2] = "GetModifierMoveSpeedBonus_Constant_Unique_2",
        [MODIFIER_PROPERTY_MOVESPEED_ABSOLUTE] = "GetModifierMoveSpeed_Absolute",
        [MODIFIER_PROPERTY_MOVESPEED_ABSOLUTE_MIN] = "GetModifierMoveSpeed_AbsoluteMin",
        [MODIFIER_PROPERTY_MOVESPEED_ABSOLUTE_MAX] = "GetModifierMoveSpeed_AbsoluteMax",
        [MODIFIER_PROPERTY_IGNORE_MOVESPEED_LIMIT] = "GetModifierIgnoreMovespeedLimit",
        [MODIFIER_PROPERTY_MOVESPEED_LIMIT] = "GetModifierMoveSpeed_Limit",
        [MODIFIER_PROPERTY_ATTACKSPEED_BASE_OVERRIDE] = "GetModifierAttackSpeedBaseOverride",
        [MODIFIER_PROPERTY_FIXED_ATTACK_RATE] = "GetModifierFixedAttackRate",
        [MODIFIER_PROPERTY_ATTACKSPEED_BONUS_CONSTANT] = "GetModifierAttackSpeedBonus_Constant",
        [MODIFIER_PROPERTY_IGNORE_ATTACKSPEED_LIMIT] = "GetModifierAttackSpeed_Limit",
        [MODIFIER_PROPERTY_COOLDOWN_REDUCTION_CONSTANT] = "GetModifierCooldownReduction_Constant",
        [MODIFIER_PROPERTY_MANACOST_REDUCTION_CONSTANT] = "GetModifierManacostReduction_Constant",
        [MODIFIER_PROPERTY_BASE_ATTACK_TIME_CONSTANT] = "GetModifierBaseAttackTimeConstant",
        [MODIFIER_PROPERTY_BASE_ATTACK_TIME_CONSTANT_ADJUST] = "GetModifierBaseAttackTimeConstant_Adjust",
        [MODIFIER_PROPERTY_BASE_ATTACK_TIME_PERCENTAGE] = "GetModifierBaseAttackTimePercentage",
        [MODIFIER_PROPERTY_ATTACK_POINT_CONSTANT] = "GetModifierAttackPointConstant",
        [MODIFIER_PROPERTY_BONUSDAMAGEOUTGOING_PERCENTAGE] = "GetModifierBonusDamageOutgoing_Percentage",
        [MODIFIER_PROPERTY_DAMAGEOUTGOING_PERCENTAGE] = "GetModifierDamageOutgoing_Percentage",
        [MODIFIER_PROPERTY_DAMAGEOUTGOING_PERCENTAGE_ILLUSION] = "GetModifierDamageOutgoing_Percentage_Illusion",
        [MODIFIER_PROPERTY_DAMAGEOUTGOING_PERCENTAGE_ILLUSION_AMPLIFY] = "GetModifierDamageOutgoing_Percentage_Illusion_Amplify",
        [MODIFIER_PROPERTY_TOTALDAMAGEOUTGOING_PERCENTAGE] = "GetModifierTotalDamageOutgoing_Percentage",
        [MODIFIER_PROPERTY_SPELL_AMPLIFY_PERCENTAGE_CREEP] = "GetModifierSpellAmplify_PercentageCreep",
        [MODIFIER_PROPERTY_SPELL_AMPLIFY_PERCENTAGE] = "GetModifierSpellAmplify_Percentage",
        [MODIFIER_PROPERTY_SPELL_AMPLIFY_PERCENTAGE_UNIQUE] = "GetModifierSpellAmplify_PercentageUnique",
        [MODIFIER_PROPERTY_HEAL_AMPLIFY_PERCENTAGE_SOURCE] = "GetModifierHealAmplify_PercentageSource",
        [MODIFIER_PROPERTY_HEAL_AMPLIFY_PERCENTAGE_TARGET] = "GetModifierHealAmplify_PercentageTarget",
        [MODIFIER_PROPERTY_HP_REGEN_CAN_BE_NEGATIVE] = "GetModifierHPRegen_CanBeNegative",
        [MODIFIER_PROPERTY_HP_REGEN_AMPLIFY_PERCENTAGE] = "GetModifierHPRegenAmplify_Percentage",
        [MODIFIER_PROPERTY_LIFESTEAL_AMPLIFY_PERCENTAGE] = "GetModifierLifestealRegenAmplify_Percentage",
        [MODIFIER_PROPERTY_SPELL_LIFESTEAL_AMPLIFY_PERCENTAGE] = "GetModifierSpellLifestealRegenAmplify_Percentage",
        [MODIFIER_PROPERTY_MP_REGEN_AMPLIFY_PERCENTAGE] = "GetModifierMPRegenAmplify_Percentage",
        [MODIFIER_PROPERTY_MANA_DRAIN_AMPLIFY_PERCENTAGE] = "GetModifierManaDrainAmplify_Percentage",
        [MODIFIER_PROPERTY_MP_RESTORE_AMPLIFY_PERCENTAGE] = "GetModifierMPRestoreAmplify_Percentage",
        [MODIFIER_PROPERTY_BASEDAMAGEOUTGOING_PERCENTAGE] = "GetModifierBaseDamageOutgoing_Percentage",
        [MODIFIER_PROPERTY_BASEDAMAGEOUTGOING_PERCENTAGE_UNIQUE] = "GetModifierBaseDamageOutgoing_PercentageUnique",
        [MODIFIER_PROPERTY_INCOMING_DAMAGE_PERCENTAGE] = "GetModifierIncomingDamage_Percentage",
        [MODIFIER_PROPERTY_INCOMING_PHYSICAL_DAMAGE_PERCENTAGE] = "GetModifierIncomingPhysicalDamage_Percentage",
        [MODIFIER_PROPERTY_INCOMING_PHYSICAL_DAMAGE_CONSTANT] = "GetModifierIncomingPhysicalDamageConstant",
        [MODIFIER_PROPERTY_INCOMING_SPELL_DAMAGE_CONSTANT] = "GetModifierIncomingSpellDamageConstant",
        [MODIFIER_PROPERTY_EVASION_CONSTANT] = "GetModifierEvasion_Constant",
        [MODIFIER_PROPERTY_NEGATIVE_EVASION_CONSTANT] = "GetModifierNegativeEvasion_Constant",
        [MODIFIER_PROPERTY_STATUS_RESISTANCE] = "GetModifierStatusResistance",
        [MODIFIER_PROPERTY_STATUS_RESISTANCE_STACKING] = "GetModifierStatusResistanceStacking",
        [MODIFIER_PROPERTY_STATUS_RESISTANCE_CASTER] = "GetModifierStatusResistanceCaster",
        [MODIFIER_PROPERTY_AVOID_DAMAGE] = "GetModifierAvoidDamage",
        [MODIFIER_PROPERTY_AVOID_SPELL] = "GetModifierAvoidSpell",
        [MODIFIER_PROPERTY_MISS_PERCENTAGE] = "GetModifierMiss_Percentage",
        [MODIFIER_PROPERTY_PHYSICAL_ARMOR_BASE_PERCENTAGE] = "GetModifierPhysicalArmorBase_Percentage",
        [MODIFIER_PROPERTY_PHYSICAL_ARMOR_TOTAL_PERCENTAGE] = "GetModifierPhysicalArmorTotal_Percentage",
        [MODIFIER_PROPERTY_PHYSICAL_ARMOR_BONUS] = "GetModifierPhysicalArmorBonus",
        [MODIFIER_PROPERTY_PHYSICAL_ARMOR_BONUS_UNIQUE] = "GetModifierPhysicalArmorBonusUnique",
        [MODIFIER_PROPERTY_PHYSICAL_ARMOR_BONUS_UNIQUE_ACTIVE] = "GetModifierPhysicalArmorBonusUniqueActive",
        [MODIFIER_PROPERTY_PHYSICAL_ARMOR_BONUS_POST] = "GetModifierPhysicalArmorBonusPost",
        [MODIFIER_PROPERTY_IGNORE_PHYSICAL_ARMOR] = "GetModifierIgnorePhysicalArmor",
        [MODIFIER_PROPERTY_MAGICAL_RESISTANCE_BASE_REDUCTION] = "GetModifierMagicalResistanceBaseReduction",
        [MODIFIER_PROPERTY_MAGICAL_RESISTANCE_DIRECT_MODIFICATION] = "GetModifierMagicalResistanceDirectModification",
        [MODIFIER_PROPERTY_MAGICAL_RESISTANCE_BONUS] = "GetModifierMagicalResistanceBonus",
        [MODIFIER_PROPERTY_MAGICAL_RESISTANCE_BONUS_ILLUSIONS] = "GetModifierMagicalResistanceBonusIllusions",
        [MODIFIER_PROPERTY_MAGICAL_RESISTANCE_DECREPIFY_UNIQUE] = "GetModifierMagicalResistanceDecrepifyUnique",
        [MODIFIER_PROPERTY_BASE_MANA_REGEN] = "GetModifierBaseRegen",
        [MODIFIER_FUNCTION_INVALID] = "",
        [MODIFIER_PROPERTY_PHYSICALDAMAGEOUTGOING_PERCENTAGE] = "GetModifierPhysicalDamageOutgoing_Percentage",
        [MODIFIER_PROPERTY_RAT_PACK] = "GetModifierIsRatPack",
        [MODIFIER_PROPERTY_TURN_RATE_CONSTANT] = "GetModifierTurnRateConstant",
        [MODIFIER_EVENT_ON_ATTACK_RECORD] = "OnAttackRecord",
        [MODIFIER_EVENT_ON_ATTACK_START] = "OnAttackStart",
        [MODIFIER_EVENT_ON_ATTACK] = "OnAttack",
        [MODIFIER_EVENT_ON_ATTACK_LANDED] = "OnAttackLanded",
        [MODIFIER_EVENT_ON_ATTACK_FAIL] = "OnAttackFail",
        [MODIFIER_EVENT_ON_ATTACK_ALLIED] = "OnAttackAllied",
        [MODIFIER_EVENT_ON_PROJECTILE_DODGE] = "OnProjectileDodge",
        [MODIFIER_EVENT_ON_ORDER] = "OnOrder",
        [MODIFIER_EVENT_ON_UNIT_MOVED] = "OnUnitMoved",
        [MODIFIER_EVENT_ON_ABILITY_START] = "OnAbilityStart",
        [MODIFIER_EVENT_ON_ABILITY_EXECUTED] = "OnAbilityExecuted",
        [MODIFIER_EVENT_ON_ABILITY_FULLY_CAST] = "OnAbilityFullyCast",
        [MODIFIER_EVENT_ON_BREAK_INVISIBILITY] = "OnBreakInvisibility",
        [MODIFIER_EVENT_ON_ABILITY_END_CHANNEL] = "OnAbilityEndChannel",
        [MODIFIER_EVENT_ON_REFRESH] = "Unused",
        [MODIFIER_EVENT_ON_TAKEDAMAGE] = "OnTakeDamage",
        [MODIFIER_EVENT_ON_DEATH_PREVENTED] = "OnDamagePrevented",
        [MODIFIER_EVENT_ON_STATE_CHANGED] = "OnStateChanged",
        [MODIFIER_PROPERTY_INCOMING_DAMAGE_ILLUSION] = "",
        [MODIFIER_PROPERTY_DONT_GIVE_VISION_OF_ATTACKER] = "GetModifierNoVisionOfAttacker",
        [MODIFIER_PROPERTY_BOUNTY_OTHER_MULTIPLIER] = "Unused",
        [MODIFIER_PROPERTY_DISABLE_HEALING] = "GetDisableHealing",
        [MODIFIER_PROPERTY_SUPPRESS_CLEAVE] = "GetSuppressCleave",
        [MODIFIER_PROPERTY_TURN_RATE_OVERRIDE] = "GetModifierTurnRate_Override",
        [MODIFIER_PROPERTY_BOT_ATTACK_SCORE_BONUS] = "BotAttackScoreBonus",
        [MODIFIER_PROPERTY_SUPER_ILLUSION_WITH_ULTIMATE] = "GetModifierSuperIllusionWithUltimate",
        [MODIFIER_PROPERTY_SUPER_ILLUSION] = "GetModifierSuperIllusion",
        [MODIFIER_PROPERTY_STRONG_ILLUSION] = "GetModifierStrongIllusion",
        [MODIFIER_PROPERTY_ILLUSION_LABEL] = "GetModifierIllusionLabel",
        [MODIFIER_PROPERTY_IS_ILLUSION] = "GetIsIllusion",
    }
end

if(IsServer() and not _G._modifierPropertiesInit) then
    ModifierProperties:Init()
    _G._modifierPropertiesInit = true
end