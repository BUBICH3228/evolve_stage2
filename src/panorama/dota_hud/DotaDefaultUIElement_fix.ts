// eslint-disable-next-line no-var
var DotaHUD = GameUI.CustomUIConfig().DotaHUD;

class DotaDefaultUIElement_fix {
    constructor() {
        this.FindAndFixLevelLabel();
    }

    private FindAndFixLevelLabel() {
        const hud = DotaHUD.Get();
        const levelLabel = hud.FindChildTraverse("LevelLabel");
        if (levelLabel) {
            levelLabel.style.width = "50px";
        } else {
            $.Msg("Seems valve break FindAndFixLevelLabel");
        }
    }
}

new DotaDefaultUIElement_fix();
