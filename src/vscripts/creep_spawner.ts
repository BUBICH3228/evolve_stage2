/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
export class CreepSpawner {
    creepTable: string[][] = [[], [], [], []];
    private availableCreeps: string[][] = [[], [], [], []];
    private currentIndexes: number[] = [0, 0, 0, 0];
    private spawnPoints: CBaseEntity[] = [];
    private lastUsedSpawnPoint = -1;
    private recentlyUsedPoints: Set<number> = new Set();
    private cooldownPoints: Map<number, number> = new Map();
    private spawnInterval = 30;
    private spawnTimer: string | undefined;
    private isSpawningActive = false;
    private currentCreepCounts: number[] = [0, 0, 0, 0];
    // Соотношения крипов по времени [1лвл, 2лвл, 3лвл, 4лвл]
    private creepRatios: { [timeRange: string]: number[] } = {
        "0-5": [20, 11, 3, 1],
        "5-15": [13, 15, 6, 1],
        "15-20": [3, 17, 11, 3]
    };
    constructor() {
        this.Initialize();
    }

    private Initialize() {
        ListenToGameEvent("game_rules_state_change", () => this.OnGameRulesStateChange(), undefined);
        ListenToGameEvent("entity_killed", (event) => this.OnEntityKilled(event), undefined);
    }

    private OnGameRulesStateChange() {
        const newState = GameRules.State_Get();
        if (newState == GameState.PRE_GAME) {
            this.CreateCreepTable();
        }
        if (newState == GameState.GAME_IN_PROGRESS) {
            this.ResetAvailableCreeps();
            this.LoadSpawnPoints();
            this.StartCreepSpawning();
        }
    }

    private OnEntityKilled(event: EntityKilledEvent): void {
        if (!this.isSpawningActive) return;

        const killedUnit = EntIndexToHScript(event.entindex_killed) as CDOTA_BaseNPC;

        if (!killedUnit || killedUnit.IsRealHero()) return;

        const creepLevel = killedUnit.GetLevel();
        if (creepLevel >= 1 && creepLevel <= 4) {
            this.currentCreepCounts[creepLevel - 1]--;

            Timers.CreateTimer(0.5, () => {
                this.CheckAndSpawnCreeps();
            });
        }
    }

    public StartCreepSpawning(): void {
        this.isSpawningActive = true;

        this.InitialSpawn();

        this.spawnTimer = Timers.CreateTimer(this.spawnInterval, () => {
            if (!this.isSpawningActive) return -1;
            this.CheckAndSpawnCreeps();
            return this.spawnInterval;
        });
    }

    private InitialSpawn(): void {
        const targetRatios = this.GetCurrentCreepRatio();

        for (let level = 1; level <= 4; level++) {
            const levelIndex = level - 1;
            const needed = targetRatios[levelIndex];

            if (needed > 0) {
                const spawned = this.SpawnMultipleCreeps(level, needed);
                this.currentCreepCounts[levelIndex] += spawned.length;
            }
        }
    }

    public StopCreepSpawning(): void {
        this.isSpawningActive = false;
        if (this.spawnTimer != undefined) {
            Timers.RemoveTimer(this.spawnTimer);
        }
    }

    private GetCurrentCreepRatio(): number[] {
        const minutesPassed = GameRules.GetGameTime() / 60;

        if (minutesPassed < 5) {
            return this.creepRatios["0-5"];
        } else if (minutesPassed < 15) {
            return this.creepRatios["5-15"];
        } else {
            return this.creepRatios["15-20"];
        }
    }

    private CheckAndSpawnCreeps(): void {
        const targetRatios = this.GetCurrentCreepRatio();

        for (let level = 1; level <= 4; level++) {
            const levelIndex = level - 1;
            const needed = targetRatios[levelIndex] - this.currentCreepCounts[levelIndex];

            if (needed > 0) {
                const spawned = this.SpawnMultipleCreeps(level, needed);
                this.currentCreepCounts[levelIndex] += spawned.length;
            }
        }
    }

    private CreateCreepTable(): void {
        const unitsTable: any = LoadKeyValues("scripts/npc/units/farm_creeps.txt");

        for (const unitKey in unitsTable) {
            if (unitsTable.hasOwnProperty(unitKey)) {
                const unitData = unitsTable[unitKey];

                if (typeof unitData === "object" && unitData.Level !== undefined) {
                    const level = unitData.Level;
                    const unitName = unitKey;

                    if (level >= 1 && level <= 4) {
                        this.creepTable[level - 1].push(unitName);
                    }
                }
            }
        }
    }

    private LoadSpawnPoints(): void {
        this.spawnPoints = Entities.FindAllByName("Point_movement");

        //print(`Loaded ${this.spawnPoints.length} spawn points`);
    }

    private ResetAvailableCreeps(): void {
        for (let i = 0; i < this.creepTable.length; i++) {
            this.availableCreeps[i] = [...this.creepTable[i]];
            this.ShuffleArray(this.availableCreeps[i]);
            this.currentIndexes[i] = 0;
        }
    }

