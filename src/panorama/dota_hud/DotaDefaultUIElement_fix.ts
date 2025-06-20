// eslint-disable-next-line no-var
var DotaHUD = GameUI.CustomUIConfig().DotaHUD;

class DotaDefaultUIElement_fix {
    constructor() {
        this.FindAndFixLevelLabel();

        $.RegisterForUnhandledEvent("TooltipVisible", (object) => {
            this.OnTooltipVisible(object);
        });

        this.FindAndFixTopBar();
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
    private FindAndFixTopBar() {
        const hud = DotaHUD.Get();
        const topbar = hud.FindChildTraverse("topbar");
        if (topbar) {
            topbar.style.width = "300px";
            topbar.style.marginRight = "120px";
            topbar.style.align = "right top";
        } else {
            $.Msg("Seems valve break FindAndFixTopBar");
        }
    }
}

new DotaDefaultUIElement_fix();
