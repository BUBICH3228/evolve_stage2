TalentTree = TalentTree or class({})

-- Не забывайте менять аналог в панораме
local TALENT_TREE_TABLE_NAME = "talent_tree_custom"
local TALENT_TREE_TALENTS_PER_HERO = 8

function TalentTree:Init()
    TalentTree:RegisterPanoramaListeners()
    TalentTree:RegisterEventListeners()
end

function TalentTree:PostInit()
    TalentTree:LoadKeyValues()
end

function TalentTree:RegisterPanoramaListeners()
    CustomGameEventManager:RegisterListener('talent_tree_level_up_talent', Dynamic_Wrap(TalentTree, 'OnPlayerRequiredTalentLevelUp'))
end

function TalentTree:RegisterEventListeners()
	ListenToGameEvent('game_rules_state_change', Dynamic_Wrap(TalentTree, 'OnGameRulesStateChange'), TalentTree)
    ListenToGameEvent('dota_player_gained_level', Dynamic_Wrap(TalentTree, 'OnPlayerHeroGainedLevel'), TalentTree)
    ListenToGameEvent('dota_player_learned_ability', Dynamic_Wrap(TalentTree, 'OnPlayerLeveledAbility'), TalentTree)
    CustomEvents:RegisterEventHandler(CUSTOM_EVENT_ON_PLAYER_HERO_CHANGED, function(data)
		TalentTree:OnPlayerHeroChanged(data)
	end)
    CustomEvents:RegisterEventHandler(CUSTOM_EVENT_ON_PRE_PLAYER_HERO_CHANGED, function(data)
		TalentTree:OnPrePlayerHeroChanged(data)
	end)
end

function TalentTree:OnGameRulesStateChange()
	local newState = GameRules:State_Get()
	if newState == DOTA_GAMERULES_STATE_PRE_GAME and not TalentTree._postInit then
        TalentTree:PostInit()
        TalentTree._postInit = true
	end
end

function TalentTree:OnPlayerHeroGainedLevel(kv)
    if(not kv.hero_entindex) then
        Debug_PrintError("TalentTree:OnPlayerHeroGainedLevel seems valve break dota_player_gained_level event.")
        return
    end
    local hero = EntIndexToHScript(kv.hero_entindex)
    TalentTree:CalculateTalentsForHero(hero)
end

function TalentTree:OnPlayerLeveledAbility(kv)
    if(not kv.PlayerID) then
        Debug_PrintError("TalentTree:OnPlayerLeveledAbility seems valve break dota_player_learned_ability event.")
        return
    end
    local hero = PlayerResource:GetSelectedHeroEntity(kv.PlayerID)
    TalentTree:CalculateTalentsForHero(hero)
end

function TalentTree:LoadKeyValues()
    local availableHeroes = {}
    local availableHeroesKV = LoadKeyValues("scripts/npc/herolist.txt")
    for heroName, state in pairs(availableHeroesKV) do
        state = tonumber(state) or 0
        if(state > 0) then
            availableHeroes[heroName] = true
        end
    end

    local loadedTalents = {}
    local defaultAbilityTalentStart = GetUnitKV("npc_dota_hero_base", "AbilityTalentStart")
    for heroName, _ in pairs(availableHeroes) do
        loadedTalents[heroName] = {}
        local talentStart = GetUnitKV(heroName, "AbilityTalentStart") or defaultAbilityTalentStart
        for i = talentStart, talentStart + TALENT_TREE_TALENTS_PER_HERO - 1, 1 do
            table.insert(loadedTalents[heroName], GetUnitKV(heroName, "Ability"..tostring(i)))
        end
        loadedTalents[heroName][TALENT_TREE_BOTTOM_BRANCH_ATTRIBUTES] = GameSettings:GetSettingValueAsString("hero_bonus_attributes_talent")
    end
    if(PlayerTables:TableExists(TALENT_TREE_TABLE_NAME) == false) then
        PlayerTables:CreateTable(
            TALENT_TREE_TABLE_NAME, 
            {
                ["hero_talents"] = {}
            }, 
            true
        )
    end
    TalentTree._heroTalents = loadedTalents or {}
