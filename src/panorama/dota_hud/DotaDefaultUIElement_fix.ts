// eslint-disable-next-line no-var
var DotaHUD = GameUI.CustomUIConfig().DotaHUD;

class DotaDefaultUIElement_fix {
    constructor() {
        this.FindAndFixLevelLabel();

        $.RegisterForUnhandledEvent("TooltipVisible", (object) => {
            this.OnTooltipVisible(object);
        });
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
    private OnTooltipVisible(object: Panel) {
        if (object.paneltype != "DOTATooltipAbility") {
            return;
        }

        object.style.zIndex = 20;
    }
}

new DotaDefaultUIElement_fix();
