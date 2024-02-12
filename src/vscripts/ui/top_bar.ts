/* eslint-disable @typescript-eslint/no-explicit-any */

export class TopBarUI {
    constructor() {
        this.Initialize();
    }

    private Initialize() {
        ListenToGameEvent("game_rules_state_change", () => this.OnGameRulesStateChange(), undefined);
    }

    private OnGameRulesStateChange(): void {
        const newState = GameRules.State_Get();
        if (newState == GameState.PRE_GAME) {
            this.RegisterPanoramaListeners();
        }
    }

    private RegisterPanoramaListeners() {
        PlayerTables.CreateTable("top_bar_ui", {}, true);
    }

    public static SetBossesToDisplay(bosses: BossesTable): void {
        PlayerTables.SetTableValue("top_bar_ui", "bosses", bosses);
    }

    public static SetBossInformation(timeStart: number, delay: number): void {
        PlayerTables.SetTableValue("top_bar_ui", "data", {
            start: timeStart,
            delay: delay
        });
    }

    public static AddBossToDisplay(boss: CDOTA_BaseNPC): void {
        const bosses: BossesTable[] = PlayerTables.GetTableValue("top_bar_ui", "bosses") || [];

        const data: BossesTable = {
            time: GameRules.GetDOTATime(false, false),
            ent_index: boss.entindex()
        };

        table.insert(bosses, data);

        this.SetBossesToDisplay(bosses);
    }

    public static RemoveBossFromDisplay(boss: CDOTA_BaseNPC): void {
        const bosses: BossesTable[] = PlayerTables.GetTableValue("top_bar_ui", "bosses") || [];

        ArrayRemove(bosses as any, (t: any, i: number) => {
            const bossData = t[i];
            const bossInTable = EntIndexToHScript(bossData["ent_index"]);
            return bossInTable != boss;
        });

        this.SetBossesToDisplay(bosses);
    }
}

interface BossesTable extends Object {
    time?: number;
    ent_index?: EntityIndex;
}

declare global {
    // eslint-disable-next-line no-var
    var _TopBarUIInitialized: boolean;
}

if (IsServer() && !_G._TopBarUIInitialized) {
    new TopBarUI();
    _G._TopBarUIInitialized = true;
}
