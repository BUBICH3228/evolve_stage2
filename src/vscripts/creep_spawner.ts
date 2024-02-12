import { ForestSpawnerData, BossData, CampsTable, CreepTable, LineCreepSettingsData } from "./common/data/creep_spawner";
import { GameDifficulty } from "./game_difficulty";
import { HTTPRequests } from "./libraries/HTTP_requests";
import { modifier_unit_boss } from "./modifiers/modifier_unit_boss";
import { TopBarUI } from "./ui/top_bar";

export class CreepSpawner {
    campIsReadyToSpawn: boolean[] = [];
    constructor() {
        this.Initialize();
    }

    private Initialize() {
        ListenToGameEvent("game_rules_state_change", () => this.OnGameRulesStateChange(), undefined);
        ListenToGameEvent(
            "player_chat",
            (event) => {
                this.OnPlayerChating(event);
            },
            undefined
        );
        ListenToGameEvent("entity_killed", (event) => this.OnEntityKilled(event), undefined);
        CustomEvents.RegisterEventHandler(CustomEvent.CUSTOM_EVENT_ON_DIFFICULTY_SELECTED, () => this.InitializeAllHammerCreeps());
        CustomEvents.RegisterEventHandler(CustomEvent.CUSTOM_EVENT_ON_DIFFICULTY_CHANGED, () => {
            this.OnDifficultyChangedChanged();
        });
    }

    private OnGameRulesStateChange() {
        const newState = GameRules.State_Get();

        if (newState == GameState.GAME_IN_PROGRESS) {
            this.ForestSpawner();
            this.LineCreepSpawner();
        }
    }

    private OnDifficultyChangedChanged() {
        const enemies = FindUnitsInRadius(
            GameSettings.GetSettingValueAsTeamNumber("enemies_team"),
            Vector(0, 0, 0),
            undefined,
            FIND_UNITS_EVERYWHERE,
            UnitTargetTeam.FRIENDLY,
            UnitTargetType.ALL,
            UnitTargetFlags.INVULNERABLE,
            FindOrder.ANY,
            false
        );

        enemies.forEach((target) => {
            if (target.GetUnitName() != "npc_golden_dummy") {
                GameDifficulty.UpgradeUnitStats(target);
            }
        });
    }

    private InitializeAllHammerCreeps() {
        const enemies = FindUnitsInRadius(
            GameSettings.GetSettingValueAsTeamNumber("enemies_team"),
            Vector(0, 0, 0),
            undefined,
            FIND_UNITS_EVERYWHERE,
            UnitTargetTeam.FRIENDLY,
            UnitTargetType.ALL,
            UnitTargetFlags.INVULNERABLE,
            FindOrder.ANY,
            false
        );

        enemies.forEach((target) => {
            if (target.GetUnitName() != "npc_golden_dummy") {
                GameDifficulty.UpgradeUnitStats(target);
            } else {
                target.AddNewModifier(target, undefined, modifier_unit_boss.name, { duration: -1 });
            }

            if (target.IsBoss() && target.GetUnitName() != "npc_line_boss_end") {
                target.AddNewModifier(target, undefined, modifier_unit_boss.name, { duration: -1 });
                target.SetUnitCanRespawn(true);
                BossData.Targets[target.GetUnitName()].vSpawnLoc = target.GetAbsOrigin();
                BossData.Targets[target.GetUnitName()].vSpawnVector = target.GetForwardVector();
            }
        });
    }

