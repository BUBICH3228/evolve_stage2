local Test = class(BaseUnitTest)

function Test:OnExecute()
    local errorsCollected = {}
	local errorText = ""
    local itemsUsedInRecipes = {}
    local kv = LoadKeyValues("scripts/npc/npc_items_custom.txt")
    local itemNames = LoadKeyValues("scripts/npc/items.txt")
    for k, v in pairs(kv) do
        itemNames[k] = v
    end
    for itemName, data in pairs(kv) do
        if(type(data) == "table" and string.find(itemName, "item_recipe")) then
            if(data["ItemResult"] and data["ItemRequirements"]) then
                if(type(data["ItemRequirements"]) ~= "table") then
                    errorText = "Item with name "..itemName.." in npc_items_custom.txt has unknown type of ItemRequirements (must be a table). Got "..type(data["ItemRequirements"])
                    table.insert(errorsCollected, errorText)
                else
                    if(type(data["ItemResult"]) ~= "string") then
                        errorText = "Item with name "..itemName.." in npc_items_custom.txt has unknown type of ItemResult (must be a string). Got "..type(data["ItemResult"])
                        table.insert(errorsCollected, errorText)
                    else
                        if(itemNames[data["ItemResult"]] == nil) then
                            errorText = "Item with name "..itemName.." in npc_items_custom.txt has ItemResult with item that don't exists. Item result name is "..tostring(data["ItemResult"])
                            table.insert(errorsCollected, errorText)
                        else
                            table.insert(itemsUsedInRecipes, data["ItemResult"])
                        end
                        for _, recipe in pairs(data["ItemRequirements"]) do
                            for recipeComponent in string.gmatch(recipe, "[^;]+") do
                                if(itemNames[recipeComponent] == nil) then
                                    errorText = "Item with name "..itemName.." in npc_items_custom.txt has ItemRequirements with item that don't exists ("..tostring(recipeComponent)..")."
                                    table.insert(errorsCollected, errorText)
                                else
                                    table.insert(itemsUsedInRecipes, recipeComponent)
                                end
                            end
                        end
                    end
                end
            else
                errorText = "Item with name "..itemName.." in npc_items_custom.txt miss one of the following blocks: ItemResult, ItemRequirements."
                table.insert(errorsCollected, errorText)
            end
        end
    end
    local itemsOverride = LoadKeyValues("scripts/npc/npc_abilities_override.txt")
    for itemName, data in pairs(itemsOverride) do
        if(type(data) == "string") then
            if(data ~= "REMOVED") then
                errorText = "Item with name "..itemName.." in npc_abilities_override.txt has "..tostring(data).." instead of REMOVED."
                table.insert(errorsCollected, errorText)
            end
        end
        if(itemNames[itemName] == nil) then
            errorText = "Item with name "..itemName.." in npc_abilities_override.txt defined, but not exists."
            table.insert(errorsCollected, errorText)
        end
    end
    --[[
    Тест на использование предмета в рецептах
    for k, v in pairs(kv) do
        if(type(v) == "table") then
            if(table.contains(itemsUsedInRecipes, k) == false and string.find(k, "item_recipe") == nil) then
                errorText = "Item with name "..k.." defined in npc_items_custom.txt, but not used in any recipe."
                table.insert(errorsCollected, errorText)
            end
        end
    end
    --]]
    return errorsCollected
end

return Test

