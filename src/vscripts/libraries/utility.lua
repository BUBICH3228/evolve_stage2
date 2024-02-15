function CheckType(value, valueName, requiredType)
	if(IsInToolsMode() == false) then
		return true
	end

	local isValid = true

	if(requiredType == "unit") then
		if(type(value) ~= "table" or value.GetUnitName == nil) then
			isValid = false
		end
	elseif(requiredType == "ability") then
		if(type(value) ~= "table" or value.GetAbilityName == nil) then
			isValid = false
		end
	elseif(requiredType == "vector") then
		if(type(value) ~= "userdata" or value.x == nil) then
			isValid = false
		end
	else
		if(type(value) ~= requiredType) then
			isValid = false
		end
	end

	if(isValid == false) then
		error("Expected "..tostring(valueName).." to be "..tostring(requiredType)..". Got "..tostring(value).." ("..type(value)..").")
	end

	return isValid
end

function LinkLuaAbility(baseClass, pathToScriptFile)
	CheckType(baseClass, "baseClass", "table")
	CheckType(pathToScriptFile, "pathToScriptFile", "string")

	local abilitiesKV = GetAbilitiesAndItemsKV()

	for abilityName, ability in pairs(abilitiesKV) do
		if(type(ability) == "table" and ability["ScriptFile"] == pathToScriptFile) then
			_G[abilityName] = class(baseClass)
		end
	end
end

function CalculateDistance(ent1, ent2)
	local pos1 = ent1
	local pos2 = ent2

	if ent1.GetAbsOrigin then 
		pos1 = ent1:GetAbsOrigin() 
	else
		CheckType(pos1, "pos1", "vector")
	end
	if ent2.GetAbsOrigin then 
		pos2 = ent2:GetAbsOrigin() 
	else
		CheckType(pos2, "pos2", "vector")
	end
	return (pos1 - pos2):Length2D()
end

function CalculateDistanceSqr(ent1, ent2)
	local pos1 = ent1
	local pos2 = ent2

	if ent1.GetAbsOrigin then 
		pos1 = ent1:GetAbsOrigin() 
	else
		CheckType(pos1, "pos1", "vector")
	end
	if ent2.GetAbsOrigin then 
		pos2 = ent2:GetAbsOrigin() 
	else
		CheckType(pos2, "pos2", "vector")
	end
	local vector = (pos1 - pos2)
	return vector.x*vector.x+vector.y*vector.y
end

function CalculateDirection(ent1, ent2)
	local pos1 = ent1
	local pos2 = ent2

	if ent1.GetAbsOrigin then 
		pos1 = ent1:GetAbsOrigin() 
	else
		CheckType(pos1, "pos1", "vector")
	end
	if ent2.GetAbsOrigin then 
		pos2 = ent2:GetAbsOrigin() 
	else
		CheckType(pos2, "pos2", "vector")
	end

	local direction = (pos2 - pos1):Normalized()
	direction.z = 0
	return direction
end

function Debug_PrintError(...)
	if(IsInToolsMode() == false) then
		return
	end
	local msg = ""
	local string = {...}
	for _, v in pairs(string) do
		msg = msg..tostring(v).." "
	end
	-- Can be called before GameRules initialized
	if(GameRules and GameRules.SendCustomMessage) then
		GameRules:SendCustomMessage(msg, 0, 0)
	end
	Timers:CreateTimer(1, function()
		if(GameRules and GameRules.SendCustomMessage) then
			GameRules:SendCustomMessage(msg, 0, 0)
		else
			return 1
		end
	end)
	print(msg)
	print(debug.traceback())
	DeepPrintTable(debug.getinfo(2))
end

function GiveGoldPlayers(gold)
	CheckType(gold, "gold", "number")

	for index = 0, PlayerResource:GetPlayerCountForTeam(GameSettings:GetSettingValueAsTeamNumber("players_team")), 1 do
		local playerHero = PlayerResource:GetSelectedHeroEntity(index)
		if(playerHero) then
			local player = PlayerResource:GetPlayer(index)
			playerHero:ModifyGold(gold, false, DOTA_ModifyGold_Unspecified)
			SendOverheadEventMessage(player, OVERHEAD_ALERT_GOLD, playerHero, gold, nil)
		end
	end
end

