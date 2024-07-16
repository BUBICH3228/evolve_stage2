/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Utility } from "../libraries/utility";

export class GenericAIBehavior {
    static IsCanRetreatToSpawnPosition(state: boolean): boolean {
        return true;
    }

    static IsCanRespondToHelpCall(): boolean {
        return true;
    }

    static IsCanTargetNeutralCreeps(): boolean {
        return true;
    }

    static IsCanAdjustPathToGoal(): boolean {
        return false;
    }

    static IsCompletelyForgetAboutInvisibleEnemies(): boolean {
        return false;
    }
}

export class AICore {
    static TEMPORARY_AGGRO_DURATION = 5;

    static SEARCH_RANGE_FOR_BOYS_FOR_HELP = 300;

    static DISTANCE_TO_SPAWN_POSITION_TO_BE_CONSIDERED_REACHED_SQR = 625;
    static MAX_DISTANCE_FROM_SPAWN_POSITION = 850;
    static DISTANCE_TO_CURRENT_GOAL_TO_BE_CONSIDERED_REACHED_SQR = 250000;
    static MAX_DISTANCE_BETWEEN_UNITS_CAST_NO_TARGET_ABILITY = 450;

    static AI_ACTION_CASTED_AT_LEAST_ONE_ABILITY = 1;
    static AI_ACTION_CASTED_NOTHING = -1;

    static AI_THINK_END = -1;

    static AI_UNIT_FILTER_INVALID = 0;
    static AI_UNIT_FILTER_VALID = 1;

    static AI_GOAL_STATE_NOT_ADJUSTED = 0;
    static AI_GOAL_STATE_ADJUSTED = 1;

    static Init(thisEntity: CDOTA_BaseNPC_AICore, behavior: any): void {
        thisEntity.SetContextThink(
            "AICoreThink",
            function name() {
                if (GameRules.State_Get() < GameState.PRE_GAME) {
                    return 0.1;
                }

                if (!thisEntity.aiData) {
                    thisEntity.aiData = {
                        behavior: behavior,
                        isInCombat: false,
                        isRetreating: false,
                        isCastAbility: false,
                        currentGoals: [],
                        spawnPosition: thisEntity.GetAbsOrigin(),
                        aggroRange: thisEntity.GetAcquisitionRange(),
                        thinkInterval: 1,
                        isCanRetreat: behavior.IsCanRetreatToSpawnPosition(),
                        isCanRespondToHelpCall: behavior.IsCanRespondToHelpCall(),
                        isCanTargetNeutralCreeps: behavior.IsCanTargetNeutralCreeps(),
                        isCanAdjustPathToGoal: behavior.IsCanAdjustPathToGoal(),
                        isCompletelyForgetAboutInvisibleEnemies: behavior.IsCompletelyForgetAboutInvisibleEnemies(),
                        isNextGoalAdjusted: AICore.AI_GOAL_STATE_ADJUSTED,
                        temporaryAggroList: {},
                        abilitiesWithAllyTarget: [],
                        abilitiesWithEnemyTarget: []
                    };
                    thisEntity.SetAcquisitionRange(0);
                    AICore.InitAbilitiesList(thisEntity);
                    return 0.1;
                }
                const thinkResult = AICore.Think(thisEntity);
                return thinkResult;
            },
            0.1
        );
    }

    static OnTakeDamage(thisEntity: CDOTA_BaseNPC, attacker: CDOTA_BaseNPC) {
        if (!(thisEntity as CDOTA_BaseNPC_AICore).aiData) {
            return;
        }
        if (AICore.IsRetreating(thisEntity as CDOTA_BaseNPC_AICore) == false) {
            const enemies: CDOTA_BaseNPC[] = [attacker];
            AICore.SetInCombat(thisEntity as CDOTA_BaseNPC_AICore, true);
            const actionResult = AICore.TryAttackEnemies(thisEntity as CDOTA_BaseNPC_AICore, enemies);
            if (actionResult != AICore.AI_ACTION_CASTED_NOTHING) {
                return AICore.GetThinkInterval(thisEntity as CDOTA_BaseNPC_AICore);
            }
        }
    }

