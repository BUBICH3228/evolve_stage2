var DotaHUD = GameUI.CustomUIConfig().DotaHUD;

let buttonContainer = DotaHUD.Get().FindChildTraverse("center_block");
if (buttonContainer) {
    let panel = $.CreatePanel("Panel", buttonContainer, "ProgressPanel");
    panel.BLoadLayout("file://{resources}/layout/custom_game/hero_stats/hero_stats_button.xml", false, false);
} else {
    $.Msg("Gaben slomal Knopky Statov");
}