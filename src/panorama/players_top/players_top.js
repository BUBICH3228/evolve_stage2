/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */
var DotaHUD = GameUI.CustomUIConfig().DotaHUD;
var TopBarButtons = GameUI.CustomUIConfig().TopBarButtons;
var Constants = GameUI.CustomUIConfig().Constants;
let Utils = GameUI.CustomUIConfig().Utils;
let MAIN_WINDOW = $("#MainWindow");
let PLAYERS_CONTAINER = $("#PlayersContainerPanel");
let YOUR_CONTAINER = $("#YourContainerPanel");
let MAIN_WINDOW_VISIBLE_STATE = false;
const goldColor = "rgb(255, 215, 0)";
const silverColor = "rgb(192, 192, 192)";

let PlayersTopData = {}

let Buttondata = {
    DifficultyButton: 1,
    PlayersStatsButton: 1,
}


const DifficultyButtons = [
    "#EasyButton",
    "#NormalButton",
    "#HardButton",
    "#ImpossibleButton",
]

const t = [
    "Score",
    "MinPassageTime",
    "MaxPassageTime",
    "BossKillCount",
    "CreepKillCount",
]

const DifficultyPlayersStatsButtons = [
    "#RatingButton",
    "#MinGameTimeButton",
    "#MaxGameTimeButton",
    "#CountBossesKilledButton",
    "#CountCrepsKilledButton",
]

function OpenOrClosePlayersTopPanel() {
    GameEvents.SendCustomGameEventToServer("create_top_table", {});
    ShowWindow();
    CreateOrUpdatePlayersTopPanel()
}

function ShowWindow() {
    MAIN_WINDOW.SetHasClass("Hidden", !MAIN_WINDOW_VISIBLE_STATE);
    MAIN_WINDOW_VISIBLE_STATE = !MAIN_WINDOW_VISIBLE_STATE;
}

function OnDifficultyButtonPressed(selectDifficulty) 
{
    for (let index = 0; index < DifficultyButtons.length; index++) {
        if (index == selectDifficulty - 1) {
            Buttondata["DifficultyButton"] = selectDifficulty
            ShowButton($(DifficultyButtons[index]),true)
        } else {
            ShowButton($(DifficultyButtons[index]),false)
        }
    }
}

function OnDifficultyPlayersStatsButtonPressed(selectDifficulty) 
{
    for (let index = 0; index < DifficultyPlayersStatsButtons.length; index++) {
        if (index == selectDifficulty - 1) {
            Buttondata["PlayersStatsButton"] = selectDifficulty
            ShowButton($(DifficultyPlayersStatsButtons[index]),true)
        } else {
            ShowButton($(DifficultyPlayersStatsButtons[index]),false)
        }
    }
}

function ShowButton(panel, state)
{   
    panel.SetHasClass("ButtonActiveClass", state);
    CreateOrUpdatePlayersTopPanel()
}

function CreateOrUpdatePlayersTopPanel() {
    PLAYERS_CONTAINER.RemoveAndDeleteChildren();
    YOUR_CONTAINER.RemoveAndDeleteChildren();
    if (PlayersTopData.data == undefined) {
        return
    }
    for (const [rank,value] of Object.entries(PlayersTopData.data[1][Buttondata.DifficultyButton][Buttondata.PlayersStatsButton])) {
        if (rank <= 100) {
            let panel = $.CreatePanel("Panel", PLAYERS_CONTAINER, "PlayerInfoPanel");
            panel.BLoadLayoutSnippet("PlayerInfoSnippet");
            panel.FindChildTraverse("Avatar").steamid = value["SteamID"]
            panel.FindChildTraverse("Name").steamid = value["SteamID"]
            if (Buttondata.PlayersStatsButton >= 2 && Buttondata.PlayersStatsButton <= 3) {
                panel.FindChildTraverse("Score").text = Utils.FormatTime(value[t[Buttondata.PlayersStatsButton -1]])
            } else {
               panel.FindChildTraverse("Score").text = value[t[Buttondata.PlayersStatsButton -1]] 
            }
            panel.FindChildTraverse("Rank").text = rank
            SetColorBorder(panel,rank)
        }
        
        if (value["SteamID"] == PlayersTopData.SteamID64) {
            if (value["CountGames"] != 0) {
                let panel = $.CreatePanel("Panel", YOUR_CONTAINER, "PlayerInfoPanel");
                panel.BLoadLayoutSnippet("PlayerInfoSnippet");
                panel.FindChildTraverse("Avatar").steamid = value["SteamID"]
                panel.FindChildTraverse("Name").steamid = value["SteamID"]
                if (Buttondata.PlayersStatsButton >= 2 && Buttondata.PlayersStatsButton <= 3) {
                    panel.FindChildTraverse("Score").text = Utils.FormatTime(value[t[Buttondata.PlayersStatsButton -1]])
                } else {
                   panel.FindChildTraverse("Score").text = value[t[Buttondata.PlayersStatsButton -1]] 
                }
                panel.FindChildTraverse("Rank").text = rank
                SetColorBorder(panel,rank)
            }
        }
    }
}

function SetColorBorder(panel,rank) {
    if(rank <= 3){

        panel.FindChildTraverse("Avatar").style.border = "2px solid " + goldColor;
        panel.FindChildTraverse("Name").style.color = goldColor;
        panel.FindChildTraverse("Score").style.color = goldColor;
        panel.FindChildTraverse("Rank").style.color = goldColor;
    } else if(rank > 3 && rank <= 10) {
        panel.FindChildTraverse("Avatar").style.border = "2px solid " + silverColor;
        panel.FindChildTraverse("Name").style.color = silverColor;
        panel.FindChildTraverse("Score").style.color = silverColor;
        panel.FindChildTraverse("Rank").style.color = silverColor;
    }
}

function OnMouseEvent(eventType, clickBehavior) {
    if (
        eventType == "pressed" &&
        !MAIN_WINDOW.BHasClass("Hidden") &&
        (clickBehavior == CLICK_BEHAVIORS.DOTA_CLICK_BEHAVIOR_NONE || clickBehavior == CLICK_BEHAVIORS.DOTA_CLICK_BEHAVIOR_MOVE)
    ) {
        if (DotaHUD.IsCursorOverPanel(MAIN_WINDOW)) {
            ShowWindow();
        }
    }
}

function CreateOrUpdatePlayersTopData(data)
{
    PlayersTopData = data
}


(function () {
    GameEvents.Subscribe("load_top_table", CreateOrUpdatePlayersTopData);
    DotaHUD.ListenToMouseEvent(OnMouseEvent);
    TopBarButtons.ListenToButtonClickedEvent(Constants.TOP_BAR_BUTTONS.PLAYERS_TOP, function () {
        OpenOrClosePlayersTopPanel();
    });
})();