    static Think(thisEntity: CDOTA_BaseNPC_AICore): number {
        if (thisEntity.IsNull() || !thisEntity.IsAlive() || thisEntity.IsControllableByAnyPlayer() || thisEntity.GetPlayerOwnerID() > -1) {
            return AICore.AI_THINK_END;
        }

        if (GameRules.IsGamePaused()) {
            return AICore.GetThinkInterval(thisEntity);
        }

        if (thisEntity.IsChanneling()) {
            return AICore.GetThinkInterval(thisEntity);
        }

        if (thisEntity.IsCommandRestricted()) {
            return AICore.GetThinkInterval(thisEntity);
        }

        const currentEntityPosition = thisEntity.GetAbsOrigin();
        let searchRadius = AICore.GetAggroRange(thisEntity);

        if (AICore.IsRetreating(thisEntity) == true) {
            AICore.RetreatToHome(thisEntity);
            const distanceToSpawnPosition = Utility.CalculateDistanceSqr(currentEntityPosition, AICore.GetSpawnPosition(thisEntity));
            if (distanceToSpawnPosition <= AICore.DISTANCE_TO_SPAWN_POSITION_TO_BE_CONSIDERED_REACHED_SQR) {
                AICore.SetIsRetreating(thisEntity, false);
                thisEntity.Stop();
            }
            return AICore.GetThinkInterval(thisEntity);
        }

        if (AICore.IsInCombat(thisEntity)) {
            searchRadius *= 10;
        }

        if (AICore.IsCanRetreat(thisEntity) == true) {
            const distanceToSpawnPosition = Utility.CalculateDistance(currentEntityPosition, AICore.GetSpawnPosition(thisEntity));
            if (distanceToSpawnPosition > AICore.MAX_DISTANCE_FROM_SPAWN_POSITION) {
                AICore.RetreatToHome(thisEntity);
                return AICore.GetThinkInterval(thisEntity);
            }
        }

        const currentEntityTeam = thisEntity.GetTeamNumber();
        const enemies = AICore.FindEnemiesAround(currentEntityTeam, currentEntityPosition, searchRadius);

        if (enemies.length > 0) {
            AICore.SetInCombat(thisEntity, true);
            AICore.SetIsNextGoalAdjusted(thisEntity, AICore.AI_GOAL_STATE_NOT_ADJUSTED);
            const actionResult = AICore.TryAttackEnemies(thisEntity, enemies);
            if (actionResult != AICore.AI_ACTION_CASTED_NOTHING) {
                return AICore.GetThinkInterval(thisEntity);
            }
        } else {
            AICore.AdjustNextGoal(thisEntity);
            AICore.SetInCombat(thisEntity, false);
        }

        if (AICore.IsInCombat(thisEntity) == true) {
            const allies = AICore.FindAlliesAround(currentEntityTeam, currentEntityPosition, AICore.SEARCH_RANGE_FOR_BOYS_FOR_HELP);
            if (allies.length > 0) {
                const actionResult = AICore.TryHelpAllies(thisEntity, allies);
                for (const thisEntity of allies as CDOTA_BaseNPC_AICore[]) {
                    AICore.SetInCombat(thisEntity, true);
                }
                if (actionResult != AICore.AI_ACTION_CASTED_NOTHING) {
                    return AICore.GetThinkInterval(thisEntity);
                }
            }
        } else {
            if (AICore.IsCanRetreat(thisEntity) == true) {
                const distanceToSpawnPosition = Utility.CalculateDistanceSqr(currentEntityPosition, AICore.GetSpawnPosition(thisEntity));
                if (distanceToSpawnPosition > AICore.DISTANCE_TO_SPAWN_POSITION_TO_BE_CONSIDERED_REACHED_SQR) {
                    AICore.RetreatToHome(thisEntity);
                }
            } else {
                AICore.MoveToNextGoal(thisEntity);
            }
        }
        return AICore.GetThinkInterval(thisEntity);
    }

    static InitAbilitiesList(thisEntity: CDOTA_BaseNPC_AICore) {
        for (let index = 0; index < thisEntity.GetAbilityCount(); index++) {
            const offensiveAbility = AICore.FindAbility(thisEntity, index);
            //const supportAbility = AICore.FindAbility(thisEntity, index);
            //if (supportAbility != undefined) {
            //    table.insert(thisEntity.aiData.abilitiesWithAllyTarget, supportAbility);
            //}
            if (offensiveAbility != undefined) {
                table.insert(thisEntity.aiData.abilitiesWithEnemyTarget, offensiveAbility);
            }
        }
    }

