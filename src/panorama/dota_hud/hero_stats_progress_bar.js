/* eslint-disable no-undef */

let dotaHud = DotaHUD.Get();

let heroStatsProgressBarPanel = dotaHud.FindChildTraverse("shop_launcher_block");

if (heroStatsProgressBarPanel) {
    let panel = $.CreatePanel("Panel", heroStatsProgressBarPanel, "MainPanel");
    panel.BLoadLayout("file://{resources}/layout/custom_game/hero_stats/progress_bar.xml", false, false);
} else {
    $.Msg("Gaben slomal kastomky");
}
