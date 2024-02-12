local Test = class(BaseUnitTest)

function Test:OnExecute()
    local errorsCollected = {}
    local kv = LoadKeyValues("scripts/npc/npc_abilities_custom.txt")
    for k,v in pairs(LoadKeyValues("scripts/npc/npc_items_custom.txt")) do
        kv[k] = v
    end
    for abilityName, abilityData in pairs(kv) do
        if(type(abilityData) == "table" and abilityData["ScriptFile"]) then
            xpcall(function()
                require(abilityData["ScriptFile"])
            end,
            function(errorMsg)
                table.insert(errorsCollected, "Script file '"..tostring(abilityData["ScriptFile"]).."' not exists or has syntax errors.\n"..tostring(errorMsg))
            end)
        end
    end
    return errorsCollected
end

return Test