    static FindAbility(unit: CDOTA_BaseNPC_AICore, index: number): CDOTABaseAbility_AICore | undefined {
        const ability = unit.GetAbilityByIndex(index) as CDOTABaseAbility_AICore;
        if (!ability || ability.GetName() == "twin_gate_portal_warp") {
            return undefined;
        }
        const abilityTargetTeam = ability.GetAbilityTargetTeam();
        const isAllyTargetAbility = bit.band(abilityTargetTeam, UnitTargetTeam.FRIENDLY) == UnitTargetTeam.FRIENDLY;
        const isEnemyTargetAbility = bit.band(abilityTargetTeam, UnitTargetTeam.ENEMY) == UnitTargetTeam.ENEMY;
        const isBothTeamTargetAbility = bit.band(abilityTargetTeam, UnitTargetTeam.BOTH) == UnitTargetTeam.BOTH;
        if ((isAllyTargetAbility == true && isEnemyTargetAbility == true) || isBothTeamTargetAbility == true) {
            Utility.Debug_PrintError(
                "[AICore] " +
                    tostring(unit.GetUnitName()) +
                    " has ability named " +
                    tostring(ability.GetAbilityName()) +
                    " that can be used on both allies and enemies. No idea what to do with it. Ignoring."
            );
            return undefined;
        }
        const abilityBehavior = ability.GetBehaviorInt();
        if (
            bit.band(abilityBehavior, AbilityBehavior.PASSIVE) == AbilityBehavior.PASSIVE ||
            bit.band(abilityBehavior, AbilityBehavior.AURA) == AbilityBehavior.AURA
        ) {
            ability.behavior = AbilityBehavior.PASSIVE;
        } else if (bit.band(abilityBehavior, AbilityBehavior.UNIT_TARGET) == AbilityBehavior.UNIT_TARGET) {
            ability.behavior = AbilityBehavior.UNIT_TARGET;
        } else if (bit.band(abilityBehavior, AbilityBehavior.NO_TARGET) == AbilityBehavior.NO_TARGET) {
            ability.behavior = AbilityBehavior.NO_TARGET;
        } else if (bit.band(abilityBehavior, AbilityBehavior.POINT) == AbilityBehavior.POINT) {
            ability.behavior = AbilityBehavior.POINT;
        } else if (bit.band(abilityBehavior, AbilityBehavior.TOGGLE) == AbilityBehavior.TOGGLE) {
            ability.behavior = AbilityBehavior.TOGGLE;
        }
        if (!ability.behavior) {
            Utility.Debug_PrintError(
                "[AICore] " +
                    tostring(unit.GetUnitName()) +
                    " has ability named " +
                    tostring(ability.GetAbilityName()) +
                    " with unsupported behavior. No idea what to do with it. Ignoring."
            );
            return undefined;
        }
        return ability;
    }

    static FindAlliesAround(thisEntityTeam: DotaTeam, thisEntityPosition: Vector, searchRadius: number) {
        const enemies = FindUnitsInRadius(
            thisEntityTeam,
            thisEntityPosition,
            undefined,
            searchRadius,
            UnitTargetTeam.FRIENDLY,
            UnitTargetType.HERO + UnitTargetType.BASIC,
            UnitTargetFlags.FOW_VISIBLE,
            FindOrder.CLOSEST,
            false
        );
        return enemies;
    }

    static FindEnemiesAround(thisEntityTeam: DotaTeam, thisEntityPosition: Vector, searchRadius: number) {
        const enemies = FindUnitsInRadius(
            thisEntityTeam,
            thisEntityPosition,
            undefined,
            searchRadius,
            UnitTargetTeam.ENEMY,
            UnitTargetType.HERO + UnitTargetType.BASIC + UnitTargetType.OTHER + UnitTargetType.BUILDING,
            UnitTargetFlags.MAGIC_IMMUNE_ENEMIES + UnitTargetFlags.FOW_VISIBLE,
            FindOrder.CLOSEST,
            false
        );
        return enemies;
    }

