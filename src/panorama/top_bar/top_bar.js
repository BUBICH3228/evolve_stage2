/* eslint-disable no-undef */
"use strict";

var PlayerTables = GameUI.CustomUIConfig().PlayerTables;
var Utils = GameUI.CustomUIConfig().Utils;
var GameDifficulty = GameUI.CustomUIConfig().GameDifficulty;
var GameSettings = GameUI.CustomUIConfig().GameSettings;

let TIME_OF_DAY_LABEL = $("#TimeOfDayLabel");
let TIME_OF_DAY_ICON = $("#TimeOfDayIcon");
let PLAYER_PANELS_CONTAINER = $("#HeroesContainer");
let ROOT = $("#TopBarContainer");
let BOSS_TIMER_LABEL = $("#BossTimerLabel");
let BOSS_HEALTH_BAR = $("#BossProgressBar");
let BOSS_HEALTH_BAR_PARTICLE = $("#HealthBurner");
let BOSS_HEALTH_BAR_LABEL = $("#BossHP");
let BOSS_NAME_LABEL = $("#BossLabel");
let DIFFICULTY_IMAGE = $("#DifficultyIcon");
let PLAYER_PANELS = [];

function Think() {
    UpdateTimer();
    UpdateHeroIcons();
    UpdateBossInformation();
    UpdateDifficultyIcon();

    $.Schedule(0.25, Think);
}

function UpdateDifficultyIcon() {
    let selectedDifficulty = GameDifficulty.GetCurrentDifficulty();

    DIFFICULTY_IMAGE.SetImage(GameDifficulty.GetDifficultyImage(selectedDifficulty));
}

function UpdateTimer() {
    if (Game.IsDayTime()) {
        TIME_OF_DAY_ICON.SetImage("s2r://panorama/images/hud/reborn/icon_sun_psd.vtex");
    } else {
        TIME_OF_DAY_ICON.SetImage("s2r://panorama/images/hud/reborn/icon_moon_psd.vtex");
    }

    TIME_OF_DAY_LABEL.text = Utils.FormatTime(Math.abs(Game.GetDOTATime(false, true)));
}

function UpdateHeroIcons() {
    for (var i = 0; i < PLAYER_PANELS.length; i++) {
        var heroPanel = PLAYER_PANELS[i];
        var playerColor = heroPanel.playerColor;
        var heroIcon = heroPanel.playerHeroIcon;
        var playerRespawnTimer = heroPanel.playerRespawnTimer;

        playerColor.style.backgroundColor = Utils.GetPlayerColor(i);

        let heroEntityIndex = Players.GetPlayerHeroEntityIndex(i);

        let isPlayerHaveHero = heroEntityIndex > -1;

        if (isPlayerHaveHero) {
            heroIcon.heroname = Entities.GetUnitName(heroEntityIndex);
        } else {
            heroIcon.heroname = "npc_dota_hero_default";
            continue;
        }

        var playerInfo = Game.GetPlayerInfo(i);

        var playerConnectionState = parseInt(playerInfo["player_connection_state"]);

        var isDisconnected = playerConnectionState != DOTAConnectionState_t.DOTA_CONNECTION_STATE_CONNECTED;

        heroPanel.SetHasClass("IsDisconnected", isDisconnected);

        var isDead = !Entities.IsAlive(heroEntityIndex);

        heroPanel.SetHasClass("IsDead", isDead);

        playerRespawnTimer.text = Players.GetRespawnSeconds(i) + 1;
    }
}

