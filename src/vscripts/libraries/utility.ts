/* eslint-disable @typescript-eslint/no-explicit-any */
//-- Better and very fast table.remove implementation, use this instead of table.remove
//-- 20M elements table.remove thinks for days, ArrayRemove() do this in 2 seconds
//--[[
//	Example:
//	ArrayRemove(table, function(t, i, j)
//		local tableElement = t[i]
//		return IsElementShouldBeKeptInTable(tableElement) -- true = keep, false = remove
//	end)
//--]]
//-- https://stackoverflow.com/questions/12394841/safely-remove-items-from-an-array-table-while-iterating
//function ArrayRemove(t, fnKeep)
//	CheckType(t, "t", "table")
//	CheckType(fnKeep, "fnKeep", "function")
//
//    local j, n = 1, #t
//    for i=1,n do
//        if (fnKeep(t, i, j)) then
//            if (i ~= j) then
//                t[j] = t[i]
//                t[i] = nil
//            end
//            j = j + 1
//        else
//            t[i] = nil
//        end
//    end
//    return t
//end

//function TableLength(table)
//	CheckType(table, "table", "table")
//
//	local length = 0
//
//	for _,_ in pairs(table) do
//		length = length + 1
//	end
//
//	return length
//end

//function table.contains(_self, value)
//    if(not _self or not value) then
//        return false
//    end
//	for _, v in pairs(_self) do
//		if v == value then
//			return true
//		end
//	end
//	return false
//end

export class Utility {
    public static CheckType(value: any, valueName: string, requiredType: string): boolean {
        if (IsInToolsMode() == false) {
            return true;
        }

        let isValid = true;

        if (requiredType == "unit") {
            if (type(value) != "table" || value.GetUnitName == undefined) {
                isValid = false;
            }
        } else if (requiredType == "ability") {
            if (type(value) != "table" || value.GetAbilityName == undefined) {
                isValid = false;
            }
        } else if (requiredType == "vector") {
            if (type(value) != "userdata" || value.x == undefined) {
                isValid = false;
            }
        } else {
            if (type(value) != requiredType) {
                isValid = false;
            }
        }

        if (isValid == false) {
            error(
                "Expected " +
                    tostring(valueName) +
                    " to be " +
                    tostring(requiredType) +
                    ". Got " +
                    tostring(value) +
                    " (" +
                    type(value) +
                    ")."
            );
        }

        return isValid;
    }
    public static CalculateDistance(ent1: CDOTA_BaseNPC | Vector, ent2: CDOTA_BaseNPC | Vector): number {
        let pos1: CDOTA_BaseNPC | Vector = ent1;
        let pos2: CDOTA_BaseNPC | Vector = ent2;

        if ((ent1 as CDOTA_BaseNPC).GetAbsOrigin() != undefined) {
            pos1 = (ent1 as CDOTA_BaseNPC).GetAbsOrigin();
        } else {
            this.CheckType(pos1, "pos1", "vector");
        }
        if ((ent2 as CDOTA_BaseNPC).GetAbsOrigin() != undefined) {
            pos2 = (ent1 as CDOTA_BaseNPC).GetAbsOrigin();
        } else {
            this.CheckType(pos2, "pos2", "vector");
        }

        return (((pos1 as Vector) - (pos2 as Vector)) as Vector).Length2D();
    }
    public static CalculateDistanceSqr(ent1: CDOTA_BaseNPC | Vector, ent2: CDOTA_BaseNPC | Vector): number {
        let pos1: CDOTA_BaseNPC | Vector = ent1;
        let pos2: CDOTA_BaseNPC | Vector = ent2;

        if ((ent1 as CDOTA_BaseNPC).GetAbsOrigin() != undefined) {
            pos1 = (ent1 as CDOTA_BaseNPC).GetAbsOrigin();
        } else {
            this.CheckType(pos1, "pos1", "vector");
        }
        if ((ent2 as CDOTA_BaseNPC).GetAbsOrigin() != undefined) {
            pos2 = (ent1 as CDOTA_BaseNPC).GetAbsOrigin();
        } else {
            this.CheckType(pos2, "pos2", "vector");
        }

        const vector = ((pos1 as Vector) - (pos2 as Vector)) as Vector;
        return vector.x * vector.x + vector.y * vector.y;
    }
    public static CalculateDirection(ent1: CDOTA_BaseNPC, ent2: CDOTA_BaseNPC): Vector {
        let pos1: CDOTA_BaseNPC | Vector = ent1;
        let pos2: CDOTA_BaseNPC | Vector = ent2;

        if (ent1.GetAbsOrigin() != undefined) {
            pos1 = ent1.GetAbsOrigin();
        } else {
            this.CheckType(pos1, "pos1", "vector");
        }
        if (ent2.GetAbsOrigin() != undefined) {
            pos2 = ent2.GetAbsOrigin();
        } else {
            this.CheckType(pos2, "pos2", "vector");
        }

        const direction = (((pos2 as Vector) - (pos1 as Vector)) as Vector).Normalized();
        direction.z = 0;
        return direction;
    }

