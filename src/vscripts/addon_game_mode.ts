import { GameMode } from "./game_mode";

Object.assign(getfenv(), {
    Activate: GameMode.Activate,
    Precache: GameMode.Precache
});

if (GameRules.Addon !== undefined) {
    // This code is only run after script_reload, not at startup
    print("121213");
    GameRules.Addon.OnScriptReload();
}
