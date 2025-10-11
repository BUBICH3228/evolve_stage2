/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { registerModifier, BaseModifier } from "../libraries/dota_ts_adapter";
import { GenericAIBehavior } from "./generic_ai_behavior";
export class AICore {
    static DISTANCE_TO_SPAWN_POSITION_TO_BE_CONSIDERED_REACHED_SQR = 625;
    static MAX_DISTANCE_FROM_SPAWN_POSITION = 550;
    static MAX_DISTANCE_BETWEEN_UNITS_CAST_NO_TARGET_ABILITY = 450;
    static AI_ACTION_CASTED_AT_LEAST_ONE_ABILITY = 1;
    static AI_ACTION_CASTED_NOTHING = -1;
    static AI_THINK_END = -1;
    static AI_UNIT_FILTER_INVALID = 0;
    static AI_UNIT_FILTER_VALID = 1;
    static PATROL_POINT_WAIT_TIME = 8;
    static PATROL_POINT_REACH_DISTANCE_SQR = 5625;
    static PATROL_HISTORY_SIZE = 10;
    static PATROL_SEARCH_RADIUS_INITIAL = 500;
    static PATROL_SEARCH_RADIUS_MAX = 2000;
    static PATROL_SEARCH_RADIUS_INCREMENT = 200;
    static PATROL_IDLE_MOVEMENT_RANGE = 120;
    static IDLE_MOVEMENT_CHANCE = 0.2;
    static IDLE_MOVEMENT_MIN_TIME = 2;
    static IDLE_MOVEMENT_MAX_TIME = 4;

    static Init(thisEntity: CDOTA_BaseNPC_AICore, behavior: GenericAIBehavior): void {
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
                        thinkInterval: 0.2,
                        isCanRetreat: behavior.IsCanRetreatToSpawnPosition(),
                        IsCanAttackFirst: behavior.IsCanAttackFirst(),
                        IsAggressiveForm: behavior.IsAggressiveForm(),
                        abilitiesWithAllyTarget: [],
                        abilitiesWithEnemyTarget: [],
                        patrolPoints: [],
                        currentPatrolPoint: undefined,
                        patrolPointHistory: [],
                        isWaitingAtPoint: false,
                        waitEndTime: 0,
                        idleMovementPosition: undefined,
                        patrolSearchRadius: AICore.PATROL_SEARCH_RADIUS_INITIAL
                    };

                    if (behavior.OnInit != undefined) {
                        behavior.OnInit(thisEntity);
                    }

                    thisEntity.SetAcquisitionRange(0);

                    AICore.InitAbilitiesList(thisEntity);

                    AICore.InitPatrolPoints(thisEntity);