    public static Debug_PrintError(...value: any) {
        if (IsInToolsMode() == false) {
            return;
        }
        let msg = "";
        const string = { ...value };
        for (const [_, v] of string) {
            msg = msg + tostring(v) + " ";
        }
        // Can be called before GameRules initialized
        if (GameRules && GameRules.SendCustomMessage != undefined) {
            GameRules.SendCustomMessage(msg, 0, 0);
        }
        Timers.CreateTimer(1, () => {
            if (GameRules && GameRules.SendCustomMessage != undefined) {
                GameRules.SendCustomMessage(msg, 0, 0);
            } else {
                return 1;
            }
        });
        print(msg);
        print(debug.traceback());
        DeepPrintTable(debug.getinfo(2));
    }
    public static RotateVector2D(ent1: CDOTA_BaseNPC, ent2: CDOTA_BaseNPC, angel: number): Vector {
        const pos1 = ent1.GetAbsOrigin();
        const pos2 = ent2.GetAbsOrigin();

        this.CheckType(pos1, "pos1", "vector");

        this.CheckType(pos2, "pos2", "vector");

        this.CheckType(angel, "angel", "number");

        const x = pos1.x + (pos2.x - pos1.x) * math.cos(angel) - (pos2.y - pos1.y) * math.sin(angel);
        const y = pos1.y + (pos2.x - pos1.x) * math.sin(angel) + (pos2.y - pos1.y) * math.cos(angel);

        return Vector(x, y, 0);
    }

    public static CastAoeParticle(unit: CDOTA_BaseNPC, castTime: number, castRange: number): ParticleID {
        this.CheckType(unit, "unit", "unit");

        this.CheckType(castTime, "castTime", "number");

        this.CheckType(castRange, "castRange", "number");

        const pfx = ParticleManager.CreateParticle("particles/custom/units/aoe_cast.vpcf", ParticleAttachment.ABSORIGIN, unit);
        Timers.CreateTimer(0.001, () => {
            ParticleManager.SetParticleControl(pfx, 0, unit.GetAbsOrigin());
            return 0.001;
        });
        ParticleManager.SetParticleControl(pfx, 1, Vector(castRange, 0, 0));
        ParticleManager.SetParticleControl(pfx, 2, Vector(castTime + 0.45, 0, 0));

        return pfx;
    }

    public static CastAoeStaticParticle(unit: CDOTA_BaseNPC, point: Vector, castTime: number, castRange: number): ParticleID {
        this.CheckType(unit, "unit", "unit");

        this.CheckType(point, "point", "vector");

        this.CheckType(castTime, "castTime", "number");

        this.CheckType(castRange, "castRange", "number");

        const pfx = ParticleManager.CreateParticle("particles/custom/units/aoe_cast.vpcf", ParticleAttachment.ABSORIGIN, unit);
        ParticleManager.SetParticleControl(pfx, 0, point);
        ParticleManager.SetParticleControl(pfx, 1, Vector(castRange, 0, 0));
        ParticleManager.SetParticleControl(pfx, 2, Vector(castTime + 0.45, 0, 0));

        return pfx;
    }
}

declare global {
    // eslint-disable-next-line no-var
    var _UtilityInitialized: boolean;
}

if (IsServer() && !_G._UtilityInitialized) {
    new Utility();
    _G._UtilityInitialized = true;
}
