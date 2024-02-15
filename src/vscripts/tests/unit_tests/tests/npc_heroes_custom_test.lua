local Test = class(BaseUnitTest)

function Test:OnExecute()
    local errorsCollected = {}
	local errorText = ""
	local heroesList = LoadKeyValues("scripts/npc/npc_heroes_custom.txt")
    local heroesActiveList = LoadKeyValues("scripts/npc/activelist.txt")
	for heroName, _ in pairs(heroesList) do
        if((heroesActiveList[heroName] == nil or tonumber(heroesActiveList[heroName]) == 0) and heroName ~= "Version") then
			errorText = "Hero with name "..tostring(heroName).." has defined in npc_heroes_custom.txt, but disabled or unknown."
			table.insert(errorsCollected, errorText)
        end
    end
    return errorsCollected
end

return Test