end

function TalentTree:RemoveForHero(hero)
    CheckType(hero, "hero", "table")

    local data = PlayerTables:GetTableValue(TALENT_TREE_TABLE_NAME, "hero_talents")
    local entIndex = hero:entindex()
    data[entIndex] = nil
    PlayerTables:SetTableValue(TALENT_TREE_TABLE_NAME, "hero_talents", data)
end

function TalentTree:CreateForHero(hero)
    CheckType(hero, "hero", "table")

    TalentTree:CalculateTalentsForHero(hero)
end

function TalentTree:CalculateTalentsForHero(hero)
    CheckType(hero, "hero", "table")

    local data = PlayerTables:GetTableValue(TALENT_TREE_TABLE_NAME, "hero_talents")
    local entIndex = hero:entindex()

    local heroTalents = TalentTree:GetTalentsForHero(hero)
    data[entIndex] = data[entIndex] or {}

    for talentIndex, talentName in pairs(heroTalents) do
        data[entIndex][talentIndex] = {
            talent_name = talentName,
            can_learn = TalentTree:IsHeroCanLearnTalent(hero, talentIndex),
            is_learned = hero:HasTalent(talentName),
            has_description = TalentTree:IsTalentHasDescription(talentName)
        }
    end
    PlayerTables:SetTableValue(TALENT_TREE_TABLE_NAME, "hero_talents", data)
end

function TalentTree:IncreaseLevelOfTalentForHero(hero, talentIndex)
    CheckType(hero, "hero", "table")
    CheckType(talentIndex, "talentIndex", "number")

    local talentName = TalentTree:_GetTalentNameOfHeroByTalentIndex(hero, talentIndex)
    local talentAbility = hero:FindAbilityByName(talentName)
    if(not talentAbility) then
        Debug_PrintError("TalentTree:IncreaseLevelOfTalentForHero Talent ability named ", talentName, " not exists for hero named ", hero:GetUnitName())
        return
    end
    hero:SetAbilityPoints(math.max(0, hero:GetAbilityPoints() - 1))
    Talents:SetIsTalentLearned(hero, talentName, true)
    talentAbility:UpgradeAbility(true)
    CustomEvents:RunEventByName(CUSTOM_EVENT_ON_TALENT_LEARNED, {
        talent = talentAbility,
        hero = hero
    })
    TalentTree:CalculateTalentsForHero(hero)
end

function TalentTree:_GetTalentDataByTalentIndex(hero, talentIndex)
    CheckType(hero, "hero", "table")
    CheckType(talentIndex, "talentIndex", "number")

    local data = PlayerTables:GetTableValue(TALENT_TREE_TABLE_NAME, "hero_talents")
    local entIndex = hero:entindex()

    if(data[entIndex] == nil or not data[entIndex][talentIndex] == nil) then
        return nil
    end
    return data[entIndex][talentIndex]
end

function TalentTree:_IsTalentOfHeroCanBeLearnedByTalentIndex(hero, talentIndex)
    CheckType(hero, "hero", "table")
    CheckType(talentIndex, "talentIndex", "number")

    local talentData = TalentTree:_GetTalentDataByTalentIndex(hero, talentIndex)
    if(talentData ~= nil) then
        return talentData["is_learned"]
    end
    return false
end

function TalentTree:_IsTalentOfHeroLearnedByTalentIndex(hero, talentIndex)
    CheckType(hero, "hero", "table")
    CheckType(talentIndex, "talentIndex", "number")

    local talentData = TalentTree:_GetTalentDataByTalentIndex(hero, talentIndex)
    if(talentData ~= nil) then
        return talentData["can_learn"]
    end
    return false
end

function TalentTree:_GetTalentNameOfHeroByTalentIndex(hero, talentIndex)
    CheckType(hero, "hero", "table")
    CheckType(talentIndex, "talentIndex", "number")

    local talentData = TalentTree:_GetTalentDataByTalentIndex(hero, talentIndex)
    if(talentData ~= nil) then
        return talentData["talent_name"]
    end
    return ""
