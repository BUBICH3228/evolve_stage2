export class InformationPanel {
    constructor() {
        this.Initialize();
    }

    private Initialize() {
        ListenToGameEvent("game_rules_state_change", () => this.OnGameRulesStateChange(), undefined);
    }

    private OnGameRulesStateChange() {
        const newState = GameRules.State_Get();
        if (newState == GameState.CUSTOM_GAME_SETUP) {
            this.LoadKeyValues();
        }
    }

    private LoadKeyValues() {
        const table = LoadKeyValues("scripts/kv/information_panel.kv");
        PlayerTables.CreateTable("InformationPanel", {}, true);
        PlayerTables.SetTableValue("InformationPanel", "Text", table);
    }
}

if (IsServer()) {
    new InformationPanel();
}