                    return 0.1;
                }
                const thinkResult = AICore.Think(thisEntity);
                return thinkResult;
            },
            0.1
        );
    }

    static Think(thisEntity: CDOTA_BaseNPC_AICore): number {
        if (thisEntity.IsNull() || !thisEntity.IsAlive()) {
            return AICore.AI_THINK_END;
        }

        if (thisEntity.IsControllableByAnyPlayer() || thisEntity.GetPlayerOwnerID() > -1) {
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
        const searchRadius = AICore.GetAggroRange(thisEntity);

        if (AICore.IsWaitingAtPoint(thisEntity)) {
            AICore.UpdateIdleMovement(thisEntity);
        }

        if (!AICore.IsInCombat(thisEntity) && !AICore.IsRetreating(thisEntity) && !AICore.IsCanRetreat(thisEntity)) {
            AICore.UpdatePatrol(thisEntity);
        }

        if (AICore.IsRetreating(thisEntity) == true) {
            AICore.RetreatToHome(thisEntity);
            const distanceToSpawnPosition = CalculateDistanceSqr(currentEntityPosition, AICore.GetSpawnPosition(thisEntity));
            if (distanceToSpawnPosition <= AICore.DISTANCE_TO_SPAWN_POSITION_TO_BE_CONSIDERED_REACHED_SQR) {
                AICore.SetIsRetreating(thisEntity, false);
                thisEntity.Stop();
            }
            return AICore.GetThinkInterval(thisEntity);
        }

        if (AICore.IsCanRetreat(thisEntity) == true) {
            const distanceToSpawnPosition = CalculateDistance(currentEntityPosition, AICore.GetSpawnPosition(thisEntity));
            if (distanceToSpawnPosition > AICore.MAX_DISTANCE_FROM_SPAWN_POSITION) {
                AICore.RetreatToHome(thisEntity);
                return AICore.GetThinkInterval(thisEntity);
            }
        }

        if (AICore.IsAggressiveForm(thisEntity) == false) {
            return AICore.GetThinkInterval(thisEntity);
        }

        const currentEntityTeam = thisEntity.GetTeamNumber();
        const enemies = AICore.FindEnemiesAround(currentEntityTeam, currentEntityPosition, searchRadius);

        const validEnemies = enemies.filter(
            (enemy) => enemy && !enemy.IsNull() && enemy.IsAlive() && thisEntity.CanEntityBeSeenByMyTeam(enemy) && !enemy.IsWard()
        );

        if (validEnemies.length > 0 && (AICore.IsInCombat(thisEntity) || AICore.IsCanAttackFirst(thisEntity))) {
            AICore.SetInCombat(thisEntity, true);
            AICore.TryAttackEnemies(thisEntity, validEnemies);
        } else if (AICore.IsInCombat(thisEntity) && validEnemies.length === 0) {
            AICore.SetInCombat(thisEntity, false);

            if (AICore.GetCurrentPatrolPoint(thisEntity) && !AICore.IsRetreating(thisEntity)) {
                AICore.SetIsWaitingAtPoint(thisEntity, false);
                AICore.SetIdleMovementPosition(thisEntity, undefined);
                AICore.MoveToPosition(thisEntity, AICore.GetCurrentPatrolPoint(thisEntity)!.GetAbsOrigin());
            }
        }

        return AICore.GetThinkInterval(thisEntity);
    }

    static OnTakeDamage(thisEntity: CDOTA_BaseNPC, attacker: CDOTA_BaseNPC) {
        if (!(thisEntity as CDOTA_BaseNPC_AICore).aiData) {
            return;
        }

        if (AICore.IsAggressiveForm(thisEntity as CDOTA_BaseNPC_AICore) == false) {
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

    static InitPatrolPoints(thisEntity: CDOTA_BaseNPC_AICore): void {
        const allMovementPoints = Entities.FindAllByName("Point_movement");
        thisEntity.aiData.patrolPoints = allMovementPoints;

        if (allMovementPoints.length > 0) {
            const nearestPoint = AICore.FindNearestPatrolPoint(thisEntity, allMovementPoints);
            AICore.SetCurrentPatrolPoint(thisEntity, nearestPoint);
            AICore.GetPatrolPointHistory(thisEntity).push(nearestPoint);

            AICore.MoveToPosition(thisEntity, nearestPoint.GetAbsOrigin());
        }
    }

    static UpdatePatrol(thisEntity: CDOTA_BaseNPC_AICore): void {
        const aiData = thisEntity.aiData;

        if (aiData.isWaitingAtPoint) {
            if (GameRules.GetGameTime() >= aiData.waitEndTime) {
                aiData.isWaitingAtPoint = false;
                AICore.SetIdleMovementPosition(thisEntity, undefined);

                const nextPoint = AICore.GetNextPatrolPoint(thisEntity);
                if (nextPoint) {
                    aiData.currentPatrolPoint = nextPoint;
                    aiData.patrolPointHistory.push(nextPoint);

                    if (aiData.patrolPointHistory.length > AICore.PATROL_HISTORY_SIZE) {
                        aiData.patrolPointHistory.shift();
                    }

                    AICore.MoveToPosition(thisEntity, nextPoint.GetAbsOrigin());
                }
            } else {
                if (RandomFloat(0, 1) < 0.15 && !AICore.GetIdleMovementPosition(thisEntity)) {
                    AICore.DoIdleMovement(thisEntity);
                }
            }
            return;
        }

        const currentPoint = aiData.currentPatrolPoint;
        if (currentPoint) {
            const distanceSqr = CalculateDistanceSqr(thisEntity.GetAbsOrigin(), currentPoint.GetAbsOrigin());

            if (distanceSqr <= AICore.PATROL_POINT_REACH_DISTANCE_SQR) {
                aiData.isWaitingAtPoint = true;
                aiData.waitEndTime = GameRules.GetGameTime() + AICore.PATROL_POINT_WAIT_TIME;

                if (AICore.IsMoving(thisEntity)) {
                    thisEntity.Stop();
                }
            } else {
                AICore.MoveToPosition(thisEntity, currentPoint.GetAbsOrigin());
            }
        }
    }

    static FindNearestPatrolPoint(thisEntity: CDOTA_BaseNPC_AICore, points: CBaseEntity[]): CBaseEntity {
        let nearestPoint = points[0];
        let nearestDistance = CalculateDistanceSqr(thisEntity.GetAbsOrigin(), nearestPoint.GetAbsOrigin());

        for (let i = 1; i < points.length; i++) {
            const distance = CalculateDistanceSqr(thisEntity.GetAbsOrigin(), points[i].GetAbsOrigin());
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestPoint = points[i];
            }
        }

        return nearestPoint;
    }

    static GetNextPatrolPoint(thisEntity: CDOTA_BaseNPC_AICore): CBaseEntity | null {
        const patrolPoints = AICore.GetPatrolPoints(thisEntity);
        const history = AICore.GetPatrolPointHistory(thisEntity);
        const currentPosition = thisEntity.GetAbsOrigin();

        if (patrolPoints.length === 0) return null;

        let searchRadius = AICore.GetPatrolSearchRadius(thisEntity);
        let availablePoints: CBaseEntity[] = [];

        while (availablePoints.length === 0 && searchRadius <= AICore.PATROL_SEARCH_RADIUS_MAX) {
            availablePoints = patrolPoints.filter((point) => {
                const distance = CalculateDistanceSqr(currentPosition, point.GetAbsOrigin());
                const isInRadius = distance <= searchRadius * searchRadius;
                const isNotInHistory = !history.includes(point);
                return isInRadius && isNotInHistory;
            });

            if (availablePoints.length === 0) {
                searchRadius += AICore.PATROL_SEARCH_RADIUS_INCREMENT;
                AICore.SetPatrolSearchRadius(thisEntity, searchRadius);
            }
        }

        if (availablePoints.length > 0) {
            AICore.SetPatrolSearchRadius(thisEntity, AICore.PATROL_SEARCH_RADIUS_INITIAL);
            return AICore.FindNearestPatrolPoint(thisEntity, availablePoints);
        }

        AICore.SetPatrolSearchRadius(thisEntity, AICore.PATROL_SEARCH_RADIUS_INITIAL);

        if (history.length > 0) {
            AICore.SetPatrolPointHistory(thisEntity, [history[history.length - 1]]);

            const availableAfterReset = patrolPoints.filter((point) => point !== history[history.length - 1]);

            if (availableAfterReset.length > 0) {
                return AICore.FindNearestPatrolPoint(thisEntity, availableAfterReset);
            }
        }

        return patrolPoints[RandomInt(0, patrolPoints.length - 1)];
    }

    static DoIdleMovement(thisEntity: CDOTA_BaseNPC_AICore): void {
        if (!AICore.GetCurrentPatrolPoint(thisEntity)) return;

        const currentPos = thisEntity.GetAbsOrigin();
        const currentPoint = AICore.GetCurrentPatrolPoint(thisEntity)!.GetAbsOrigin();

        const distanceToMainPoint = CalculateDistanceSqr(currentPos, currentPoint);
        if (distanceToMainPoint <= AICore.PATROL_POINT_REACH_DISTANCE_SQR) {
            const randomAngle = RandomFloat(0, 2 * Math.PI);
            const randomDistance = RandomFloat(AICore.PATROL_IDLE_MOVEMENT_RANGE * 0.7, AICore.PATROL_IDLE_MOVEMENT_RANGE);

            const newX = currentPoint.x + Math.cos(randomAngle) * randomDistance;
            const newY = currentPoint.y + Math.sin(randomAngle) * randomDistance;
            const idlePosition = Vector(newX, newY, currentPoint.z);

            if (AICore.IsCanRetreat(thisEntity)) {
                const spawnPos = AICore.GetSpawnPosition(thisEntity);
                const distanceToSpawn = CalculateDistanceSqr(idlePosition, spawnPos);
                if (distanceToSpawn > AICore.MAX_DISTANCE_FROM_SPAWN_POSITION * AICore.MAX_DISTANCE_FROM_SPAWN_POSITION) {
                    return;
                }
            }

            AICore.SetIdleMovementPosition(thisEntity, idlePosition);
            AICore.MoveToPosition(thisEntity, idlePosition);

            const movementTime = RandomFloat(AICore.IDLE_MOVEMENT_MIN_TIME, AICore.IDLE_MOVEMENT_MAX_TIME);

            Timers.CreateTimer(movementTime, () => {
                if (AICore.IsWaitingAtPoint(thisEntity) && AICore.GetCurrentPatrolPoint(thisEntity)) {
                    AICore.SetIdleMovementPosition(thisEntity, undefined);
                }
                return undefined;
            });
        }
    }

    static UpdateIdleMovement(thisEntity: CDOTA_BaseNPC_AICore): void {
        const idlePosition = AICore.GetIdleMovementPosition(thisEntity);
        if (idlePosition && AICore.IsWaitingAtPoint(thisEntity)) {
            const distanceSqr = CalculateDistanceSqr(thisEntity.GetAbsOrigin(), idlePosition);

            if (distanceSqr <= AICore.PATROL_POINT_REACH_DISTANCE_SQR) {
                thisEntity.Stop();
                AICore.SetIdleMovementPosition(thisEntity, undefined);
            }
        }
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
            Debug_PrintError(
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
            Debug_PrintError(
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

    static FindEnemiesAround(thisEntityTeam: DotaTeam, thisEntityPosition: Vector, searchRadius: number) {
        const enemies = FindUnitsInRadius(
            thisEntityTeam,
            thisEntityPosition,
            undefined,
            searchRadius,
            UnitTargetTeam.ENEMY,
            UnitTargetType.HERO + UnitTargetType.BASIC + UnitTargetType.BUILDING,
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
        if (target.IsPhantom() == true || target.IsPhantomBlocker() == true) {
            return AICore.AI_UNIT_FILTER_INVALID;
        }
        if (target.IsControllableByAnyPlayer() == true) {
            return AICore.AI_UNIT_FILTER_VALID;
        }
        if (target.IsWard() == true) {
            return AICore.AI_UNIT_FILTER_VALID;
        }
        if (target.IsAttackImmune() == true) {
            return AICore.AI_UNIT_FILTER_VALID;
        }
        if (target.IsCourier() == true) {
            return AICore.AI_UNIT_FILTER_VALID;
        }
        return AICore.AI_UNIT_FILTER_VALID;
    }

    static GetPatrolSearchRadius(thisEntity: CDOTA_BaseNPC_AICore): number {
        if (thisEntity.aiData != undefined) {
            return thisEntity.aiData.patrolSearchRadius || AICore.PATROL_SEARCH_RADIUS_INITIAL;
        }
        return AICore.PATROL_SEARCH_RADIUS_INITIAL;
    }

    static SetPatrolSearchRadius(thisEntity: CDOTA_BaseNPC_AICore, radius: number): void {
        if (thisEntity.aiData != undefined) {
            thisEntity.aiData.patrolSearchRadius = radius;
        }
    }

    static GetIdleMovementPosition(thisEntity: CDOTA_BaseNPC_AICore): Vector | undefined {
        if (thisEntity.aiData != undefined) {
            return thisEntity.aiData.idleMovementPosition;
        }
        return undefined;
    }

    static SetIdleMovementPosition(thisEntity: CDOTA_BaseNPC_AICore, position: Vector | undefined): void {
        if (thisEntity.aiData != undefined) {
            thisEntity.aiData.idleMovementPosition = position;
        }
    }

    static SetPatrolPointHistory(thisEntity: CDOTA_BaseNPC_AICore, history: CBaseEntity[]): void {
        if (thisEntity.aiData != undefined) {
            thisEntity.aiData.patrolPointHistory = history;
        }
    }

    static IsAggressiveForm(thisEntity: CDOTA_BaseNPC_AICore): boolean {
        if (thisEntity.aiData != undefined) {
            return thisEntity.aiData.IsAggressiveForm;
        }
        return false;
    }

    static IsCanAttackFirst(thisEntity: CDOTA_BaseNPC_AICore): boolean {
        if (thisEntity.aiData != undefined) {
            return thisEntity.aiData.IsCanAttackFirst;
        }
        return false;
    }

    static GetCurrentPatrolPoint(thisEntity: CDOTA_BaseNPC_AICore): CBaseEntity | undefined {
        if (thisEntity.aiData != undefined) {
            return thisEntity.aiData.currentPatrolPoint;
        }
        return undefined;
    }

    static SetCurrentPatrolPoint(thisEntity: CDOTA_BaseNPC_AICore, point: CBaseEntity): void {
        if (thisEntity.aiData != undefined) {
            thisEntity.aiData.currentPatrolPoint = point;
        }
    }

    static IsWaitingAtPoint(thisEntity: CDOTA_BaseNPC_AICore): boolean {
        if (thisEntity.aiData != undefined) {
            return thisEntity.aiData.isWaitingAtPoint;
        }
        return false;
    }

    static SetIsWaitingAtPoint(thisEntity: CDOTA_BaseNPC_AICore, state: boolean): void {
        if (thisEntity.aiData != undefined) {
            thisEntity.aiData.isWaitingAtPoint = state;
        }
    }

    static GetWaitEndTime(thisEntity: CDOTA_BaseNPC_AICore): number {
        if (thisEntity.aiData != undefined) {
            return thisEntity.aiData.waitEndTime;
        }
        return 0;
    }

    static SetWaitEndTime(thisEntity: CDOTA_BaseNPC_AICore, time: number): void {
        if (thisEntity.aiData != undefined) {
            thisEntity.aiData.waitEndTime = time;
        }
    }

    static GetPatrolPointHistory(thisEntity: CDOTA_BaseNPC_AICore): CBaseEntity[] {
        if (thisEntity.aiData != undefined) {
            return thisEntity.aiData.patrolPointHistory;
        }
        return [];
    }

    static GetPatrolPoints(thisEntity: CDOTA_BaseNPC_AICore): CBaseEntity[] {
        if (thisEntity.aiData != undefined) {
            return thisEntity.aiData.patrolPoints;
        }
        return [];
    }

    static SetInCombat(thisEntity: CDOTA_BaseNPC_AICore, state: boolean) {
        if (thisEntity.aiData != undefined) {
            if (state != true && state != false) {
                Debug_PrintError(
                    "[AICore] Attempt to set combat state to invalid value = " + tostring(state) + ". Using default value = false."
                );
                state = false;
            }

            //if (state == true) {
            //    thisEntity.RemoveModifierByName(modifier_sleep.name);
            //}

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
                Debug_PrintError(
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
                Debug_PrintError(
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

    static IsMoving(thisEntity: CDOTA_BaseNPC): boolean {
        const velocity = thisEntity.GetVelocity();
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);

        return speed > 10;
    }

    static MoveToPosition(thisEntity: CDOTA_BaseNPC_AICore, position: Vector) {
        if (position == undefined || thisEntity.HasMovementCapability() == false) {
            return;
        }

        const currentPos = thisEntity.GetAbsOrigin();
        const distanceSqr = CalculateDistanceSqr(currentPos, position);

        if (distanceSqr <= AICore.PATROL_POINT_REACH_DISTANCE_SQR) {
            if (AICore.IsMoving(thisEntity)) {
                thisEntity.Stop();
            }
            return;
        }

        if (AICore.IsMoving(thisEntity)) {
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
        const validEnemies = enemies.filter((enemy) => AICore.EnemyUnitFilter(thisEntity, enemy) === AICore.AI_UNIT_FILTER_VALID);
        if (validEnemies.length === 0) {
            AICore.SetInCombat(thisEntity, false);
            return AICore.AI_ACTION_CASTED_NOTHING;
        }

        for (const ability of thisEntity.aiData.abilitiesWithEnemyTarget) {
            const actionResult = AICore.TryCastAbility(ability as CDOTABaseAbility_AICore, thisEntity, validEnemies);
            if (actionResult === AICore.AI_ACTION_CASTED_AT_LEAST_ONE_ABILITY) {
                AICore.SetInCombat(thisEntity, true);
                return actionResult;
            }
        }

        if (AICore.IsCastAbility(thisEntity) == false) {
            AICore.AttackTarget(thisEntity, validEnemies[0]);
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

    static TryCastAbility(ability: CDOTABaseAbility_AICore, caster: CDOTA_BaseNPC_AICore, allTargets: CDOTA_BaseNPC[]) {
        if (ability.IsFullyCastable() == false || ability.behavior == AbilityBehavior.PASSIVE) {
            return AICore.AI_ACTION_CASTED_NOTHING;
        }

        const validTargets = allTargets.filter(
            (target) => target && !target.IsNull() && target.IsAlive() && caster.CanEntityBeSeenByMyTeam(target)
        );

        if (validTargets.length === 0) {
            return AICore.AI_ACTION_CASTED_NOTHING;
        }

        const target = validTargets[RandomInt(0, validTargets.length - 1)];

        const distanceBetweenUnits = CalculateDistance(caster.GetAbsOrigin(), target.GetAbsOrigin());
        if (
            ability.behavior == AbilityBehavior.NO_TARGET &&
            distanceBetweenUnits > AICore.MAX_DISTANCE_BETWEEN_UNITS_CAST_NO_TARGET_ABILITY
        ) {
            AICore.MoveToPosition(caster, target.GetAbsOrigin());
            return AICore.AI_ACTION_CASTED_NOTHING;
        }

        // Кастуем способность
        const orderType = AICore.GetOrderTypeFromAbilityBehaviour(ability);
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

@registerModifier()
export class modifier_sleep extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();

    // Modifier specials

    override IsHidden() {
        return false;
    }
    override IsDebuff() {
        return false;
    }
    override IsPurgable() {
        return false;
    }
    override IsPurgeException() {
        return false;
    }
    override RemoveOnDeath() {
        return true;
    }

    CheckState(): Partial<Record<modifierstate, boolean>> {
        return { [ModifierState.STUNNED]: true };
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
        abilitiesWithAllyTarget: CDOTABaseAbility[];
        abilitiesWithEnemyTarget: CDOTABaseAbility[];
        isCastAbility: boolean;
        patrolPoints: CBaseEntity[];
        currentPatrolPoint?: CBaseEntity;
        patrolPointHistory: CBaseEntity[];
        isWaitingAtPoint: boolean;
        waitEndTime: number;
        IsCanAttackFirst: boolean;
        IsAggressiveForm: boolean;
        idleMovementPosition?: Vector;
        patrolSearchRadius: number;
    };
}

declare interface CDOTABaseAbility_AICore extends CDOTABaseAbility {
    behavior: AbilityBehavior;
}