    private OnEntityKilled(kv: EntityKilledEvent): void {
        const target = EntIndexToHScript(kv.entindex_killed) as CDOTA_BaseNPC;

        if (target == undefined) {
            return;
        }

        if (target.GetUnitName() == "npc_badguys_fort") {
            const unit = CreateUnitByName(
                "npc_line_boss_end",
                target.GetAbsOrigin(),
                true,
                undefined,
                undefined,
                GameSettings.GetSettingValueAsTeamNumber("enemies_team")
            );
            TopBarUI.AddBossToDisplay(unit);
            this.RandomizeCreepLine(unit);
        } else if (target.GetUnitName() == "npc_line_boss_end") {
            for (
                let PlayerID = 0;
                PlayerID < PlayerResource.GetPlayerCountForTeam(GameSettings.GetSettingValueAsTeamNumber("players_team"));
                PlayerID++
            ) {
                this.SaveTopTableData(PlayerID as PlayerID);
            }
            Timers.CreateTimer(3, () => {
                GameRules.SetGameWinner(GameSettings.GetSettingValueAsTeamNumber("players_team"));
            });
        } else if (target.GetUnitName() == "npc_goodguys_fort") {
            GameRules.SetGameWinner(GameSettings.GetSettingValueAsTeamNumber("enemies_team"));
        }

        const player = EntIndexToHScript(kv.entindex_attacker);
        if (player == undefined) {
            return;
        }

        const hero = player.GetOwner() as CDOTA_BaseNPC_Hero;

        if (hero == undefined) {
            return;
        }

        const PlayerId = hero.GetPlayerID();
        if (target.IsBoss() && BossData.Targets[target.GetUnitName()] != undefined) {
            BossData.Targets[target.GetUnitName()].Death++;
            this.DropGoldAndXPFromBoss(target, PlayerId);
            const locationID = BossData.Targets[target.GetUnitName()].locationID;
            if (
                ForestSpawnerData.Locations[locationID].locationLevel <
                (ForestSpawnerData.Locations[locationID].camps as Array<CampsTable>).length
            ) {
                ForestSpawnerData.Locations[locationID].locationLevel++;
            }

            if (
                BossData.Targets[target.GetUnitName()].Death ==
                    (ForestSpawnerData.Locations[locationID].camps as Array<CampsTable>).length &&
                Teleports.IsTeleportLocked(BossData.Targets[target.GetUnitName()].unlockLocationID)
            ) {
                ForestSpawnerData.Locations[BossData.Targets[target.GetUnitName()].unlockLocationID].locationOpen = true;
                Teleports.SetIsTeleportLocked(BossData.Targets[target.GetUnitName()].unlockLocationID, false);
                EmitGlobalSound("MountainItem.TeleportKey.Cast");
                Notifications.BottomToAll({ text: "ui_teleports_unlock_item_used", continue: true });
            }
            Timers.CreateTimer(GameDifficulty.GetCurrentDifficultyBossesRespawnTime(), () => {
                this.RespawnBoss(target);
            });
        }

        if (target.IsBoss()) {
            TopBarUI.RemoveBossFromDisplay(target);
        }
    }

    private RespawnBoss(target: CDOTA_BaseNPC) {
        target.SetAbsOrigin(BossData.Targets[target.GetUnitName()].vSpawnLoc as Vector);
        target.SetForwardVector(BossData.Targets[target.GetUnitName()].vSpawnVector as Vector);
        target.RespawnUnit();

        if (BossData.Targets[target.GetUnitName()].Death < 4) {
            GameDifficulty.BuffUnitStats(target, 1.5);
            target.SetPhysicalArmorBaseValue(target.GetPhysicalArmorValue(false) + 5);
        }
    }

    private SaveTopTableData(PlayerID: PlayerID) {
        if (PlayerID == undefined) {
            return;
        }

        const hero = PlayerResource.GetSelectedHeroEntity(PlayerID);

        if (hero == undefined) {
            return;
        }

        const SteamID = tostring(PlayerResource.GetSteamID(PlayerID));

        let score = 75;
        const time = GameRules.GetDOTATime(false, false) / 60;
        if (time >= 25 && time <= 120) {
            score = 25;
        }

        const data = {
            steam_id: SteamID,
            score: score,
            minPassageTime: GameRules.GetDOTATime(false, false),
            maxPassageTime: GameRules.GetDOTATime(false, false),
            bossKillCount: hero._bossKills || 0,
            creepKillCount: hero.GetLastHits(),
            countGames: 1,
            difficulty: GameDifficulty.GetDifficulty()
        };
        HTTPRequests.SaveTopTable({ data });
    }

    private DropGoldAndXPFromBoss(target: CDOTA_BaseNPC, PlayerId: PlayerID) {
        const gold = BossData.Targets[target.GetUnitName()].goldPerKill;
        const xp = BossData.Targets[target.GetUnitName()].XPPerKill;

        for (
            let PlayerID = 0 as PlayerID;
            PlayerID < PlayerResource.GetPlayerCountForTeam(GameSettings.GetSettingValueAsTeamNumber("players_team"));
            PlayerID++
        ) {
            const hero = PlayerResource.GetSelectedHeroEntity(PlayerID);
            const player = PlayerResource.GetPlayer(PlayerID);

            if (hero == undefined || player == undefined) {
                return;
            }

            if (PlayerID == PlayerId) {
                hero.ModifyGold(gold, false, ModifyGoldReason.UNSPECIFIED);
                SendOverheadEventMessage(player, OverheadAlert.GOLD, hero, gold, undefined);
                hero.AddExperience(xp, ModifyXpReason.UNSPECIFIED, false, true);
                SendOverheadEventMessage(player, OverheadAlert.XP, hero, xp, undefined);
                if (hero._bossKills == undefined) {
                    hero._bossKills = 0;
                }
                hero._bossKills++;
            } else {
                hero.ModifyGold(gold * 0.4, false, ModifyGoldReason.UNSPECIFIED);
                SendOverheadEventMessage(player, OverheadAlert.GOLD, hero, gold * 0.4, undefined);
                hero.AddExperience(xp * 0.4, ModifyXpReason.UNSPECIFIED, false, true);
                SendOverheadEventMessage(player, OverheadAlert.XP, hero, xp * 0.4, undefined);
            }
        }
    }

