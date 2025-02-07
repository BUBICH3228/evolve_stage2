export class AbilityTargets {
    constructor() {
        this._unitTargetTeamMapping = {
            DOTA_UNIT_TARGET_TEAM_NONE: DOTA_UNIT_TARGET_TEAM.DOTA_UNIT_TARGET_TEAM_NONE,
            DOTA_UNIT_TARGET_TEAM_FRIENDLY: DOTA_UNIT_TARGET_TEAM.DOTA_UNIT_TARGET_TEAM_FRIENDLY,
            DOTA_UNIT_TARGET_TEAM_ENEMY: DOTA_UNIT_TARGET_TEAM.DOTA_UNIT_TARGET_TEAM_ENEMY,
            DOTA_UNIT_TARGET_TEAM_BOTH: DOTA_UNIT_TARGET_TEAM.DOTA_UNIT_TARGET_TEAM_BOTH,
            DOTA_UNIT_TARGET_TEAM_CUSTOM: DOTA_UNIT_TARGET_TEAM.DOTA_UNIT_TARGET_TEAM_CUSTOM
        };
        this._unitTargetTypeMapping = {
            DOTA_UNIT_TARGET_NONE: DOTA_UNIT_TARGET_TYPE.DOTA_UNIT_TARGET_NONE,
            DOTA_UNIT_TARGET_HERO: DOTA_UNIT_TARGET_TYPE.DOTA_UNIT_TARGET_HERO,
            DOTA_UNIT_TARGET_CREEP: DOTA_UNIT_TARGET_TYPE.DOTA_UNIT_TARGET_CREEP,
            DOTA_UNIT_TARGET_BUILDING: DOTA_UNIT_TARGET_TYPE.DOTA_UNIT_TARGET_BUILDING,
            DOTA_UNIT_TARGET_COURIER: DOTA_UNIT_TARGET_TYPE.DOTA_UNIT_TARGET_COURIER,
            DOTA_UNIT_TARGET_BASIC: DOTA_UNIT_TARGET_TYPE.DOTA_UNIT_TARGET_BASIC,
            DOTA_UNIT_TARGET_OTHER: DOTA_UNIT_TARGET_TYPE.DOTA_UNIT_TARGET_OTHER,
            DOTA_UNIT_TARGET_ALL: DOTA_UNIT_TARGET_TYPE.DOTA_UNIT_TARGET_ALL,
            DOTA_UNIT_TARGET_TREE: DOTA_UNIT_TARGET_TYPE.DOTA_UNIT_TARGET_TREE,
            DOTA_UNIT_TARGET_CUSTOM: DOTA_UNIT_TARGET_TYPE.DOTA_UNIT_TARGET_CUSTOM
        };
        this._unitTargetFlagsMapping = {
            DOTA_UNIT_TARGET_FLAG_NONE: DOTA_UNIT_TARGET_FLAGS.DOTA_UNIT_TARGET_FLAG_NONE,
            DOTA_UNIT_TARGET_FLAG_RANGED_ONLY: DOTA_UNIT_TARGET_FLAGS.DOTA_UNIT_TARGET_FLAG_RANGED_ONLY,
            DOTA_UNIT_TARGET_FLAG_MELEE_ONLY: DOTA_UNIT_TARGET_FLAGS.DOTA_UNIT_TARGET_FLAG_MELEE_ONLY,
            DOTA_UNIT_TARGET_FLAG_DEAD: DOTA_UNIT_TARGET_FLAGS.DOTA_UNIT_TARGET_FLAG_DEAD,
            DOTA_UNIT_TARGET_FLAG_MAGIC_IMMUNE_ENEMIES: DOTA_UNIT_TARGET_FLAGS.DOTA_UNIT_TARGET_FLAG_MAGIC_IMMUNE_ENEMIES,
            DOTA_UNIT_TARGET_FLAG_NOT_MAGIC_IMMUNE_ALLIES: DOTA_UNIT_TARGET_FLAGS.DOTA_UNIT_TARGET_FLAG_NOT_MAGIC_IMMUNE_ALLIES,
            DOTA_UNIT_TARGET_FLAG_INVULNERABLE: DOTA_UNIT_TARGET_FLAGS.DOTA_UNIT_TARGET_FLAG_INVULNERABLE,
            DOTA_UNIT_TARGET_FLAG_FOW_VISIBLE: DOTA_UNIT_TARGET_FLAGS.DOTA_UNIT_TARGET_FLAG_FOW_VISIBLE,
            DOTA_UNIT_TARGET_FLAG_NO_INVIS: DOTA_UNIT_TARGET_FLAGS.DOTA_UNIT_TARGET_FLAG_NO_INVIS,
            DOTA_UNIT_TARGET_FLAG_NOT_ANCIENTS: DOTA_UNIT_TARGET_FLAGS.DOTA_UNIT_TARGET_FLAG_NOT_ANCIENTS,
            DOTA_UNIT_TARGET_FLAG_PLAYER_CONTROLLED: DOTA_UNIT_TARGET_FLAGS.DOTA_UNIT_TARGET_FLAG_PLAYER_CONTROLLED,
            DOTA_UNIT_TARGET_FLAG_NOT_DOMINATED: DOTA_UNIT_TARGET_FLAGS.DOTA_UNIT_TARGET_FLAG_NOT_DOMINATED,
            DOTA_UNIT_TARGET_FLAG_NOT_SUMMONED: DOTA_UNIT_TARGET_FLAGS.DOTA_UNIT_TARGET_FLAG_NOT_SUMMONED,
            DOTA_UNIT_TARGET_FLAG_NOT_ILLUSIONS: DOTA_UNIT_TARGET_FLAGS.DOTA_UNIT_TARGET_FLAG_NOT_ILLUSIONS,
            DOTA_UNIT_TARGET_FLAG_NOT_ATTACK_IMMUNE: DOTA_UNIT_TARGET_FLAGS.DOTA_UNIT_TARGET_FLAG_NOT_ATTACK_IMMUNE,
            DOTA_UNIT_TARGET_FLAG_MANA_ONLY: DOTA_UNIT_TARGET_FLAGS.DOTA_UNIT_TARGET_FLAG_MANA_ONLY,
            DOTA_UNIT_TARGET_FLAG_CHECK_DISABLE_HELP: DOTA_UNIT_TARGET_FLAGS.DOTA_UNIT_TARGET_FLAG_CHECK_DISABLE_HELP,
            DOTA_UNIT_TARGET_FLAG_NOT_CREEP_HERO: DOTA_UNIT_TARGET_FLAGS.DOTA_UNIT_TARGET_FLAG_NOT_CREEP_HERO,
            DOTA_UNIT_TARGET_FLAG_OUT_OF_WORLD: DOTA_UNIT_TARGET_FLAGS.DOTA_UNIT_TARGET_FLAG_OUT_OF_WORLD,
            DOTA_UNIT_TARGET_FLAG_NOT_NIGHTMARED: DOTA_UNIT_TARGET_FLAGS.DOTA_UNIT_TARGET_FLAG_NOT_NIGHTMARED,
            DOTA_UNIT_TARGET_FLAG_PREFER_ENEMIES: DOTA_UNIT_TARGET_FLAGS.DOTA_UNIT_TARGET_FLAG_PREFER_ENEMIES,
            DOTA_UNIT_TARGET_FLAG_RESPECT_OBSTRUCTIONS: DOTA_UNIT_TARGET_FLAGS.DOTA_UNIT_TARGET_FLAG_RESPECT_OBSTRUCTIONS
        };
        this.ParseKeyValues();
        CustomEvents.RegisterEventHandler(CustomEvent.CUSTOM_EVENT_ON_RELOAD_KV, () => {
            this.ParseKeyValues();
        });
    }
    static GetAbilityTargetTeam(ability, index) {
        const abilityName = ability.GetAbilityName();
        const abilityData = this._abilitiesTargetTeam.get(abilityName);
        if (abilityData) {
            const abilityIndexedTargetTeam = abilityData.get(index);
            if (abilityIndexedTargetTeam != undefined) {
                return abilityIndexedTargetTeam;
            }
        }
        return DOTA_UNIT_TARGET_TEAM.DOTA_UNIT_TARGET_TEAM_NONE;
    }
    static GetAbilityTargetType(ability, index) {
        const abilityName = ability.GetAbilityName();
        const abilityData = this._abilitiesTargetType.get(abilityName);
        if (abilityData) {
            const abilityIndexedTargetType = abilityData.get(index);
            if (abilityIndexedTargetType != undefined) {
                return abilityIndexedTargetType;
            }
        }
        return DOTA_UNIT_TARGET_TYPE.DOTA_UNIT_TARGET_NONE;
    }
    static GetAbilityTargetFlags(ability, index) {
        const abilityName = ability.GetAbilityName();
        const abilityData = this._abilitiesTargetFlags.get(abilityName);
        if (abilityData) {
            const abilityIndexedTargetFlags = abilityData.get(index);
            if (abilityIndexedTargetFlags != undefined) {
                return abilityIndexedTargetFlags;
            }
        }
        return DOTA_UNIT_TARGET_FLAGS.DOTA_UNIT_TARGET_FLAG_NONE;
    }
    ParseKeyValues() {
        const kv = GetAbilitiesAndItemsKV();
        for (const [abilityName, data] of kv) {
            if (data != undefined && type(data) == "table") {
                AbilityTargets._abilitiesTargetTeam.set(abilityName, new Map());
                AbilityTargets._abilitiesTargetType.set(abilityName, new Map());
                AbilityTargets._abilitiesTargetFlags.set(abilityName, new Map());
                for (let i = 0; i < 32; i++) {
                    this.ParseAbilityData(abilityName, data, i);
                }
            }
        }
    }
    ParseAbilityData(abilityName, data, arrayIndex) {
        const index = arrayIndex == 0 ? "" : tostring(arrayIndex);
        const targetTeam = data["AbilityUnitTargetTeam" + index];
        if (targetTeam != undefined) {
            const targetTeamMap = AbilityTargets._abilitiesTargetTeam.get(abilityName);
            targetTeamMap.set(arrayIndex, this.ParseTeamFlags(targetTeam, abilityName));
        }
        const targetType = data["AbilityUnitTargetType" + index];
        if (targetType != undefined) {
            const targetTypeMap = AbilityTargets._abilitiesTargetType.get(abilityName);
            targetTypeMap.set(arrayIndex, this.ParseTypeFlags(targetType, abilityName));
        }
        const targetFlags = data["AbilityUnitTargetFlags" + index];
        if (targetFlags != undefined) {
            const targetFlagsMap = AbilityTargets._abilitiesTargetFlags.get(abilityName);
            targetFlagsMap.set(arrayIndex, this.ParseTargetFlags(targetFlags, abilityName));
        }
    }
    ParseTeamFlags(flags, abilityName) {
        const defaultValue = DOTA_UNIT_TARGET_TEAM.DOTA_UNIT_TARGET_TEAM_NONE;
        const processor = (parsedFlag) => {
            if (this._unitTargetTeamMapping[parsedFlag] != undefined) {
                return this._unitTargetTeamMapping[parsedFlag];
            }
            Debug_PrintError("[" + AbilityTargets.name + "] ", "Flag named '", parsedFlag, "' is invalid (" + abilityName + ").");
            return defaultValue;
        };
        return this.ProcessFlags(flags, processor, defaultValue);
    }
    ParseTypeFlags(flags, abilityName) {
        const defaultValue = DOTA_UNIT_TARGET_TYPE.DOTA_UNIT_TARGET_NONE;
        const processor = (parsedFlag) => {
            if (this._unitTargetTypeMapping[parsedFlag] != undefined) {
                return this._unitTargetTypeMapping[parsedFlag];
            }
            Debug_PrintError("[" + AbilityTargets.name + "] ", "Flag named '", parsedFlag, "' is invalid (" + abilityName + ").");
            return defaultValue;
        };
        return this.ProcessFlags(flags, processor, defaultValue);
    }
    ParseTargetFlags(flags, abilityName) {
        const defaultValue = DOTA_UNIT_TARGET_FLAGS.DOTA_UNIT_TARGET_FLAG_NONE;
        const processor = (parsedFlag) => {
            if (this._unitTargetFlagsMapping[parsedFlag] != undefined) {
                return this._unitTargetFlagsMapping[parsedFlag];
            }
            Debug_PrintError("[" + AbilityTargets.name + "] ", "Flag named '", parsedFlag, "' is invalid (" + abilityName + ").");
            return defaultValue;
        };
        return this.ProcessFlags(flags, processor, defaultValue);
    }
    ProcessFlags(flags, processor, defaultValue) {
        const regex = string.gmatch(flags, "([^|]+)");
        let result = defaultValue;
        for (const [match, _] of regex) {
            const [trimmedFlag, _] = string.gsub(match, "%s+", "");
            const parsedValue = processor(trimmedFlag);
            if (parsedValue != undefined) {
                result = bit.bor(result, parsedValue);
            }
        }
        return result;
    }
}
AbilityTargets._abilitiesTargetTeam = new Map();
AbilityTargets._abilitiesTargetType = new Map();
AbilityTargets._abilitiesTargetFlags = new Map();
if (IsServer()) {
    new AbilityTargets();
}