-- Better and very fast table.remove implementation, use this instead of table.remove
-- 20M elements table.remove thinks for days, ArrayRemove() do this in 2 seconds
--[[
	Example:
	ArrayRemove(table, function(t, i, j)
		local tableElement = t[i]
		return IsElementShouldBeKeptInTable(tableElement) -- true = keep, false = remove
	end)
--]]
-- https://stackoverflow.com/questions/12394841/safely-remove-items-from-an-array-table-while-iterating
function ArrayRemove(t, fnKeep)
	CheckType(t, "t", "table")
	CheckType(fnKeep, "fnKeep", "function")

    local j, n = 1, #t
    for i=1,n do
        if (fnKeep(t, i, j)) then
            if (i ~= j) then
                t[j] = t[i]
                t[i] = nil
            end
            j = j + 1
        else
            t[i] = nil
        end
    end
    return t
end

function TableLength(table)
	CheckType(table, "table", "table")
	
	local length = 0

	for _,_ in pairs(table) do	
		length = length + 1
	end
	
	return length
end

function table.contains(_self, value)
    if(not _self or not value) then
        return false
    end
	for _, v in pairs(_self) do
		if v == value then
			return true
		end 
	end
	return false
end

function RotateVector2D(ent1,ent2,angel)
	local pos1 = ent1
	local pos2 = ent2
	local angel = angel

	if ent1.GetAbsOrigin then 
		pos1 = ent1:GetAbsOrigin() 
	else
		CheckType(pos1, "pos1", "vector")
	end
	if ent2.GetAbsOrigin then 
		pos2 = ent2:GetAbsOrigin() 
	else
		CheckType(pos2, "pos2", "vector")
	end
	CheckType(angel, "angel", "number")
	
	local x = pos1.x + (pos2.x - pos1.x) * math.cos(angel) - (pos2.y - pos1.y) * math.sin(angel)
	local y = pos1.y + (pos2.x - pos1.x) * math.sin(angel) + (pos2.y - pos1.y) * math.cos(angel)

	return Vector(x,y,0)
end

function CheckConnectionState(playerID, requiredState)

	CheckType(playerID, "playerID", "number")

	CheckType(requiredState, "requiredState", "number")
	
	return PlayerResource:GetConnectionState(playerID) == requiredState
end

function SelectingMultipleRandom(table,count, repeated)
	CheckType(table, "table", "table")

	CheckType(count, "count", "number")

	local values = {}

	if repeated == true then
		for index = 1, count do
			values[index]= table[math.random(#table)]
		end
	else
		for index = 1, count do 
			if (index == 1) then
				values[index] = table[math.random(#table)]
			else
				local i = 0
				while (#values < count) do
					i = i + 1
					local value = table[math.random(#table)]
					if (value ~= values[i]) then
						values[index] = value
					else
						i = i - 1
					end
				end
			end
		end
	end

	return values
end

function CastAoeParticle(unit,castTime,castRange)

	CheckType(unit, "unit", "unit")

	CheckType(castTime, "castTime", "number")

	CheckType(castRange, "castRange", "number")

	local pfx = ParticleManager:CreateParticle("particles/custom/units/aoe_cast.vpcf", PATTACH_ABSORIGIN , unit)
	Timers.CreateTimer(0.001, function()
		ParticleManager:SetParticleControl(pfx, 0, unit:GetAbsOrigin());
		return 0.001;
	end)
	ParticleManager:SetParticleControl(pfx, 1, Vector(castRange, 0, 0));
    ParticleManager:SetParticleControl(pfx, 2, Vector(castTime + 0.45, 0, 0));

	return pfx
end

function CastAoeStaticParticle(unit,point,castTime,castRange)
	CheckType(unit, "unit", "unit")

	CheckType(point, "point", "vector")

	CheckType(castTime, "castTime", "number")

	CheckType(castRange, "castRange", "number")

	local pfx = ParticleManager:CreateParticle("particles/custom/units/aoe_cast.vpcf", PATTACH_ABSORIGIN , unit)
	ParticleManager:SetParticleControl(pfx, 0, point);
	ParticleManager:SetParticleControl(pfx, 1, Vector(castRange, 0, 0));
    ParticleManager:SetParticleControl(pfx, 2, Vector(castTime + 0.45, 0, 0));

	return pfx
end