    private ForestSpawner() {
        const entities = Entities.FindAllByClassname("info_target");

        for (const key in ForestSpawnerData.Locations) {
            const locationsID = tonumber(key) as number;
            const pointName = ForestSpawnerData.Locations[locationsID].pointName;
            for (let key = 0; key < Object.entries(entities).length; key++) {
                const entity = entities[key];
                const entityName = entity.GetName();
                const strArray = entityName.split("_");
                if (strArray[1] != undefined && strArray[1].startsWith(pointName)) {
                    const length = Object.entries(ForestSpawnerData.Locations[locationsID].locationPoints).length;
                    ForestSpawnerData.Locations[locationsID].locationPoints[length] = entity.GetAbsOrigin();
                    ForestSpawnerData.Locations[locationsID].countCamps = length;
                }
            }

            Timers.CreateTimer(0, () => {
                let indexCamp = 0;

                Timers.CreateTimer(0, () => {
                    const spawnerPoint = ForestSpawnerData.Locations[locationsID].locationPoints[indexCamp];
                    if (ForestSpawnerData.Locations[locationsID].locationOpen) {
                        if (this.FindFriendlyForSpawn(spawnerPoint, locationsID, true) == false) {
                            if (this.FindEnemiesForSpawn(spawnerPoint)) {
                                this.SpawnCreep(spawnerPoint, locationsID);
                            } else if (this.campIsReadyToSpawn[indexCamp] == true) {
                                this.StartSpawnWaiting(spawnerPoint, locationsID, indexCamp);
                            }
                        } else {
                            if (this.FindEnemiesForSpawn(spawnerPoint) == false) {
                                const campCreep = this.FindFriendlyForSpawn(spawnerPoint, locationsID, false) as CDOTA_BaseNPC[];
                                campCreep.forEach((target) => {
                                    target.ForceKill(false);
                                });

                                this.StartSpawnWaiting(spawnerPoint, locationsID, indexCamp);
                            }
                        }
                    }

                    if (ForestSpawnerData.Locations[locationsID].countCamps > indexCamp) {
                        indexCamp++;

                        return 0;
                    }
                });

                return ForestSpawnerData.Locations[locationsID].respawnTime;
            });
        }
    }

    private FindEnemiesForSpawn(point: Vector): boolean {
        const enemies = FindUnitsInRadius(
            GameSettings.GetSettingValueAsTeamNumber("players_team"),
            point,
            undefined,
            5000,
            UnitTargetTeam.FRIENDLY,
            UnitTargetType.ALL,
            UnitTargetFlags.NONE,
            FindOrder.ANY,
            false
        );

        if (enemies.length > 0) {
            return true;
        }

        return false;
    }

    private FindFriendlyForSpawn(spawnerPoint: Vector, locationsID: number, isBoolean: boolean): boolean | CDOTA_BaseNPC[] {
        const enemies = FindUnitsInRadius(
            GameSettings.GetSettingValueAsTeamNumber("enemies_team"),
            spawnerPoint,
            undefined,
            ForestSpawnerData.Locations[locationsID].findUnitsRadius,
            UnitTargetTeam.FRIENDLY,
            UnitTargetType.ALL,
            UnitTargetFlags.NONE,
            FindOrder.ANY,
            false
        );

        if (isBoolean == false) {
            return enemies;
        }

        if (enemies.length > 0) {
            return true;
        }

        return false;
    }

    private StartSpawnWaiting(spawnerPoint: Vector, locationsID: number, indexCamp: number): void {
        Timers.CreateTimer(0, () => {
            this.campIsReadyToSpawn[indexCamp] = false;
            if (this.FindEnemiesForSpawn(spawnerPoint)) {
                if (this.FindFriendlyForSpawn(spawnerPoint, locationsID, true) == false) {
                    this.SpawnCreep(spawnerPoint, locationsID);
                }
                this.campIsReadyToSpawn[indexCamp] = true;
            } else {
                return 0.5;
            }
        });
    }

