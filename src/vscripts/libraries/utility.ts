/* eslint-disable @typescript-eslint/no-explicit-any */
/** @noSelf */
function ArrayRemove(t: any, fnKeep: (t: any, i: number, j: number) => boolean) {
    const n: number = t.length;
    let j = 1;
    for (let i = 0; i < n; i++) {
        if (fnKeep(t, i, j)) {
            if (i !== j - 1) {
                t[j - 1] = t[i];
                t[i] = null;
            }
            j++;
        } else {
            t[i] = null;
        }
    }

    return t;
}

/** @noSelf */
function CheckType(value: any, valueName: string, requiredType: string): boolean {
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
            "Expected " + tostring(valueName) + " to be " + tostring(requiredType) + ". Got " + tostring(value) + " (" + type(value) + ")."
        );
    }
    return isValid;
}
/** @noSelf */
function CalculateDistance(ent1: CDOTA_BaseNPC | Vector, ent2: CDOTA_BaseNPC | Vector): number {
    let pos1 = ent1;
    let pos2 = ent2;
    if (typeof ent1 === "object") {
        pos1 = ent1.GetAbsOrigin();
    } else {
        CheckType(pos1, "pos1", "vector");
    }
    if (typeof ent1 === "object") {
        pos2 = ent1.GetAbsOrigin();
    } else {
        CheckType(pos2, "pos2", "vector");
    }
    return (((pos1 as Vector) - (pos2 as Vector)) as Vector).Length2D();
}
/** @noSelf */
function CalculateDistanceSqr(ent1: CDOTA_BaseNPC | Vector, ent2: CDOTA_BaseNPC | Vector): number {
    let pos1 = ent1;
    let pos2 = ent2;
    if (typeof ent1 === "object") {
        pos1 = ent1.GetAbsOrigin();
    } else {
        CheckType(pos1, "pos1", "vector");
    }
    if (typeof ent1 === "object") {
        pos2 = ent1.GetAbsOrigin();
    } else {
        CheckType(pos2, "pos2", "vector");
    }
    const vector = ((pos1 as Vector) - (pos2 as Vector)) as Vector;
    return vector.x * vector.x + vector.y * vector.y;
}
/** @noSelf */
function CalculateDirection(ent1: CDOTA_BaseNPC, ent2: CDOTA_BaseNPC): Vector {
    let pos1: CDOTA_BaseNPC | Vector = ent1;
    let pos2: CDOTA_BaseNPC | Vector = ent2;
    if (typeof ent1 === "object") {
        pos1 = ent1.GetAbsOrigin();
    } else {
        CheckType(pos1, "pos1", "vector");
    }
    if (typeof ent1 === "object") {
        pos2 = ent1.GetAbsOrigin();
    } else {
        CheckType(pos2, "pos2", "vector");
    }
    const direction = (((pos2 as Vector) - (pos1 as Vector)) as Vector).Normalized();
    direction.z = 0;
    return direction;
}
/** @noSelf */
function Debug_PrintError(...value: any) {
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
/** @noSelf */
function RotateVector2D(ent1: CDOTA_BaseNPC, ent2: CDOTA_BaseNPC, angel: number): Vector {
    const pos1 = ent1.GetAbsOrigin();
    const pos2 = ent2.GetAbsOrigin();
    CheckType(pos1, "pos1", "vector");
    CheckType(pos2, "pos2", "vector");
    CheckType(angel, "angel", "number");
    const x = pos1.x + (pos2.x - pos1.x) * math.cos(angel) - (pos2.y - pos1.y) * math.sin(angel);
    const y = pos1.y + (pos2.x - pos1.x) * math.sin(angel) + (pos2.y - pos1.y) * math.cos(angel);
    return Vector(x, y, 0);
}
/** @noSelf */
function CastAoeParticle(unit: CDOTA_BaseNPC, castTime: number, castRange: number): ParticleID {
    CheckType(unit, "unit", "unit");
    CheckType(castTime, "castTime", "number");
    CheckType(castRange, "castRange", "number");
    const pfx = ParticleManager.CreateParticle("particles/custom/units/aoe_cast.vpcf", ParticleAttachment.ABSORIGIN, unit);
    Timers.CreateTimer(0.001, () => {
        ParticleManager.SetParticleControl(pfx, 0, unit.GetAbsOrigin());
        return 0.001;
    });
    ParticleManager.SetParticleControl(pfx, 1, Vector(castRange, 0, 0));
    ParticleManager.SetParticleControl(pfx, 2, Vector(castTime + 0.45, 0, 0));
    return pfx;
}
/** @noSelf */
function CastAoeStaticParticle(unit: CDOTA_BaseNPC, point: Vector, castTime: number, castRange: number): ParticleID {
    CheckType(unit, "unit", "unit");
    CheckType(point, "point", "vector");
    CheckType(castTime, "castTime", "number");
    CheckType(castRange, "castRange", "number");
    const pfx = ParticleManager.CreateParticle("particles/custom/units/aoe_cast.vpcf", ParticleAttachment.ABSORIGIN, unit);
    ParticleManager.SetParticleControl(pfx, 0, point);
    ParticleManager.SetParticleControl(pfx, 1, Vector(castRange, 0, 0));
    ParticleManager.SetParticleControl(pfx, 2, Vector(castTime + 0.45, 0, 0));
    return pfx;
}
