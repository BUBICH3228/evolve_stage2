/* eslint-disable no-undef */
var DotaHUD = GameUI.CustomUIConfig().DotaHUD;

let buttonContainer = DotaHUD.Get().FindChildTraverse("quickbuy");
if (buttonContainer) {
    let panel = $.CreatePanel("Panel", buttonContainer, "ProgressPanel");
    panel.BLoadLayout("file://{resources}/layout/custom_game/custom_shop/custom_shop_button.xml", false, false);
} else {
    $.Msg("Gaben slomal kastomky");
}
