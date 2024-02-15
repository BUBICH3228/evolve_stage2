/* eslint-disable @typescript-eslint/ban-ts-comment */
import { AbilityTargets, AbilityTargetsIndex } from "../libraries/ability_targets";

export {};

declare global {
    interface CDOTABaseAbility {
        SetIntrinsicModifier(modifier: CDOTA_Buff): void;
        GetIntrinsicModifier(): CDOTA_Buff | undefined;
        GetProjectileData(projectileID: ProjectileID): object | undefined;
        SetProjectileData(projectileID: ProjectileID, data: object): void;

        GetAbilityTargetTeam(index?: AbilityTargetsIndex): UnitTargetTeam;
        GetAbilityTargetType(index?: AbilityTargetsIndex): UnitTargetType;
        GetAbilityTargetFlags(index?: AbilityTargetsIndex): UnitTargetFlags;

        IsModifiable(): boolean;
    }
}

interface CDOTABaseAbilityExtended extends CDOTABaseAbility {
    _intrinsicModifier: CDOTA_Buff | undefined;
    _projectilesData: Map<ProjectileID, object> | undefined;
    _GetLevelSpecialValueNoOverrideVanilla(name: string, level: number): number;
}

function GetLevelSpecialValueNoOverrideInternal(
    this: void,
    ability: CDOTABaseAbility,
    baseSpecivalValue: number,
    name: string,
    level: number,
    ignoreTalents?: boolean
): number {
    if (ignoreTalents == true) {
        return baseSpecivalValue;
    }

    return Talents.GetAbilitySpecialValueAfterTalentsModifiers(ability.GetCaster(), ability.GetAbilityName(), name, baseSpecivalValue);
}

// @ts-ignore
CDOTABaseAbility = CDOTABaseAbility || C_DOTABaseAbility;

(CDOTABaseAbility as unknown as CDOTABaseAbilityExtended)._GetLevelSpecialValueNoOverrideVanilla =
    (CDOTABaseAbility as unknown as CDOTABaseAbilityExtended)._GetLevelSpecialValueNoOverrideVanilla ??
    CDOTABaseAbility.GetLevelSpecialValueNoOverride;

CDOTABaseAbility.GetLevelSpecialValueNoOverride = function (name: string, level: number, ignoreTalents?: boolean) {
    const convertedAbility = this as unknown as CDOTABaseAbilityExtended;

    const baseValue: number = convertedAbility._GetLevelSpecialValueNoOverrideVanilla(name, level);

    return GetLevelSpecialValueNoOverrideInternal(this, baseValue, name, level, ignoreTalents);
};

CDOTABaseAbility.IsModifiable = function () {
    return tonumber(GetItemKV(this.GetName(), "IsModifiable")) == 1;
};

if (IsServer()) {
    CDOTABaseAbility.GetAbilityTargetTeam = function (index?: AbilityTargetsIndex) {
        index = index == undefined ? 0 : index;

        return AbilityTargets.GetAbilityTargetTeam(this, index);
    };

    CDOTABaseAbility.GetAbilityTargetType = function (index?: AbilityTargetsIndex) {
        index = index == undefined ? 0 : index;

        return AbilityTargets.GetAbilityTargetType(this, index);
    };

    CDOTABaseAbility.GetAbilityTargetFlags = function (index?: AbilityTargetsIndex) {
        index = index == undefined ? 0 : index;

        return AbilityTargets.GetAbilityTargetFlags(this, index);
    };

    CDOTABaseAbility.SetIntrinsicModifier = function (modifier: CDOTA_Buff) {
        const convertedAbility = this as unknown as CDOTABaseAbilityExtended;

        convertedAbility._intrinsicModifier = modifier;
    };

    CDOTABaseAbility.GetIntrinsicModifier = function () {
        const convertedAbility = this as unknown as CDOTABaseAbilityExtended;

        return convertedAbility._intrinsicModifier;
    };

    CDOTABaseAbility.GetProjectileData = function (projectileID: ProjectileID) {
        const convertedAbility = this as unknown as CDOTABaseAbilityExtended;

        return convertedAbility._projectilesData?.get(projectileID);
    };

    CDOTABaseAbility.SetProjectileData = function (projectileID: ProjectileID, data: object) {
        const convertedAbility = this as unknown as CDOTABaseAbilityExtended;

        if (convertedAbility._projectilesData == undefined) {
            convertedAbility._projectilesData = new Map<ProjectileID, object>();
        }

        convertedAbility._projectilesData.set(projectileID, data);
    };
}

if (IsServer()) {
    class CDOTABaseAbilityInitializer {
        private static _initialized: boolean;

        constructor() {
            if (CDOTABaseAbilityInitializer._initialized) {
                return;
            }

            CustomEvents.RegisterEventHandler(CustomEvent.CUSTOM_EVENT_ON_MODIFIER_ADDED, (event) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const modifier = (event as any).modifier as CDOTA_Buff;
                const ability = modifier.GetAbility();

                if (ability == undefined) {
                    return;
                }

                if (ability.GetIntrinsicModifierName() != modifier.GetName()) {
                    return;
                }

                ability.SetIntrinsicModifier(modifier);
            });

            CDOTABaseAbilityInitializer._initialized = true;
        }
    }

    new CDOTABaseAbilityInitializer();
}
