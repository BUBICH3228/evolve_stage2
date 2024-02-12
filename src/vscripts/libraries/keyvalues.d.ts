declare function GetUnitKV(this: void, unitName: string, key: string, level?: number): object;

declare function GetAbilityKV(this: void, unitName: string, key: string, level?: number): object;

declare function GetItemKV(this: void, unitName: string, key: string, level?: number): object;

declare function GetUnitsKV(): LuaPairsIterable<string, object>;

declare function GetAbilitiesKV(): LuaPairsIterable<string, object>;

declare function GetItemsKV(): LuaPairsIterable<string, object>;

declare function GetAbilitiesAndItemsKV(): LuaPairsIterable<string, object>;
