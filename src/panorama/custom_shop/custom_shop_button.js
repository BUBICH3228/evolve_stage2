/* eslint-disable no-undef */
let panel = GameUI.CustomUIConfig().DotaHUD.Get().FindChildTraverse("ShopMenuPanel");
let BOSS_POINT_TEXT = $("#BossPoint");
const CustomShop = GameUI.CustomUIConfig().CustomShop;
function OpenShopPanel() {
    if (panel.style.visibility == "collapse") {
        panel.style.visibility = "visible";
        panel.FindChildTraverse("NeutralShopPanel").style.visibility = "visible";
    } else {
        panel.style.visibility = "collapse";
    }
}

function CreateOrUpdateBossPointPanel() {
    let Player = Players.GetLocalPlayerPortraitUnit();
    if (!Entities.IsHero(Player)) {
        BOSS_POINT_TEXT.text = 0;
        $.Schedule(0.5, CreateOrUpdateBossPointPanel);
        return;
    }
    let PlayerID = Entities.GetPlayerOwnerID(Player);
    let CurrentBossPoint = CustomShop.GetBossPoint(PlayerID);
    if (CurrentBossPoint >= 1000000) {
        CurrentBossPoint = Utils.FormatBigNumber(CurrentBossPoint, 1);
    }
    BOSS_POINT_TEXT.text = CurrentBossPoint;
    $.Schedule(0.5, CreateOrUpdateBossPointPanel);
}

$.RegisterForUnhandledEvent("Cancelled", () => {
    if (panel.style.visibility == "visible") {
        OpenShopPanel();
    }
});

(function () {
    CreateOrUpdateBossPointPanel();
    const key_bind = "0";
    $("#HotKeyText").text = key_bind;
    const command_name = `Custom_Key_Bind_${key_bind}_${Date.now()}`;
    Game.CreateCustomKeyBind(key_bind, command_name);
    Game.AddCommand(command_name, OpenShopPanel, "", 0);
})();