    static RetreatToHome(thisEntity: CDOTA_BaseNPC_AICore) {
        AICore.SetInCombat(thisEntity, false);
        if (thisEntity.HasMovementCapability() == false) {
            return;
        }
        AICore.SetIsRetreating(thisEntity, true);
        ExecuteOrderFromTable({
            UnitIndex: thisEntity.entindex(),
            OrderType: UnitOrder.MOVE_TO_POSITION,
            Position: AICore.GetSpawnPosition(thisEntity),
            Queue: false
        });
    }

    static EnemyUnitFilter(thisEntity: CDOTA_BaseNPC_AICore, target: CDOTA_BaseNPC): number {
        if (!target || target.IsNull() == true || target.IsAlive() == false) {
            return AICore.AI_UNIT_FILTER_INVALID;
        }
        if (AICore.IsCompletelyForgetAboutInvisibleEnemies(thisEntity) == true && thisEntity.CanEntityBeSeenByMyTeam(target) == false) {
            return AICore.AI_UNIT_FILTER_INVALID;
        }
        if (target.IsPhantom() == true || target.IsPhantomBlocker() == true) {
            return AICore.AI_UNIT_FILTER_INVALID;
        }
        if (target.IsControllableByAnyPlayer() == true) {
            return AICore.AI_UNIT_FILTER_VALID;
        }
        if (AICore.IsCanTargetNeutralCreeps(thisEntity) == false) {
            if (target.IsNeutralUnitType() == true) {
                return AICore.AI_UNIT_FILTER_INVALID;
            }
        }
        return AICore.AI_UNIT_FILTER_VALID;
    }

    static SetInCombat(thisEntity: CDOTA_BaseNPC_AICore, state: boolean) {
        if (thisEntity.aiData != undefined) {
            if (state != true && state != false) {
                Utility.Debug_PrintError(
                    "[AICore] Attempt to set combat state to invalid value = " + tostring(state) + ". Using default value = false."
                );
                state = false;
            }
            thisEntity.aiData.isInCombat = state;
        }
    }

    static IsInCombat(thisEntity: CDOTA_BaseNPC_AICore) {
        if (thisEntity.aiData != undefined) {
            return thisEntity.aiData.isInCombat;
        }

        return false;
    }

    static SetIsRetreating(thisEntity: CDOTA_BaseNPC_AICore, state: boolean) {
        if (thisEntity.aiData != undefined) {
            if (state != true && state != false) {
                Utility.Debug_PrintError(
                    "[AICore] Attempt to set retreating state to invalid value = " + tostring(state) + ". Using default value = false."
                );
                state = false;
            }
            thisEntity.aiData.isRetreating = state;
        }
    }

    static IsRetreating(thisEntity: CDOTA_BaseNPC_AICore) {
        if (thisEntity.aiData != undefined) {
            return thisEntity.aiData.isRetreating;
        }

        return false;
    }

    static SetIsCastAbility(thisEntity: CDOTA_BaseNPC_AICore, state: boolean) {
        if (thisEntity.aiData != undefined) {
            if (state != true && state != false) {
                Utility.Debug_PrintError(
                    "[AICore] Attempt to set retreating state to invalid value = " + tostring(state) + ". Using default value = false."
                );
                state = false;
            }
            thisEntity.aiData.isCastAbility = state;
        }
    }

    static IsCastAbility(thisEntity: CDOTA_BaseNPC_AICore) {
        if (thisEntity.aiData != undefined) {
            return thisEntity.aiData.isCastAbility;
        }

        return false;
    }

    static IsCompletelyForgetAboutInvisibleEnemies(thisEntity: CDOTA_BaseNPC_AICore) {
        if (thisEntity.aiData != undefined) {
            return thisEntity.aiData.isCompletelyForgetAboutInvisibleEnemies;
        }

        return false;
    }

    static IsCanTargetNeutralCreeps(thisEntity: CDOTA_BaseNPC_AICore): boolean {
        if (thisEntity.aiData != undefined) {
            return thisEntity.aiData.isCanTargetNeutralCreeps;
        }

        return false;
    }

    static IsCanRetreat(thisEntity: CDOTA_BaseNPC_AICore) {
        if (thisEntity.aiData != undefined) {
            return thisEntity.aiData.isCanRetreat;
        }

        return false;
    }

