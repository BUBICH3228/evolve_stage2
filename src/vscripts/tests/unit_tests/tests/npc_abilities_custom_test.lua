local Test = class(BaseUnitTest)

function Test:OnExecute()
    local errorsCollected = {}
	local errorText = ""
    local unitAbilities = {}
    local kv = LoadKeyValues("scripts/npc/npc_units_custom.txt")
    for k,v in pairs(LoadKeyValues("scripts/npc/npc_heroes_custom.txt")) do
        kv[k] = v
    end
    for unitName, data in pairs(kv) do
        if(type(data) == "table") then
            for k,v in pairs(data) do
                if(string.match(k, "Ability") and k ~= "AbilityLayout" and k ~= "AbilityTalentStart") then
                    table.insert(unitAbilities, {
                        name = v,
                        unit = unitName
                    })
                end
            end
        end
    end
    kv = LoadKeyValues("scripts/npc/npc_abilities_custom.txt")
    --[[
    Тест на использование абилок в юнитах
    for k,v in pairs(kv) do
        if(table.contains(unitAbilities, k) == false) then
			errorText = "Ability with name "..tostring(k).." has defined in npc_abilities_custom.txt, but not assigned to any unit."
            table.insert(errorsCollected, errorText)
        end
    end
    --]]
    local allAbilitiesKV = LoadKeyValues("scripts/npc/npc_abilities.txt")
    for k,v in pairs(kv) do
        allAbilitiesKV[k] = v
    end
    for _, ability in pairs(unitAbilities) do
        if(string.len(ability.name) > 0 and allAbilitiesKV[ability.name] == nil) then
			errorText = "Ability with name "..tostring(ability.name).." has assigned to unit named "..tostring(ability.unit).." in npc_units_custom.txt, but not exists."
            table.insert(errorsCollected, errorText)
        end
    end
    return errorsCollected
end

return Test