    private SpawnCreep(spawnerPoint: Vector, locationsID: number): void {
        const numberCamp = RandomInt(1, ForestSpawnerData.Locations[locationsID].locationLevel);
        const camp = ForestSpawnerData.Locations[locationsID].camps[numberCamp];
        for (let indexCreep = 1; indexCreep <= (camp.creeps as Array<CreepTable>).length; indexCreep++) {
            const unit = CreateUnitByName(
                camp.creeps[indexCreep].creepName,
                (spawnerPoint + RandomVector(ForestSpawnerData.Locations[locationsID].spawnRadius)) as Vector,
                true,
                undefined,
                undefined,
                GameSettings.GetSettingValueAsTeamNumber("enemies_team")
            );
            unit.AddNewModifier(unit, undefined, "modifier_phased", { duration: 0.01 });
            GameDifficulty.UpgradeUnitStats(unit);
        }
    }

    private LineCreepSpawner(): void {
        if (PlayerResource.GetPlayerCountForTeam(GameSettings.GetSettingValueAsTeamNumber("players_team")) == 1) {
            LineCreepSettingsData.IsSpawnerEnabled = false;
        }

        Timers.CreateTimer(LineCreepSettingsData.shiftWaveInterval, () => {
            LineCreepSettingsData.currentShift++;
            return LineCreepSettingsData.shiftWaveInterval;
        });
        const entities = Entities.FindAllByClassname("info_target");
        for (let key = 0; key < Object.entries(entities).length; key++) {
            const entity = entities[key];
            const entityName = entity.GetName();
            const strArray = entityName.split("_");
            if (strArray[1] != undefined && strArray[1].startsWith("wavePointBadGuys")) {
                LineCreepSettingsData.spawnPoint = entity;
            }
        }
        TopBarUI.SetBossInformation(GameRules.GetDOTATime(false, false), LineCreepSettingsData.waweInterval * 10);
        Timers.CreateTimer(LineCreepSettingsData.waweInterval, () => {
            if (LineCreepSettingsData.IsSpawnerEnabled == true) {
                this.SpawnLineUnits();
            }
            LineCreepSettingsData.currentWave++;
            return LineCreepSettingsData.waweInterval;
        });
        Timers.CreateTimer(LineCreepSettingsData.bossWaweInterval, () => {
            this.SpawnLineBossUnits();
            return LineCreepSettingsData.bossWaweInterval;
        });
    }

    private SpawnLineUnits(): void {
        const length = Object.entries(LineCreepSettingsData.wavesTable[1].units).length;
        let indexCreep = 1;
        Timers.CreateTimer(0.5, () => {
            const unit = CreateUnitByName(
                LineCreepSettingsData.wavesTable[1].units[indexCreep],
                LineCreepSettingsData.spawnPoint!.GetAbsOrigin(),
                true,
                undefined,
                undefined,
                GameSettings.GetSettingValueAsTeamNumber("enemies_team")
            );
            unit.AddNewModifier(unit, undefined, "modifier_phased", { duration: 1 });
            if (LineCreepSettingsData.currentShift > 1) {
                GameDifficulty.UpgradeLineUnitStats(unit, LineCreepSettingsData.currentShift);
            }
            this.RandomizeCreepLine(unit);

            if (indexCreep != length) {
                indexCreep++;
                return 0.5;
            }
        });
    }

    private SpawnLineBossUnits(): void {
        //const indexBoss = LineCreepSettingsData.currentWave / 20;
        const unit = CreateUnitByName(
            "npc_line_boss_8",
            LineCreepSettingsData.spawnPoint!.GetAbsOrigin(),
            true,
            undefined,
            undefined,
            GameSettings.GetSettingValueAsTeamNumber("enemies_team")
        );
        unit.AddNewModifier(unit, undefined, "modifier_phased", { duration: 5 });
        unit.AddNewModifier(unit, undefined, modifier_unit_boss.name, { duration: -1 });
        GameDifficulty.UpgradeLineUnitStats(unit, LineCreepSettingsData.currentShift + 2);
        TopBarUI.AddBossToDisplay(unit);
        TopBarUI.SetBossInformation(GameRules.GetDOTATime(false, false), LineCreepSettingsData.bossWaweInterval);
        this.RandomizeCreepLine(unit);
    }

    private RandomizeCreepLine(unit: CDOTA_BaseNPC): void {
        const entities = Entities.FindAllByClassname("path_corner");
        for (let key = 0; key < Object.entries(entities).length; key++) {
            const entity = entities[key];
            const entityName = entity.GetName();
            const strArray = entityName.split("_");
            if (strArray[1] != undefined && strArray[1].startsWith("wavePathBadGuys1")) {
                unit.SetInitialWaypoint(entityName);
            }
        }
    }

    private OnPlayerChating(event: PlayerChatEvent) {
        if (event.text == "turn_off_line") {
            LineCreepSettingsData.IsSpawnerEnabled = false;
        } else if (event.text == "turn_line") {
            LineCreepSettingsData.IsSpawnerEnabled = true;
        }
    }
}

if (IsServer()) {
    new CreepSpawner();
}