function UpdateBossInformation() {
    ROOT.SetHasClass("IsBossVisible", false);

    let table = PlayerTables.GetAllTableValues("top_bar_ui");

    if (table == null || table == undefined) {
        return;
    }

    let data = table["data"];

    if (data == null || data == undefined) {
        return;
    }

    let timeBeforeBoss = data["start"] + data["delay"] - Game.GetDOTATime(false, false);

    if (timeBeforeBoss < 0) {
        BOSS_TIMER_LABEL.text = Utils.FormatTime(0);
    } else {
        BOSS_TIMER_LABEL.text = Utils.FormatTime(timeBeforeBoss);
    }

    let bosses = table["bosses"];

    if (bosses == null || bosses == undefined) {
        return;
    }

    bosses = Object.entries(bosses).sort(([, a], [, b]) => b["time"] - a["time"]);

    let bossEntityIndex = -1;
    let isBossAlive = false;

    for (const [_, bossData] of bosses) {
        if (Entities.IsAlive(bossData["ent_index"])) {
            bossEntityIndex = bossData["ent_index"];
            isBossAlive = true;
            break;
        }
    }

    ROOT.SetHasClass("IsBossVisible", isBossAlive);

    if (bossEntityIndex < 0) {
        return;
    }

    if (isBossAlive) {
        BOSS_NAME_LABEL.text = $.Localize("#" + Entities.GetUnitName(bossEntityIndex));
        SetBossHealthProgressBarValue(Entities.GetHealth(bossEntityIndex) / Entities.GetMaxHealth(bossEntityIndex));
    } else {
        SetBossHealthProgressBarValue(0);
    }
}

function SetBossHealthProgressBarValue(value) {
    let percentValue = Utils.Round(value * 100);
    BOSS_HEALTH_BAR.value = value;
    BOSS_HEALTH_BAR_PARTICLE.style.width = percentValue + "%";
    BOSS_HEALTH_BAR_LABEL.text = percentValue + "%";
}

function CreateDifficultyIconTooltip() {
    DIFFICULTY_IMAGE.SetPanelEvent("onmouseover", function () {
        $.DispatchEvent(
            "UIShowCustomLayoutParametersTooltip",
            DIFFICULTY_IMAGE,
            "DifficultyTopBarIconTooltip",
            "file://{resources}/layout/custom_game/tooltips/game_difficulty_tooltip.xml",
            "difficulty=" + GameDifficulty.GetCurrentDifficulty()
        );
    });
    DIFFICULTY_IMAGE.SetPanelEvent("onmouseout", function () {
        $.DispatchEvent("UIHideCustomLayoutTooltip", DIFFICULTY_IMAGE, "DifficultyTopBarIconTooltip");
    });
}

function OnHeroIconClicked(playerId) {
    if (playerId < 0) {
        return;
    }

    Players.PlayerPortraitClicked(playerId, GameUI.IsControlDown(), GameUI.IsAltDown());
}

function CreateHeroIcons() {
    let playerTeam = GameSettings.GetSettingValueAsTeamNumber("players_team");

    let playerTeamDetails = Game.GetTeamDetails(playerTeam);
    let playersInPlayerTeam = Game.GetPlayerIDsOnTeam(playerTeam);
    let totalPlayersInPlayerTeam = playerTeamDetails["team_max_players"];
    let missingPlayersInPlayerTeam = totalPlayersInPlayerTeam - playersInPlayerTeam.length;

    PLAYER_PANELS_CONTAINER.RemoveAndDeleteChildren();

    for (let i = 0; i < missingPlayersInPlayerTeam; i++) {
        playersInPlayerTeam.push(-1);
    }

    for (var i = 0; i < playersInPlayerTeam.length; i++) {
        let heroPanel = $.CreatePanel("Panel", PLAYER_PANELS_CONTAINER, "");
        heroPanel.BLoadLayoutSnippet("HeroSlot");
        const playerId = playersInPlayerTeam[i];
        heroPanel.SetPanelEvent("onmouseactivate", function () {
            OnHeroIconClicked(playerId);
        });

        heroPanel.playerHeroIcon = heroPanel.FindChildTraverse("HeroIcon");
        heroPanel.playerColor = heroPanel.FindChildTraverse("PlayerColor");
        heroPanel.playerRespawnTimer = heroPanel.FindChildTraverse("RespawnTimer");
        PLAYER_PANELS.push(heroPanel);
    }

    UpdateHeroIcons();
}

(function () {
    CreateDifficultyIconTooltip();

    Think();

    GameSettings.ListenToGameSettingsLoadedEvent(function () {
        CreateHeroIcons();
        Think();
    });
})();
