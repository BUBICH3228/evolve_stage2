/* eslint-disable no-undef */
var DotaHUD = GameUI.CustomUIConfig().DotaHUD;

let minimapBlock = DotaHUD.Get().FindChildTraverse("minimap_block");

if (minimapBlock) {
    let panel = $.CreatePanel("Panel", minimapBlock, "MapPanel");
    panel.BLoadLayout("file://{resources}/layout/custom_game/minimap_fix/minimap_fix.xml", false, false);
} else {
    $.Msg("Gaben slomal kastomky");
}