    static GetSpawnPosition(thisEntity: CDOTA_BaseNPC_AICore): Vector {
        if (thisEntity.aiData != undefined) {
            return thisEntity.aiData.spawnPosition;
        }

        return Vector(0, 0, 0);
    }

    static GetAggroRange(thisEntity: CDOTA_BaseNPC_AICore) {
        if (thisEntity.aiData != undefined) {
            return thisEntity.aiData.aggroRange;
        }

        return 0;
    }

    static GetThinkInterval(thisEntity: CDOTA_BaseNPC_AICore): number {
        if (thisEntity.aiData != undefined) {
            return thisEntity.aiData.thinkInterval;
        }

        return -1;
    }

    static GetCurrentGoalEntity(thisEntity: CDOTA_BaseNPC_AICore): any {
        if (thisEntity.aiData && thisEntity.aiData.currentGoals.length != undefined) {
            return thisEntity.aiData.currentGoals[0];
        }
        return undefined;
    }

    static GetAllGoalEntities(thisEntity: CDOTA_BaseNPC_AICore): any[] {
        if (thisEntity.aiData && thisEntity.aiData.currentGoals != undefined) {
            return thisEntity.aiData.currentGoals;
        }
        return [];
    }

    static GetGoalEntitiesCount(thisEntity: CDOTA_BaseNPC_AICore) {
        if (thisEntity.aiData && thisEntity.aiData.currentGoals != undefined) {
            return thisEntity.aiData.currentGoals.length;
        }
        return 0;
    }

    static AddGoalEntity(thisEntity: CDOTA_BaseNPC_AICore, goalEntity: any) {
        if (thisEntity.aiData != undefined) {
            table.insert(thisEntity.aiData.currentGoals, goalEntity);
        }
    }

    static RemoveGoalEntity(thisEntity: CDOTA_BaseNPC_AICore, goalEntity: any) {
        if (thisEntity.aiData != undefined) {
            //Utility.CalculateDistance(AICore.GetAllGoalEntities(thisEntity) as any, function (t: any, i: any, j: any) {
            //    const goal = t[i];
            //    return goal != goalEntity;
            //});
        }
    }

    static RemoveAllGoalEntities(thisEntity: CDOTA_BaseNPC_AICore) {
        if (thisEntity.aiData != undefined) {
            //Utility.CalculateDistance(AICore.GetAllGoalEntities(thisEntity) as any, function (t, i, j) {
            //    return false;
            //});
        }
    }

    static SetInitialGoalEntity(thisEntity: CDOTA_BaseNPC_AICore, goalEntity: any) {
        if (thisEntity.aiData && goalEntity) {
            AICore.AddGoalEntity(thisEntity, goalEntity);
            if (goalEntity.next_corner && goalEntity.next_corner != goalEntity) {
                AICore.SetInitialGoalEntity(thisEntity, goalEntity.next_corner);
            }
        }
    }

    static IsCanAdjustPathToGoal(thisEntity: CDOTA_BaseNPC_AICore) {
        if (thisEntity.aiData && thisEntity.aiData.isCanAdjustPathToGoal != undefined) {
            return thisEntity.aiData.isCanAdjustPathToGoal;
        }
        return false;
    }

    static SetIsNextGoalAdjusted(thisEntity: CDOTA_BaseNPC_AICore, value: number) {
        if (thisEntity.aiData && thisEntity.aiData.isNextGoalAdjusted != undefined) {
            thisEntity.aiData.isNextGoalAdjusted = value;
        }
    }

    static IsNextGoalAdjusted(thisEntity: CDOTA_BaseNPC_AICore): number | boolean {
        if (thisEntity.aiData != undefined) {
            return thisEntity.aiData.isNextGoalAdjusted || true;
        }
        return true;
    }

