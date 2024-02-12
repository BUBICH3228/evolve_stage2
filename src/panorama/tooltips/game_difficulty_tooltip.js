/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */
"use strict";

var GameSettings = GameUI.CustomUIConfig().GameSettings;
var Constants = GameUI.CustomUIConfig().Constants;
var Utils = GameUI.CustomUIConfig().Utils;

function GetDifficultyEnum(value) {
    for (const [enumName, enumValue] of Object.entries(Constants.GAME_DIFFICULTY)) {
        if (value == enumValue) {
            return enumName;
        }
    }
    throw "Specified difficulty not exists...";
}

function SetupValueLabel(panel, value) {
    if (panel.id == "BossesRespawnTimeModifierLabel" || panel.id == "TowerUpgradeTimeModifierLabel") {
        panel.text = Utils.FormatTime(value);
    } else if (panel.id == "CountDebuffsForHero") {
        panel.text = value;
    } else {
        panel.text = value + "%";
    }
}

function OnTooltipLoaded() {
    let difficulty = Number($.GetContextPanel().GetAttributeInt("difficulty", -1));
    let data = GameSettings.GetSettingValueAsTable("difficulties");

    let difficultyName = GetDifficultyEnum(difficulty);

    let difficultyData = data[difficultyName];

    SetupValueLabel($("#HealthModifierLabel"), difficultyData["max_health_bonus_pct"]);
    SetupValueLabel($("#AttackDamageModifierLabel"), difficultyData["attack_damage_bonus_pct"]);
    SetupValueLabel($("#SpellAmplificationModifierLabel"), difficultyData["spell_amp_bonus_pct"]);
    SetupValueLabel($("#BonusGoldModifierLabel"), difficultyData["bonus_gold_pct"]);
    SetupValueLabel($("#BonusXPModifierLabel"), difficultyData["bonus_XP_pct"]);
    SetupValueLabel($("#BossesRespawnTimeModifierLabel"), difficultyData["spawn_farm_bosses_respawn_time"]);
    SetupValueLabel($("#TowerUpgradeTimeModifierLabel"), difficultyData["tower_upgrade_time"]);
    SetupValueLabel($("#CountDebuffsForHero"), difficultyData["count_debuffs_for_hero"]);
}
