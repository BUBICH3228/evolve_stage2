interface AbilityTargetLoadedData {
    [key: string]: string;
}

export type AbilityTargetsIndex =
    | 0
    | 1
    | 2
    | 3
    | 4
    | 5
    | 6
    | 7
    | 8
    | 9
    | 10
    | 11
    | 12
    | 13
    | 14
    | 15
    | 16
    | 17
    | 18
    | 19
    | 20
    | 21
    | 22
    | 23
    | 24
    | 25
    | 26
    | 27
    | 28
    | 29
    | 30
    | 31;

export class AbilityTargets {
    private static _abilitiesTargetTeam: Map<string, Map<AbilityTargetsIndex, UnitTargetTeam>> = new Map<
        string,
        Map<AbilityTargetsIndex, UnitTargetTeam>
    >();
    private static _abilitiesTargetType: Map<string, Map<AbilityTargetsIndex, UnitTargetType>> = new Map<
        string,
        Map<AbilityTargetsIndex, UnitTargetType>
    >();
    private static _abilitiesTargetFlags: Map<string, Map<AbilityTargetsIndex, UnitTargetFlags>> = new Map<
        string,
        Map<AbilityTargetsIndex, UnitTargetFlags>
    >();

    private _unitTargetTeamMapping: Record<string, UnitTargetTeam> = {
        DOTA_UNIT_TARGET_TEAM_NONE: UnitTargetTeam.NONE,
        DOTA_UNIT_TARGET_TEAM_FRIENDLY: UnitTargetTeam.FRIENDLY,
        DOTA_UNIT_TARGET_TEAM_ENEMY: UnitTargetTeam.ENEMY,
        DOTA_UNIT_TARGET_TEAM_BOTH: UnitTargetTeam.BOTH,
        DOTA_UNIT_TARGET_TEAM_CUSTOM: UnitTargetTeam.CUSTOM
    };

    private _unitTargetTypeMapping: Record<string, UnitTargetType> = {
        DOTA_UNIT_TARGET_NONE: UnitTargetType.NONE,
        DOTA_UNIT_TARGET_HERO: UnitTargetType.HERO,
        DOTA_UNIT_TARGET_CREEP: UnitTargetType.CREEP,
        DOTA_UNIT_TARGET_BUILDING: UnitTargetType.BUILDING,
        DOTA_UNIT_TARGET_COURIER: UnitTargetType.COURIER,
        DOTA_UNIT_TARGET_BASIC: UnitTargetType.BASIC,
        DOTA_UNIT_TARGET_OTHER: UnitTargetType.OTHER,
        DOTA_UNIT_TARGET_ALL: UnitTargetType.ALL,
        DOTA_UNIT_TARGET_TREE: UnitTargetType.TREE,
        DOTA_UNIT_TARGET_CUSTOM: UnitTargetType.CUSTOM
    };