end

function TalentTree:IsHeroCanLearnTalent(hero, talentIndex)
    CheckType(hero, "hero", "table")
    CheckType(talentIndex, "talentIndex", "number")

    if(hero:GetAbilityPoints() < 1) then
        return false
    end

    local heroLevel = hero:GetLevel()

    local levelRequiredForFirstRow = GameSettings:GetSettingValueAsNumber("hero_talents_row_1")
    if(talentIndex == TALENT_TREE_LEFT_BRANCH_25) then
        local oppositeTalentName = TalentTree:_GetTalentNameOfHeroByTalentIndex(hero, TALENT_TREE_RIGHT_BRANCH_25)
        local thisTalentName = TalentTree:_GetTalentNameOfHeroByTalentIndex(hero, TALENT_TREE_LEFT_BRANCH_25)
        return heroLevel >= levelRequiredForFirstRow and hero:HasTalent(oppositeTalentName) == false and hero:HasTalent(thisTalentName) == false
    end
    if(talentIndex == TALENT_TREE_RIGHT_BRANCH_25) then
        local oppositeTalentName = TalentTree:_GetTalentNameOfHeroByTalentIndex(hero, TALENT_TREE_LEFT_BRANCH_25)
        local thisTalentName = TalentTree:_GetTalentNameOfHeroByTalentIndex(hero, TALENT_TREE_RIGHT_BRANCH_25)
        return heroLevel >= levelRequiredForFirstRow and hero:HasTalent(oppositeTalentName) == false and hero:HasTalent(thisTalentName) == false
    end

    local levelRequiredForSecondRow = GameSettings:GetSettingValueAsNumber("hero_talents_row_2")
    if(talentIndex == TALENT_TREE_LEFT_BRANCH_50) then
        local oppositeTalentName = TalentTree:_GetTalentNameOfHeroByTalentIndex(hero, TALENT_TREE_RIGHT_BRANCH_50)
        local thisTalentName = TalentTree:_GetTalentNameOfHeroByTalentIndex(hero, TALENT_TREE_LEFT_BRANCH_50)
        return heroLevel >= levelRequiredForSecondRow and hero:HasTalent(oppositeTalentName) == false and hero:HasTalent(thisTalentName) == false
    end
    if(talentIndex == TALENT_TREE_RIGHT_BRANCH_50) then
        local oppositeTalentName = TalentTree:_GetTalentNameOfHeroByTalentIndex(hero, TALENT_TREE_LEFT_BRANCH_50)
        local thisTalentName = TalentTree:_GetTalentNameOfHeroByTalentIndex(hero, TALENT_TREE_RIGHT_BRANCH_50)
        return heroLevel >= levelRequiredForSecondRow and hero:HasTalent(oppositeTalentName) == false and hero:HasTalent(thisTalentName) == false
    end

    local levelRequiredForThirdRow = GameSettings:GetSettingValueAsNumber("hero_talents_row_3")
    if(talentIndex == TALENT_TREE_LEFT_BRANCH_75) then
        local oppositeTalentName = TalentTree:_GetTalentNameOfHeroByTalentIndex(hero, TALENT_TREE_RIGHT_BRANCH_75)
        local thisTalentName = TalentTree:_GetTalentNameOfHeroByTalentIndex(hero, TALENT_TREE_LEFT_BRANCH_75)
        return heroLevel >= levelRequiredForThirdRow and hero:HasTalent(oppositeTalentName) == false and hero:HasTalent(thisTalentName) == false
    end
    if(talentIndex == TALENT_TREE_RIGHT_BRANCH_75) then
        local oppositeTalentName = TalentTree:_GetTalentNameOfHeroByTalentIndex(hero, TALENT_TREE_LEFT_BRANCH_75)
        local thisTalentName = TalentTree:_GetTalentNameOfHeroByTalentIndex(hero, TALENT_TREE_RIGHT_BRANCH_75)
        return heroLevel >= levelRequiredForThirdRow and hero:HasTalent(oppositeTalentName) == false and hero:HasTalent(thisTalentName) == false
    end

    local levelRequiredForFourthRow = GameSettings:GetSettingValueAsNumber("hero_talents_row_4")
    if(talentIndex == TALENT_TREE_LEFT_BRANCH_100) then
        local oppositeTalentName = TalentTree:_GetTalentNameOfHeroByTalentIndex(hero, TALENT_TREE_RIGHT_BRANCH_100)
        local thisTalentName = TalentTree:_GetTalentNameOfHeroByTalentIndex(hero, TALENT_TREE_LEFT_BRANCH_100)
        return heroLevel >= levelRequiredForFourthRow and hero:HasTalent(oppositeTalentName) == false and hero:HasTalent(thisTalentName) == false
    end
    if(talentIndex == TALENT_TREE_RIGHT_BRANCH_100) then
        local oppositeTalentName = TalentTree:_GetTalentNameOfHeroByTalentIndex(hero, TALENT_TREE_LEFT_BRANCH_100)
        local thisTalentName = TalentTree:_GetTalentNameOfHeroByTalentIndex(hero, TALENT_TREE_RIGHT_BRANCH_100)
        return heroLevel >= levelRequiredForFourthRow and hero:HasTalent(oppositeTalentName) == false and hero:HasTalent(thisTalentName) == false
    end

    if(talentIndex == TALENT_TREE_BOTTOM_BRANCH_ATTRIBUTES) then
        if(hero._talentBonusAttributesCustom == nil) then
            hero._talentBonusAttributesCustom  = hero:FindAbilityByName(GameSettings:GetSettingValueAsString("hero_bonus_attributes_talent"))
        end
        if(hero._talentBonusAttributesCustom == nil) then
            return false
        end
        return hero._talentBonusAttributesCustom:CanAbilityBeUpgraded() == ABILITY_CAN_BE_UPGRADED
    end

    Debug_PrintError("TalentTree:IsHeroCanLearnTalent attempt to get check talent learn state for unknown talent.")
    return false