    private ShuffleArray(array: any[]): void {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    private GetAvailableSpawnPoint(): CBaseEntity | null {
        if (this.spawnPoints.length === 0) {
            return null;
        }

        if (this.spawnPoints.length <= 2) {
            return this.spawnPoints[RandomInt(0, this.spawnPoints.length - 1)];
        }

        const availablePoints: number[] = [];

        for (let i = 0; i < this.spawnPoints.length; i++) {
            const lastSpawnTime = this.cooldownPoints.get(i);
            if (lastSpawnTime && GameRules.GetGameTime() - lastSpawnTime < 5) {
                continue;
            }

            if (i !== this.lastUsedSpawnPoint && !this.recentlyUsedPoints.has(i)) {
                availablePoints.push(i);
            }
        }

        if (availablePoints.length === 0) {
            this.recentlyUsedPoints.clear();

            for (let i = 0; i < this.spawnPoints.length; i++) {
                const lastSpawnTime = this.cooldownPoints.get(i);
                if (!lastSpawnTime || GameRules.GetGameTime() - lastSpawnTime >= 5) {
                    if (i !== this.lastUsedSpawnPoint) {
                        availablePoints.push(i);
                    }
                }
            }
        }

        if (availablePoints.length === 0) {
            for (let i = 0; i < this.spawnPoints.length; i++) {
                if (i !== this.lastUsedSpawnPoint) {
                    availablePoints.push(i);
                }
            }
        }

        if (availablePoints.length === 0) {
            availablePoints.push(RandomInt(0, this.spawnPoints.length - 1));
        }

        const selectedIndex = availablePoints[RandomInt(0, availablePoints.length - 1)];

        this.lastUsedSpawnPoint = selectedIndex;
        this.recentlyUsedPoints.add(selectedIndex);
        this.cooldownPoints.set(selectedIndex, GameRules.GetGameTime());

        if (this.recentlyUsedPoints.size > Math.max(2, Math.floor(this.spawnPoints.length / 2))) {
            const first = this.recentlyUsedPoints.values().next().value as number;
            this.recentlyUsedPoints.delete(first);
        }

        return this.spawnPoints[selectedIndex];
    }

    public GetRandomCreepByLevel(neededLevel: number): string {
        const levelIndex = neededLevel - 1;

        if (levelIndex < 0 || levelIndex >= this.availableCreeps.length) {
            throw new Error(`Invalid creep level: ${neededLevel}`);
        }

        if (this.currentIndexes[levelIndex] >= this.availableCreeps[levelIndex].length) {
            this.availableCreeps[levelIndex] = [...this.creepTable[levelIndex]];
            this.ShuffleArray(this.availableCreeps[levelIndex]);
            this.currentIndexes[levelIndex] = 0;
        }

        const creep = this.availableCreeps[levelIndex][this.currentIndexes[levelIndex]];
        this.currentIndexes[levelIndex]++;

        return creep;
    }

    public SpawnCreepAtRandomPoint(level: number): CDOTA_BaseNPC | null {
        if (this.spawnPoints.length === 0) {
            print("Warning: No spawn points available!");
            return null;
        }

        try {
            const creepName = this.GetRandomCreepByLevel(level);
            const spawnPoint = this.GetAvailableSpawnPoint();

            if (!spawnPoint) {
                print("Warning: No available spawn points!");
                return null;
            }

            const spawnPosition = spawnPoint.GetAbsOrigin();

            // Проверяем, нет ли других крипов слишком близко к точке спавна
            const nearbyCreeps = Entities.FindAllByClassnameWithin("npc_dota_creature", spawnPosition, 300);
            const nearbyHeroes = Entities.FindAllByClassnameWithin("npc_dota_hero", spawnPosition, 300);

            if (nearbyCreeps.length > 0 || nearbyHeroes.length > 0) {
                //print("Spawn point is occupied, trying another point...");
                const alternativePoint = this.GetAvailableSpawnPoint();
                if (alternativePoint) {
                    return this.SpawnCreepAtPoint(level, alternativePoint);
                }
                return null;
            }

            return this.SpawnCreepAtPoint(level, spawnPoint);
        } catch (error) {
            print(`Error spawning creep: ${error}`);
        }

        return null;
    }

    private SpawnCreepAtPoint(level: number, spawnPoint: CBaseEntity): CDOTA_BaseNPC | null {
        const creepName = this.GetRandomCreepByLevel(level);
        const spawnPosition = spawnPoint.GetAbsOrigin();
        const spawnTeam = DotaTeam.NEUTRALS;

        const creep = CreateUnitByName(creepName, spawnPosition, true, undefined, undefined, spawnTeam);

        if (creep != undefined) {
            //print(`Spawned ${creepName} at level ${level} at position ${spawnPosition}`);
            return creep;
        }

        return null;
    }

    private SpawnMultipleCreeps(level: number, count: number): CDOTA_BaseNPC[] {
        const spawnedCreeps: CDOTA_BaseNPC[] = [];

        for (let i = 0; i < count; i++) {
            const creep = this.SpawnCreepAtRandomPoint(level);
            if (creep != undefined) {
                spawnedCreeps.push(creep);
            }
        }

        return spawnedCreeps;
    }

    public ClearSpawnHistory(): void {
        this.recentlyUsedPoints.clear();
        this.lastUsedSpawnPoint = -1;
    }

    public ResetAllLevels(): void {
        this.ResetAvailableCreeps();
    }

    public ResetLevel(level: number): void {
        const levelIndex = level - 1;
        if (levelIndex >= 0 && levelIndex < this.availableCreeps.length) {
            this.availableCreeps[levelIndex] = [...this.creepTable[levelIndex]];
            this.ShuffleArray(this.availableCreeps[levelIndex]);
            this.currentIndexes[levelIndex] = 0;
        }
    }

    public GetSpawnPoints(): CBaseEntity[] {
        return this.spawnPoints;
    }

    public AddSpawnPoint(point: CBaseEntity): void {
        this.spawnPoints.push(point);
    }
}

declare global {
    // eslint-disable-next-line no-var
    var _CreepSpawnerInitialized: boolean;
}

if (IsServer() && !_G._CreepSpawnerInitialized) {
    new CreepSpawner();
    _G._CreepSpawnerInitialized = true;
}
