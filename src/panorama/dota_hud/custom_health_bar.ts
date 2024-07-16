// eslint-disable-next-line no-var
var DotaHUD = GameUI.CustomUIConfig().DotaHUD;

export class CustomHealthBar {
    playerID = Game.GetLocalPlayerID();
    constructor() {
        this.CreateMonsterHealthBar();
    }

    CreateMonsterHealthBar() {
        const hud = DotaHUD.Get();
        const MonsterHealthBar = hud.FindChildTraverse("MonsterHealthBar");
        if (MonsterHealthBar) {
            MonsterHealthBar.DeleteAsync(0);
        }
        const HuntersHealthbar = hud.FindChildTraverse("HuntersHealthbar");
        if (HuntersHealthbar) {
            HuntersHealthbar.DeleteAsync(0);
        }
        const panel = $.CreatePanel("Panel", hud, "MonsterHealthBar");
        panel.BLoadLayout("file://{resources}/layout/custom_game/monster_health_bar/monster_health_bar.xml", false, false);
        panel.style.align = "center top";
        panel.style.width = "fit-children";
        panel.style.height = "fit-children";
        panel.style.marginTop = "5%";

        if (Players.GetTeam(this.playerID) == DotaTeam.GOODGUYS) {
            const panel = $.CreatePanel("Panel", hud, "HuntersHealthbar");
            panel.BLoadLayout("file://{resources}/layout/custom_game/hunters_healthbar/hunters_healthbar.xml", false, false);
            panel.style.width = "fit-children";
            panel.style.height = "fit-children";
        }
    }
}

new CustomHealthBar();