    private _unitTargetFlagsMapping: Record<string, UnitTargetFlags> = {
        DOTA_UNIT_TARGET_FLAG_NONE: UnitTargetFlags.NONE,
        DOTA_UNIT_TARGET_FLAG_RANGED_ONLY: UnitTargetFlags.RANGED_ONLY,
        DOTA_UNIT_TARGET_FLAG_MELEE_ONLY: UnitTargetFlags.MELEE_ONLY,
        DOTA_UNIT_TARGET_FLAG_DEAD: UnitTargetFlags.DEAD,
        DOTA_UNIT_TARGET_FLAG_MAGIC_IMMUNE_ENEMIES: UnitTargetFlags.MAGIC_IMMUNE_ENEMIES,
        DOTA_UNIT_TARGET_FLAG_NOT_MAGIC_IMMUNE_ALLIES: UnitTargetFlags.NOT_MAGIC_IMMUNE_ALLIES,
        DOTA_UNIT_TARGET_FLAG_INVULNERABLE: UnitTargetFlags.INVULNERABLE,
        DOTA_UNIT_TARGET_FLAG_FOW_VISIBLE: UnitTargetFlags.FOW_VISIBLE,
        DOTA_UNIT_TARGET_FLAG_NO_INVIS: UnitTargetFlags.NO_INVIS,
        DOTA_UNIT_TARGET_FLAG_NOT_ANCIENTS: UnitTargetFlags.NOT_ANCIENTS,
        DOTA_UNIT_TARGET_FLAG_PLAYER_CONTROLLED: UnitTargetFlags.PLAYER_CONTROLLED,
        DOTA_UNIT_TARGET_FLAG_NOT_DOMINATED: UnitTargetFlags.NOT_DOMINATED,
        DOTA_UNIT_TARGET_FLAG_NOT_SUMMONED: UnitTargetFlags.NOT_SUMMONED,
        DOTA_UNIT_TARGET_FLAG_NOT_ILLUSIONS: UnitTargetFlags.NOT_ILLUSIONS,
        DOTA_UNIT_TARGET_FLAG_NOT_ATTACK_IMMUNE: UnitTargetFlags.NOT_ATTACK_IMMUNE,
        DOTA_UNIT_TARGET_FLAG_MANA_ONLY: UnitTargetFlags.MANA_ONLY,
        DOTA_UNIT_TARGET_FLAG_CHECK_DISABLE_HELP: UnitTargetFlags.CHECK_DISABLE_HELP,
        DOTA_UNIT_TARGET_FLAG_NOT_CREEP_HERO: UnitTargetFlags.NOT_CREEP_HERO,
        DOTA_UNIT_TARGET_FLAG_OUT_OF_WORLD: UnitTargetFlags.OUT_OF_WORLD,
        DOTA_UNIT_TARGET_FLAG_NOT_NIGHTMARED: UnitTargetFlags.NOT_NIGHTMARED,
        DOTA_UNIT_TARGET_FLAG_PREFER_ENEMIES: UnitTargetFlags.PREFER_ENEMIES,
        DOTA_UNIT_TARGET_FLAG_RESPECT_OBSTRUCTIONS: UnitTargetFlags.RESPECT_OBSTRUCTIONS
    };

    constructor() {
        this.ParseKeyValues();
        CustomEvents.RegisterEventHandler(CustomEvent.CUSTOM_EVENT_ON_RELOAD_KV, () => {
            this.ParseKeyValues();
        });
    }
    public static GetAbilityTargetTeam(ability: CDOTABaseAbility, index: AbilityTargetsIndex): UnitTargetTeam {
        const abilityName = ability.GetAbilityName();

        const abilityData = this._abilitiesTargetTeam.get(abilityName);

        if (abilityData) {
            const abilityIndexedTargetTeam = abilityData.get(index);
            if (abilityIndexedTargetTeam != undefined) {
                return abilityIndexedTargetTeam;
            }
        }

        return UnitTargetTeam.NONE;
    }

    public static GetAbilityTargetType(ability: CDOTABaseAbility, index: AbilityTargetsIndex): UnitTargetType {
        const abilityName = ability.GetAbilityName();

        const abilityData = this._abilitiesTargetType.get(abilityName);

        if (abilityData) {
            const abilityIndexedTargetType = abilityData.get(index);
            if (abilityIndexedTargetType != undefined) {
                return abilityIndexedTargetType;
            }
        }

        return UnitTargetType.NONE;
    }

    public static GetAbilityTargetFlags(ability: CDOTABaseAbility, index: AbilityTargetsIndex): UnitTargetFlags {
        const abilityName = ability.GetAbilityName();

        const abilityData = this._abilitiesTargetFlags.get(abilityName);

        if (abilityData) {
            const abilityIndexedTargetFlags = abilityData.get(index);
            if (abilityIndexedTargetFlags != undefined) {
                return abilityIndexedTargetFlags;
            }
        }

        return UnitTargetFlags.NONE;
    }

