declare function CalculateDistance(this: void, firstThing: CDOTA_BaseNPC, secondThing: CDOTA_BaseNPC): number;

declare function CalculateDistance(this: void, firstThing: Vector, secondThing: Vector): number;

declare function CalculateDistanceSqr(this: void, firstThing: CDOTA_BaseNPC, secondThing: CDOTA_BaseNPC): number;

declare function CalculateDistanceSqr(this: void, firstThing: Vector, secondThing: Vector): number;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare function Debug_PrintError(this: void, ...args: any[]): void;

declare function GiveGoldPlayers(this: void, gold: number): void;

declare function ArrayRemove(this: void, t: LuaTable, fnKeep: (this: void, t: LuaTable, i: number, j: number) => boolean): LuaTable;

declare function TableLength(this: void, t: LuaSet): number;

declare function CalculateDirection(this: void, ent1: Vector, ent2: Vector): number;

declare function RotateVector2D(this: void, ent1: Vector, ent2: Vector, angel: number): Vector;

declare function CheckConnectionState(this: boolean, playerID: number, requiredState: number): boolean;

declare function CastAoeMovingParticle(this: void, unit: CDOTA_BaseNPC, castTime: number, castRange: number): ParticleID;
declare function CastAoeStaticParticle(this: void, unit: CDOTA_BaseNPC, point: Vector, castTime: number, castRange: number): ParticleID;
