/* eslint-disable no-undef */
var DotaHUD = GameUI.CustomUIConfig().DotaHUD;

let Container = DotaHUD.Get().FindChildTraverse("minimap_container");
if (Container) {
    Container.style.height = "344px";
    let panel = $.CreatePanel("Panel", Container, "WaveInfoContainer");
    panel.BLoadLayout("file://{resources}/layout/custom_game/wave_counter/wave_counter.xml", false, false);
} else {
    $.Msg("Gaben slomal kastomky");
}