end

function TalentTree:GetTalentsForHero(hero)
    CheckType(hero, "hero", "table")

    local unitName = hero:GetUnitName()
    return TalentTree._heroTalents[unitName]
end

function TalentTree:IsTalentHasDescription(talentName)
    CheckType(talentName, "talentName", "string")

    local talentKV = GetAbilityKV(talentName)
    if(type(talentKV) == "table") then
        return tonumber(talentKV["HasDescription"]) == 1
    end
    return false 
end

function TalentTree:OnPlayerRequiredTalentLevelUp(kv)
    local playerID = tonumber(kv.PlayerID)
    local talentIndex = kv.talentIndex

    CheckType(kv.PlayerID, "kv.PlayerID", "number")
    CheckType(kv.talentIndex, "kv.talentIndex", "number")

    local lastSelectedUnit = PlayerResource:GetLastPlayerSelectedUnit(playerID)
    if(lastSelectedUnit == nil) then
        return
    end

    local playerHero = PlayerResource:GetSelectedHeroEntity(playerID)

    if(playerHero ~= lastSelectedUnit
    and PlayerResource:IsHeroSharedWithPlayerID(playerID, lastSelectedUnit:GetPlayerOwnerID()) == false) then
        return
    end
    if(TalentTree:IsHeroCanLearnTalent(lastSelectedUnit, talentIndex) == false) then
        return
    end
    TalentTree:IncreaseLevelOfTalentForHero(lastSelectedUnit, talentIndex)
end

function TalentTree:OnPrePlayerHeroChanged(kv)
    local hero = kv.hero
    TalentTree:RemoveForHero(hero)
end

function TalentTree:OnPlayerHeroChanged(kv)
    local hero = kv.hero
    hero:AddAbility(GameSettings:GetSettingValueAsString("hero_bonus_attributes_talent"))
    TalentTree:CreateForHero(hero)
end

if(not TalentTree._init) then
    TalentTree:Init()
    TalentTree._init = true
end