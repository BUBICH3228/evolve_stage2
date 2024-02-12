/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */
var DotaHUD = GameUI.CustomUIConfig().DotaHUD;
var Utils = GameUI.CustomUIConfig().Utils;
var HeroStats = GameUI.CustomUIConfig().HeroStats;
let MAIN_WINDOW = $("#MainWindow");
let PRIMARY_ATTRIBUTE_PANEL = $("#PrimaryAttribute");
let ATTACK_ATTRIBUTE_PANEL = $("#AttackAttribute");
let DEFENSE_ATTRIBUTE_PANEL = $("#DefenseAttribute");
let OTHERS_STATS_PANEL = $("#OthersStats");
let HERO_MODEL_PANEL = $("#HeroModelPanel");
let MAIN_WINDOW_VISIBLE_STATE = false;
let OLD_HERO_NAME = "";
let data = 
{
    countStat: 0,
    statPerPoint: 0,    
    additionalStats: 0,
    сountPoint: 0
}


function CreateOrUpdateStatsPanel(HeroStatsTableDisplay) {
    ClearStatsPanel();
    if (HeroStatsTableDisplay == undefined) {
        return;
    }
    CreteScenePanel(HeroStatsTableDisplay["HeroName"]);
    if(HeroStatsTableDisplay["Player"] != undefined){
        HeroStats.SetCountPoint(HeroStatsTableDisplay["Player"][Game.GetLocalPlayerID()].CountPoint)
    }
    for (let index = 0; index < Object.entries(HeroStatsTableDisplay.PrimaryAttribute).length; index++) {
        let panel = $.CreatePanel("Panel", PRIMARY_ATTRIBUTE_PANEL, "Stat");
        panel.BLoadLayoutSnippet("TextSnippet");
        if (HeroStatsTableDisplay.PrimaryAttribute == undefined) {
            return;
        }
        CreateInformationStatsPanel(
            panel,
            HeroStatsTableDisplay.PrimaryAttribute[index]
        );
    }
    for (let index = 0; index < Object.entries(HeroStatsTableDisplay.AttackAttribute).length; index++) {
        let panel = $.CreatePanel("Panel", ATTACK_ATTRIBUTE_PANEL, "Stat");
        panel.BLoadLayoutSnippet("TextSnippet");
        if (HeroStatsTableDisplay.AttackAttribute == undefined) {
            return;
        }
        CreateInformationStatsPanel(
            panel,
            HeroStatsTableDisplay.AttackAttribute[index]
        );
    }
    for (let index = 0; index < Object.entries(HeroStatsTableDisplay.DefenseAttribute).length; index++) {
        let panel = $.CreatePanel("Panel", DEFENSE_ATTRIBUTE_PANEL, "Stat");
        panel.BLoadLayoutSnippet("TextSnippet");
        if (HeroStatsTableDisplay.DefenseAttribute == undefined) {
            return;
        }
        CreateInformationStatsPanel(
            panel,
            HeroStatsTableDisplay.DefenseAttribute[index]
        );
    }
    for (let index = 0; index < Object.entries(HeroStatsTableDisplay.OtherStats).length; index++) {
        let panel = $.CreatePanel("Panel", OTHERS_STATS_PANEL, "Stat");
        panel.BLoadLayoutSnippet("TextSnippet");
        if (HeroStatsTableDisplay.OtherStats == undefined) {
            return;
        }
        CreateInformationStatsPanel(
            panel,
            HeroStatsTableDisplay.OtherStats[index]
        );
    }
}

let _schedule = false
function CreateInformationStatsPanel(panel,kv) {
    let iconStatPanel = panel.FindChildTraverse("IconStat");
    iconStatPanel.SetImage(kv.StatImage);

    let nameStatPanel = panel.FindChildTraverse("NameStat");
    nameStatPanel.text = $.Localize("#ui_hero_stats_tooltip_" + kv.StatName) + ":"

    let NumberStatPanel = panel.FindChildTraverse("NumberStat");
    if (kv.StatCount < 1000) {
        NumberStatPanel.text = Utils.FormatBigNumber(kv.StatCount, 1);
    } else {
        NumberStatPanel.text = Utils.FormatBigNumber(kv.StatCount, 3);
    }

    if((kv.IsImproved == 1) == false) {
        return
    }

    panel.SetPanelEvent("onactivate", () => {
        if (_schedule == true) {
            OnDoubleClick(kv)
        } else {
            OnClick(kv)
        }
        _schedule = true
        $.Schedule(0.7, () => {
            _schedule = false
        })
    });
    if (HeroStats.GetAutoUseStatName() == kv.StatName){
        nameStatPanel.style.color = "#ff0000da"
        GameEvents.SendCustomGameEventToServer("custom_hero_stats_change_stat", { StatName: kv.StatName, CountPoint: HeroStats.GetCountPoint(),StatPerPoint: kv.StatPerPoint, StatLimit: kv.StatLimit}) 
    } else {
        if(kv.StatCount < kv.StatLimit) {
            nameStatPanel.style.color = "#9e9764";
        }
    }
}

