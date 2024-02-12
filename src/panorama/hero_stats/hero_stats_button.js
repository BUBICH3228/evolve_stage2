var HeroStats = GameUI.CustomUIConfig().HeroStats

function OnOpenOrCloseHeroStatsPanelButtonPressed() {
    HeroStats.FireButtonClickedEvent(1);
}

function KeyBind() {
    const key_bind = "H";
    $("#HotKeyText").text = key_bind;
    const command_name = `Custom_Key_Bind_${key_bind}_${Date.now()}`;
    Game.CreateCustomKeyBind(key_bind, command_name);
    Game.AddCommand(command_name, OnOpenOrCloseHeroStatsPanelButtonPressed, "", 0);
}

(function () {
    KeyBind();
    HeroStats.SetButton(1, $("#OpenOrCloseButton"));
})();