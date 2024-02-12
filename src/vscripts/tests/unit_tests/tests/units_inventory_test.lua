local Test = class(BaseUnitTest)

function Test:OnExecute()
    local errorsCollected = {}
    local items_dota_kv = LoadKeyValues("scripts/npc/items.txt")
    local items_custom_kv = LoadKeyValues("scripts/npc/npc_items_custom.txt")
    local items_override_kv = LoadKeyValues("scripts/npc/npc_abilities_override.txt")
    local units_kv = LoadKeyValues("scripts/npc/npc_units_custom.txt")
    local itemNames = {}

    for itemName, itemData in pairs(items_dota_kv) do
        if(type(itemData) == "table") then
            itemNames[itemName] = true
        end
    end
    for itemName, itemData in pairs(items_custom_kv) do
        if(type(itemData) == "table") then
            itemNames[itemName] = true
        end
    end
    for itemName, itemData in pairs(items_override_kv) do
        if(itemData == "REMOVED") then
            itemNames[itemName] = nil
        end
    end
    for unitName, unitData in pairs(units_kv) do
        if(type(unitData) == "table" and unitData["Creature"] and unitData["Creature"]["EquippedItems"]) then
            local hasInventory = tonumber(unitData["HasInventory"])
            if(hasInventory == nil or hasInventory == 0) then
                table.insert(errorsCollected, "Unit with name "..tostring(unitName).." has items, but not inventory. Missing \"HasInventory\"\t\"1\".")
            end
            for itemCategory, itemData in pairs(unitData["Creature"]["EquippedItems"]) do
                for _, itemName in pairs(itemData) do
                    itemName = tostring(itemName)
                    if(string.len(itemName) > 0) then
                        if(itemNames[itemName] == nil) then
                            table.insert(errorsCollected, "Item with name "..itemName.." not exists, but defined in inventory of unit with name "..tostring(unitName))
                        end
                    else
                        table.insert(errorsCollected, "Unit with name "..tostring(unitName).." in his inventory have empty entry ("..tostring(itemCategory)..").")
                    end
                end
            end
        end
    end
    return errorsCollected
end

return Test