function OnClick(kv) {
    if(HeroStats.GetCountPoint() >= 1 && kv.StatCount < kv.StatLimit) {
        GameEvents.SendCustomGameEventToServer("custom_hero_stats_change_stat", { StatName: kv.StatName, CountPoint: 1, StatPerPoint: kv.StatPerPoint, StatLimit: kv.StatLimit}) 
    Game.EmitSound("Item.PickUpGemShop");
    }
}

function OnDoubleClick(kv) {
    if (HeroStats.GetAutoUseStatName() == kv.StatName) {
            HeroStats.SetAutoUseStatName("")
    }
    if(HeroStats.GetCountPoint() >= 1 && kv.StatCount < kv.StatLimit) {
        HeroStats.SetAutoUseStatName(kv.StatName) 
    }
}

function CreteScenePanel(HeroName) {
    if (OLD_HERO_NAME != HeroName) {
        OLD_HERO_NAME = HeroName;
        if (HERO_MODEL_PANEL.FindChildTraverse("HeroModel") != undefined) {
            HERO_MODEL_PANEL.FindChildTraverse("HeroModel").DeleteAsync(0);
        }
        HERO_MODEL_PANEL.FindChildTraverse("HeroName").text = $.Localize("#" + HeroName);
        $.CreatePanel("DOTAScenePanel", HERO_MODEL_PANEL, "HeroModel", {
            unit: HeroName,
            particleonly: "false",
            yawmin: "-90",
            yawmax: "90",
            camera: "default_camera",
            drawbackground: "false",
            rendershadows: "false",
            deferredalpha: "false",
            rotateonmousemove: "false",
            rotateonhover: "false"
        });
    }
}

function OnOpenOrCloseButtonPressed() {
    ShowWindow(MAIN_WINDOW_VISIBLE_STATE);
    MAIN_WINDOW_VISIBLE_STATE = !MAIN_WINDOW_VISIBLE_STATE;
}

function ShowWindow(state) {
    MAIN_WINDOW.SetHasClass("Hidden", state);
}

function ClearStatsPanel() {
    PRIMARY_ATTRIBUTE_PANEL.RemoveAndDeleteChildren();
    ATTACK_ATTRIBUTE_PANEL.RemoveAndDeleteChildren();
    DEFENSE_ATTRIBUTE_PANEL.RemoveAndDeleteChildren();
    OTHERS_STATS_PANEL.RemoveAndDeleteChildren();
}

function OnMouseEvent(eventType, clickBehavior) {
    if (
        eventType == "pressed" &&
        !MAIN_WINDOW.BHasClass("Hidden") &&
        (clickBehavior == CLICK_BEHAVIORS.DOTA_CLICK_BEHAVIOR_NONE || clickBehavior == CLICK_BEHAVIORS.DOTA_CLICK_BEHAVIOR_MOVE)
    ) {
        if (DotaHUD.IsCursorOverPanel(MAIN_WINDOW)) {
            OnOpenOrCloseButtonPressed();
        }
    }
}

$.RegisterForUnhandledEvent("Cancelled", () => {
    if (!MAIN_WINDOW.BHasClass("Hidden")) {
        OnOpenOrCloseButtonPressed();
    }
});

function Think() {
    GameEvents.SendCustomGameEventToServer("custom_hero_stats_update_panel",{})
    $("#CountPoint").SetDialogVariable("value", Math.floor(Math.max(HeroStats.GetCountPoint(), 0)));
    $.Schedule(1, Think);
}

(function () {
    ClearStatsPanel();
    Think();
    DotaHUD.ListenToMouseEvent(OnMouseEvent);
    GameEvents.Subscribe("custom_hero_stats_create_or_update", CreateOrUpdateStatsPanel);
    HeroStats.ListenToButtonClickedEvent(1, function () {
        OnOpenOrCloseButtonPressed();
    });
})();