    private ParseKeyValues() {
        const kv = GetAbilitiesAndItemsKV();
        for (const [abilityName, data] of kv) {
            if (data != undefined && type(data) == "table") {
                AbilityTargets._abilitiesTargetTeam.set(abilityName, new Map<AbilityTargetsIndex, UnitTargetTeam>());
                AbilityTargets._abilitiesTargetType.set(abilityName, new Map<AbilityTargetsIndex, UnitTargetType>());
                AbilityTargets._abilitiesTargetFlags.set(abilityName, new Map<AbilityTargetsIndex, UnitTargetFlags>());

                for (let i = 0; i < 32; i++) {
                    this.ParseAbilityData(abilityName, data as AbilityTargetLoadedData, i as AbilityTargetsIndex);
                }
            }
        }
    }

    private ParseAbilityData(abilityName: string, data: AbilityTargetLoadedData, arrayIndex: AbilityTargetsIndex) {
        const index = arrayIndex == 0 ? "" : tostring(arrayIndex);

        const targetTeam = data["AbilityUnitTargetTeam" + index];

        if (targetTeam != undefined) {
            const targetTeamMap = AbilityTargets._abilitiesTargetTeam.get(abilityName);

            targetTeamMap!.set(arrayIndex, this.ParseTeamFlags(targetTeam, abilityName));
        }

        const targetType = data["AbilityUnitTargetType" + index];

        if (targetType != undefined) {
            const targetTypeMap = AbilityTargets._abilitiesTargetType.get(abilityName);

            targetTypeMap!.set(arrayIndex, this.ParseTypeFlags(targetType, abilityName));
        }

        const targetFlags = data["AbilityUnitTargetFlags" + index];

        if (targetFlags != undefined) {
            const targetFlagsMap = AbilityTargets._abilitiesTargetFlags.get(abilityName);

            targetFlagsMap!.set(arrayIndex, this.ParseTargetFlags(targetFlags, abilityName));
        }
    }

    private ParseTeamFlags(flags: string, abilityName: string): UnitTargetTeam {
        const defaultValue = UnitTargetTeam.NONE;

        const processor = (parsedFlag: string): UnitTargetTeam | undefined => {
            if (this._unitTargetTeamMapping[parsedFlag] != undefined) {
                return this._unitTargetTeamMapping[parsedFlag];
            }

            Debug_PrintError("[" + AbilityTargets.name + "] ", "Flag named '", parsedFlag, "' is invalid (" + abilityName + ").");

            return defaultValue;
        };
        return this.ProcessFlags<UnitTargetTeam>(flags, processor, defaultValue);
    }

    private ParseTypeFlags(flags: string, abilityName: string): UnitTargetType {
        const defaultValue = UnitTargetType.NONE;

        const processor = (parsedFlag: string): UnitTargetType | undefined => {
            if (this._unitTargetTypeMapping[parsedFlag] != undefined) {
                return this._unitTargetTypeMapping[parsedFlag];
            }

            Debug_PrintError("[" + AbilityTargets.name + "] ", "Flag named '", parsedFlag, "' is invalid (" + abilityName + ").");

            return defaultValue;
        };
        return this.ProcessFlags<UnitTargetType>(flags, processor, defaultValue);
    }

    private ParseTargetFlags(flags: string, abilityName: string): UnitTargetFlags {
        const defaultValue = UnitTargetFlags.NONE;

        const processor = (parsedFlag: string): UnitTargetFlags | undefined => {
            if (this._unitTargetFlagsMapping[parsedFlag] != undefined) {
                return this._unitTargetFlagsMapping[parsedFlag];
            }

            Debug_PrintError("[" + AbilityTargets.name + "] ", "Flag named '", parsedFlag, "' is invalid (" + abilityName + ").");

            return defaultValue;
        };
        return this.ProcessFlags<UnitTargetFlags>(flags, processor, defaultValue);
    }

    private ProcessFlags<T>(flags: string, processor: (parsedFlag: string) => T | undefined, defaultValue: T): T {
        const regex = string.gmatch(flags, "([^|]+)");
        let result = defaultValue;

        for (const [match, _] of regex) {
            const [trimmedFlag, _] = string.gsub(match, "%s+", "");
            const parsedValue = processor(trimmedFlag);
            if (parsedValue != undefined) {
                result = bit.bor(result as number, parsedValue as number) as T;
            }
        }

        return result;
    }
}

if (IsServer()) {
    new AbilityTargets();
}
