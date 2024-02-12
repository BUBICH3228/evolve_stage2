DamageTable = DamageTable or class({})

function DamageTable:Init()
    ListenToGameEvent('game_rules_state_change', Dynamic_Wrap(DamageTable, 'OnGameRulesStateChange'), DamageTable)
    CustomEvents:RegisterEventHandler(CUSTOM_EVENT_ON_PRE_TAKE_DAMAGE, function(eventData)
        DamageTable:TakeDamage(eventData)
        end)  
end

function DamageTable:OnGameRulesStateChange()
	local newState = GameRules:State_Get()
	if newState >= DOTA_GAMERULES_STATE_PRE_GAME then
        if newState == DOTA_GAMERULES_STATE_PRE_GAME  then
            for i=0 , PlayerResource:GetPlayerCountForTeam(GameSettings:GetSettingValueAsTeamNumber("players_team"))-1 do 
                PlayerTables:CreateTable("DamageTable"..i,{},true)
                PlayerTables:SetTableValue("DamageTable"..i, "Physical", 0)
                PlayerTables:SetTableValue("DamageTable"..i, "Magical", 0)
                PlayerTables:SetTableValue("DamageTable"..i, "Pure", 0)
                PlayerTables:CreateTable("AdditionalTable15_"..i,{},true)
                PlayerTables:SetTableValue("AdditionalTable15_"..i, "Physical", 0)
                PlayerTables:SetTableValue("AdditionalTable15_"..i, "Magical", 0)
                PlayerTables:SetTableValue("AdditionalTable15_"..i, "Pure", 0)
                PlayerTables:CreateTable("AdditionalTable60_"..i,{},true)
                PlayerTables:SetTableValue("AdditionalTable60_"..i, "Physical", 0)
                PlayerTables:SetTableValue("AdditionalTable60_"..i, "Magical", 0)
                PlayerTables:SetTableValue("AdditionalTable60_"..i, "Pure", 0)
            end
            Timers:CreateTimer(15, function()
                for i=0 , PlayerResource:GetPlayerCountForTeam(GameSettings:GetSettingValueAsTeamNumber("players_team"))-1 do
                    PlayerTables:SetTableValue("AdditionalTable15_"..i, "Physical", 0)
                    PlayerTables:SetTableValue("AdditionalTable15_"..i, "Magical", 0)
                    PlayerTables:SetTableValue("AdditionalTable15_"..i, "Pure", 0)
                end;
                return 15
            end)
            Timers:CreateTimer(60, function()
                for i=0 , PlayerResource:GetPlayerCountForTeam(GameSettings:GetSettingValueAsTeamNumber("players_team"))-1 do 
                    PlayerTables:SetTableValue("AdditionalTable60_"..i, "Physical", 0)
                    PlayerTables:SetTableValue("AdditionalTable60_"..i, "Magical", 0)
                    PlayerTables:SetTableValue("AdditionalTable60_"..i, "Pure", 0)
                end;
                return 60
            end)
        end   
	end
end

function DamageTable:TakeDamage(event) 
    local damage = event.damage
    local attacker = event.attacker
    local victim = event.victim
    local damageType 

    if (not attacker:IsHero()) then
        return
    end

    if (attacker == victim) then
        return
    end

    local playerId = attacker:GetPlayerID()

    if event.damage_type == 1 then
        damageType = "Physical"
    elseif event.damage_type == 2 then
        damageType = "Magical"
    elseif event.damage_type == 4 then
        damageType = "Pure"
    end

    if (damageType == nil) then
        return
    end
    local newDamage = PlayerTables:GetTableValue("DamageTable"..playerId,damageType) + (damage - (damage % 1))
    PlayerTables:SetTableValue("DamageTable"..playerId, damageType, newDamage)

    local newDamage = PlayerTables:GetTableValue("AdditionalTable15_"..playerId,damageType) + (damage - (damage % 1))
    PlayerTables:SetTableValue("AdditionalTable15_"..playerId, damageType, newDamage)

    local newDamage = PlayerTables:GetTableValue("AdditionalTable60_"..playerId,damageType) + (damage - (damage % 1))
    PlayerTables:SetTableValue("AdditionalTable60_"..playerId, damageType, newDamage)
end

if(IsServer() and not DamageTable._initialized) then
	DamageTable:Init()
	DamageTable._initialized = true
end