    static AdjustNextGoal(thisEntity: CDOTA_BaseNPC_AICore): void {
        if (!thisEntity.aiData) {
            return;
        }
        if (AICore.IsCanAdjustPathToGoal(thisEntity) == false) {
            return;
        }
        if (AICore.IsNextGoalAdjusted(thisEntity) == AICore.AI_GOAL_STATE_ADJUSTED) {
            return;
        }

        if (AICore.GetGoalEntitiesCount(thisEntity) < 2) {
            return;
        }

        const goalEntities = AICore.GetAllGoalEntities(thisEntity);
        let currentGoal = AICore.GetCurrentGoalEntity(thisEntity);
        const currentEntityPosition = thisEntity.GetAbsOrigin();
        if (currentGoal == undefined) {
            return;
        }

        let distancetoLatestKnownGoal = Utility.CalculateDistanceSqr(currentGoal.GetAbsOrigin(), currentEntityPosition);
        let distanceToCurrentCheckingGoal = 0;

        for (let i = goalEntities.length; i < goalEntities.length; i++) {
            if (goalEntities[i] == undefined) {
                return;
            }
            distanceToCurrentCheckingGoal = Utility.CalculateDistanceSqr(goalEntities[i].GetAbsOrigin(), currentEntityPosition);
            if (distanceToCurrentCheckingGoal < distancetoLatestKnownGoal) {
                currentGoal = goalEntities[i];
                distancetoLatestKnownGoal = distanceToCurrentCheckingGoal;
            }
        }

        AICore.RemoveAllGoalEntities(thisEntity);
        AICore.SetInitialGoalEntity(thisEntity, currentGoal);
        AICore.SetIsNextGoalAdjusted(thisEntity, AICore.AI_GOAL_STATE_ADJUSTED);
    }

    static MoveToNextGoal(thisEntity: CDOTA_BaseNPC_AICore) {
        if (!thisEntity.aiData) {
            return;
        }
        const currentGoal = AICore.GetCurrentGoalEntity(thisEntity);
        if (!currentGoal) {
            return;
        }
        const goalPosition = currentGoal.GetAbsOrigin();
        AICore.MoveToPosition(thisEntity, goalPosition);
        const distanceToGoal = Utility.CalculateDistanceSqr(goalPosition, thisEntity.GetAbsOrigin());
        if (distanceToGoal <= AICore.DISTANCE_TO_CURRENT_GOAL_TO_BE_CONSIDERED_REACHED_SQR) {
            if (AICore.GetGoalEntitiesCount(thisEntity) > 1) {
                AICore.RemoveGoalEntity(thisEntity, currentGoal);
                AICore.MoveToNextGoal(thisEntity);
            }
        }
    }

    static MoveToPosition(thisEntity: CDOTA_BaseNPC_AICore, position: Vector) {
        if (position == undefined || thisEntity.HasMovementCapability() == false) {
            return;
        }
        ExecuteOrderFromTable({
            UnitIndex: thisEntity.entindex(),
            OrderType: UnitOrder.MOVE_TO_POSITION,
            Position: position,
            Queue: false
        });
    }

    static TryAttackEnemies(thisEntity: CDOTA_BaseNPC_AICore, enemies: CDOTA_BaseNPC[]): number {
        thisEntity.aiData.abilitiesWithEnemyTarget.forEach((ability) => {
            const actionResult = AICore.TryCastAbility(ability as CDOTABaseAbility_AICore, thisEntity, enemies);
            if (actionResult != AICore.AI_ACTION_CASTED_NOTHING) {
                return actionResult;
            }
        });

        if (AICore.IsCastAbility(thisEntity) == false) {
            AICore.AttackTarget(thisEntity, enemies[0]);
        }
        AICore.SetInCombat(thisEntity, true);
        return AICore.AI_ACTION_CASTED_NOTHING;
    }

    static AttackTarget(thisEntity: CDOTA_BaseNPC_AICore, enemy: CDOTA_BaseNPC) {
        if (enemy == undefined || thisEntity.HasMovementCapability() == false) {
            return;
        }
        if (AICore.EnemyUnitFilter(thisEntity, enemy) == AICore.AI_UNIT_FILTER_INVALID) {
            return;
        }
        AICore.SetInCombat(thisEntity, true);
        if (thisEntity.CanEntityBeSeenByMyTeam(enemy) == false) {
            AICore.MoveToPosition(thisEntity, enemy.GetAbsOrigin());
            return;
        }
        ExecuteOrderFromTable({
            UnitIndex: thisEntity.entindex(),
            OrderType: UnitOrder.ATTACK_TARGET,
            TargetIndex: enemy.entindex(),
            Queue: false
        });
    }

    static TryHelpAllies(thisEntity: CDOTA_BaseNPC_AICore, allies: CDOTA_BaseNPC[]) {
        thisEntity.aiData.abilitiesWithAllyTarget.forEach((ability) => {
            const actionResult = AICore.TryCastAbility(ability as CDOTABaseAbility_AICore, thisEntity, allies);
            if (actionResult != AICore.AI_ACTION_CASTED_NOTHING) {
                AICore.SetInCombat(thisEntity, true);
                return actionResult;
            }
        });

        return AICore.AI_ACTION_CASTED_NOTHING;
    }

    static TryCastAbility(ability: CDOTABaseAbility_AICore, caster: CDOTA_BaseNPC_AICore, allTargets: CDOTA_BaseNPC[]) {
        if (ability.IsFullyCastable() == false || ability.behavior == AbilityBehavior.PASSIVE) {
            return AICore.AI_ACTION_CASTED_NOTHING;
        }
        if (ability.GetMaxAbilityCharges(ability.GetLevel()) > 0 && ability.GetCurrentAbilityCharges() == 0) {
            return AICore.AI_ACTION_CASTED_NOTHING;
        }
        if (ability.IsCooldownReady() == false) {
            return AICore.AI_ACTION_CASTED_NOTHING;
        }
        const target = allTargets[RandomInt(0, allTargets.length - 1)];
        if (target != undefined) {
            if (caster.CanEntityBeSeenByMyTeam(target) == false) {
                AICore.MoveToPosition(caster, target.GetAbsOrigin());
                return;
            }
            const orderType = AICore.GetOrderTypeFromAbilityBehaviour(ability);
            const distanceBetweenUnits = Utility.CalculateDistance(caster.GetAbsOrigin(), target.GetAbsOrigin());
            if (orderType == UnitOrder.CAST_NO_TARGET && distanceBetweenUnits > AICore.MAX_DISTANCE_BETWEEN_UNITS_CAST_NO_TARGET_ABILITY) {
                AICore.MoveToPosition(caster, target.GetAbsOrigin());
                return AICore.AI_ACTION_CASTED_NOTHING;
            }
            ExecuteOrderFromTable({
                UnitIndex: caster.entindex(),
                OrderType: orderType,
                AbilityIndex: ability.entindex(),
                TargetIndex: target.entindex(),
                Position: target.GetAbsOrigin(),
                Queue: false
            });
            AICore.SetIsCastAbility(caster, true);
            Timers.CreateTimer(2, () => {
                AICore.SetIsCastAbility(caster, false);
            });
            return AICore.AI_ACTION_CASTED_AT_LEAST_ONE_ABILITY;
        }
        return AICore.AI_ACTION_CASTED_NOTHING;
    }
    static GetOrderTypeFromAbilityBehaviour(ability: CDOTABaseAbility_AICore): number {
        if (ability.behavior == AbilityBehavior.UNIT_TARGET) {
            return UnitOrder.CAST_TARGET;
        } else if (ability.behavior == AbilityBehavior.NO_TARGET) {
            return UnitOrder.CAST_NO_TARGET;
        } else if (ability.behavior == AbilityBehavior.POINT) {
            return UnitOrder.CAST_POSITION;
        } else if (ability.behavior == AbilityBehavior.TOGGLE) {
            return UnitOrder.CAST_TOGGLE;
        } else if (ability.behavior == AbilityBehavior.PASSIVE) {
            return -1;
        }
        return -1;
    }
}

export interface CDOTA_BaseNPC_AICore extends CDOTA_BaseNPC {
    aiData: {
        behavior: any;
        isInCombat: boolean;
        isRetreating: boolean;
        currentGoals: any[];
        spawnPosition: Vector;
        aggroRange: number;
        thinkInterval: number;
        isCanRetreat: boolean;
        isCanRespondToHelpCall: boolean;
        isCanTargetNeutralCreeps: boolean;
        isCanAdjustPathToGoal: boolean;
        isCompletelyForgetAboutInvisibleEnemies: boolean;
        isNextGoalAdjusted: number;
        temporaryAggroList: { [key: string]: number };
        abilitiesWithAllyTarget: CDOTABaseAbility[];
        abilitiesWithEnemyTarget: CDOTABaseAbility[];
        isCastAbility: boolean;
    };
}

declare interface CDOTABaseAbility_AICore extends CDOTABaseAbility {
    behavior: AbilityBehavior;
}
