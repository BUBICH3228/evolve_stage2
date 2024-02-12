/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */
"use strict";

var DotaHUD = GameUI.CustomUIConfig().DotaHUD;
var Constants = GameUI.CustomUIConfig().Constants;
var Utils = GameUI.CustomUIConfig().Utils;
var GameSettings = GameUI.CustomUIConfig().GameSettings;

let DOTA_HUD_TOOLTIP_UNIT_STRENGTH_LABEL = null;
let DOTA_HUD_TOOLTIP_UNIT_STRENGTH_BONUS_LABEL = null;
let DOTA_HUD_TOOLTIP_UNIT_AGILITY_LABEL = null;
let DOTA_HUD_TOOLTIP_UNIT_AGILITY_BONUS_LABEL = null;
let DOTA_HUD_TOOLTIP_UNIT_INTELLECT_LABEL = null;
let DOTA_HUD_TOOLTIP_UNIT_INTELLECT_BONUS_LABEL = null;
let DOTA_HUD_TOOLTIP_UNIT_STATS_CONTAINER = null;
let DOTA_HUD_TOOLTIP_UNIT_STATS_PRIMARY_ATTRIBUTE_STRENGTH_DETAILS_LABEL = null;
let DOTA_HUD_TOOLTIP_UNIT_STATS_PRIMARY_ATTRIBUTE_AGILITY_DETAILS_LABEL = null;
let DOTA_HUD_TOOLTIP_UNIT_STATS_PRIMARY_ATTRIBUTE_INTELLIGENCE_DETAILS_LABEL = null;

let DOTA_HUD_TOOLTIP_UNIT_STATS_READY = false;

function GetLocalPlayerSelectedUnitStrength() {
    let dotaHUD = DotaHUD.Get();

    if (!DOTA_HUD_TOOLTIP_UNIT_STRENGTH_LABEL) {
        DOTA_HUD_TOOLTIP_UNIT_STRENGTH_LABEL = dotaHUD.FindChildTraverse("StrengthLabel");
    }
    if (!DOTA_HUD_TOOLTIP_UNIT_STRENGTH_BONUS_LABEL) {
        DOTA_HUD_TOOLTIP_UNIT_STRENGTH_BONUS_LABEL = dotaHUD.FindChildTraverse("StrengthModifierLabel");
    }

    if (DOTA_HUD_TOOLTIP_UNIT_STRENGTH_LABEL != null && DOTA_HUD_TOOLTIP_UNIT_STRENGTH_BONUS_LABEL != null) {
        let baseValue = parseInt(DOTA_HUD_TOOLTIP_UNIT_STRENGTH_LABEL.text);
        let bonusValue = DOTA_HUD_TOOLTIP_UNIT_STRENGTH_BONUS_LABEL.text;
        if (bonusValue.startsWith("+")) {
            bonusValue = parseInt(bonusValue.substring(1));
            if (isNaN(bonusValue)) {
                bonusValue = 0;
            }
        } else {
            bonusValue = parseInt(bonusValue.substring(1));
            if (!isNaN(bonusValue)) {
                bonusValue = bonusValue * -1;
            } else {
                bonusValue = 0;
            }
        }
        if (isNaN(baseValue)) {
            baseValue = 0;
        }
        return baseValue + bonusValue;
    }
    return 0;
}

function GetLocalPlayerSelectedUnitAgility() {
    let dotaHUD = DotaHUD.Get();

    if (!DOTA_HUD_TOOLTIP_UNIT_AGILITY_LABEL) {
        DOTA_HUD_TOOLTIP_UNIT_AGILITY_LABEL = dotaHUD.FindChildTraverse("AgilityLabel");
    }
    if (!DOTA_HUD_TOOLTIP_UNIT_AGILITY_BONUS_LABEL) {
        DOTA_HUD_TOOLTIP_UNIT_AGILITY_BONUS_LABEL = dotaHUD.FindChildTraverse("AgilityModifierLabel");
    }
    if (DOTA_HUD_TOOLTIP_UNIT_AGILITY_LABEL != null && DOTA_HUD_TOOLTIP_UNIT_AGILITY_BONUS_LABEL != null) {
        let baseValue = parseInt(DOTA_HUD_TOOLTIP_UNIT_AGILITY_LABEL.text);
        let bonusValue = DOTA_HUD_TOOLTIP_UNIT_AGILITY_BONUS_LABEL.text;
        if (bonusValue.startsWith("+")) {
            bonusValue = parseInt(bonusValue.substring(1));
            if (isNaN(bonusValue)) {
                bonusValue = 0;
            }
        } else {
            bonusValue = parseInt(bonusValue.substring(1));
            if (!isNaN(bonusValue)) {
                bonusValue = bonusValue * -1;
            } else {
                bonusValue = 0;
            }
        }
        if (isNaN(baseValue)) {
            baseValue = 0;
        }
        return baseValue + bonusValue;
    }
    return 0;
}

function GetLocalPlayerSelectedUnitIntellect() {
    let dotaHUD = DotaHUD.Get();

    if (!DOTA_HUD_TOOLTIP_UNIT_INTELLECT_LABEL) {
        DOTA_HUD_TOOLTIP_UNIT_INTELLECT_LABEL = dotaHUD.FindChildTraverse("IntelligenceLabel");
    }
    if (!DOTA_HUD_TOOLTIP_UNIT_INTELLECT_BONUS_LABEL) {
        DOTA_HUD_TOOLTIP_UNIT_INTELLECT_BONUS_LABEL = dotaHUD.FindChildTraverse("IntelligenceModifierLabel");
    }

    if (DOTA_HUD_TOOLTIP_UNIT_INTELLECT_LABEL != null && DOTA_HUD_TOOLTIP_UNIT_INTELLECT_BONUS_LABEL != null) {
        let baseValue = parseInt(DOTA_HUD_TOOLTIP_UNIT_INTELLECT_LABEL.text);
        let bonusValue = DOTA_HUD_TOOLTIP_UNIT_INTELLECT_BONUS_LABEL.text;
        if (bonusValue.startsWith("+")) {
            bonusValue = parseInt(bonusValue.substring(1));
            if (isNaN(bonusValue)) {
                bonusValue = 0;
            }
        } else {
            bonusValue = parseInt(bonusValue.substring(1));
            if (!isNaN(bonusValue)) {
                bonusValue = bonusValue * -1;
            } else {
                bonusValue = 0;
            }
        }
        if (isNaN(baseValue)) {
            baseValue = 0;
        }
        return baseValue + bonusValue;
    }
    return 0;
}

function OnTooltipVisible(object) {
    if (object.paneltype != "DOTATooltipUnitDamageArmor") {
        return;
    }

    if (DOTA_HUD_TOOLTIP_UNIT_STATS_READY == false) {
        return;
    }

    let dotaHUD = DotaHUD.Get();

    if (!DOTA_HUD_TOOLTIP_UNIT_STATS_CONTAINER) {
        DOTA_HUD_TOOLTIP_UNIT_STATS_CONTAINER = dotaHUD.FindChildTraverse("DOTAHUDDamageArmorTooltip");
    }

    if (!DOTA_HUD_TOOLTIP_UNIT_STATS_PRIMARY_ATTRIBUTE_STRENGTH_DETAILS_LABEL && DOTA_HUD_TOOLTIP_UNIT_STATS_CONTAINER) {
        DOTA_HUD_TOOLTIP_UNIT_STATS_PRIMARY_ATTRIBUTE_STRENGTH_DETAILS_LABEL =
            DOTA_HUD_TOOLTIP_UNIT_STATS_CONTAINER.FindChildTraverse("StrengthDetails");
        DOTA_HUD_TOOLTIP_UNIT_STATS_PRIMARY_ATTRIBUTE_STRENGTH_DETAILS_LABEL.style.height = "40px";
        DOTA_HUD_TOOLTIP_UNIT_STATS_PRIMARY_ATTRIBUTE_STRENGTH_DETAILS_LABEL.style.whiteSpace = "normal";
        DOTA_HUD_TOOLTIP_UNIT_STATS_PRIMARY_ATTRIBUTE_STRENGTH_DETAILS_LABEL.style.textOverflow = "noclip";

        dotaHUD.FindChildTraverse("AttributesContainer").style.height = "280px";
    }
    if (!DOTA_HUD_TOOLTIP_UNIT_STATS_PRIMARY_ATTRIBUTE_AGILITY_DETAILS_LABEL && DOTA_HUD_TOOLTIP_UNIT_STATS_CONTAINER) {
        DOTA_HUD_TOOLTIP_UNIT_STATS_PRIMARY_ATTRIBUTE_AGILITY_DETAILS_LABEL =
            DOTA_HUD_TOOLTIP_UNIT_STATS_CONTAINER.FindChildTraverse("AgilityDetails");
        DOTA_HUD_TOOLTIP_UNIT_STATS_PRIMARY_ATTRIBUTE_AGILITY_DETAILS_LABEL.style.height = "40px";
        DOTA_HUD_TOOLTIP_UNIT_STATS_PRIMARY_ATTRIBUTE_AGILITY_DETAILS_LABEL.style.whiteSpace = "normal";
        DOTA_HUD_TOOLTIP_UNIT_STATS_PRIMARY_ATTRIBUTE_AGILITY_DETAILS_LABEL.style.textOverflow = "noclip";
    }
    if (!DOTA_HUD_TOOLTIP_UNIT_STATS_PRIMARY_ATTRIBUTE_INTELLIGENCE_DETAILS_LABEL && DOTA_HUD_TOOLTIP_UNIT_STATS_CONTAINER) {
        DOTA_HUD_TOOLTIP_UNIT_STATS_PRIMARY_ATTRIBUTE_INTELLIGENCE_DETAILS_LABEL =
            DOTA_HUD_TOOLTIP_UNIT_STATS_CONTAINER.FindChildTraverse("IntelligenceDetails");
        DOTA_HUD_TOOLTIP_UNIT_STATS_PRIMARY_ATTRIBUTE_INTELLIGENCE_DETAILS_LABEL.style.height = "40px";
        DOTA_HUD_TOOLTIP_UNIT_STATS_PRIMARY_ATTRIBUTE_INTELLIGENCE_DETAILS_LABEL.style.whiteSpace = "normal";
        DOTA_HUD_TOOLTIP_UNIT_STATS_PRIMARY_ATTRIBUTE_INTELLIGENCE_DETAILS_LABEL.style.textOverflow = "noclip";
    }

    if (DOTA_HUD_TOOLTIP_UNIT_STATS_PRIMARY_ATTRIBUTE_STRENGTH_DETAILS_LABEL) {
        let playerHeroStr = GetLocalPlayerSelectedUnitStrength();
        let fixedLabel = $.Localize("#ui_unit_stats_detailed_strength_details");
        let healthFromStr = GameSettings.GetSettingValueAsNumber("dota_attribute_health_per_strength") * playerHeroStr;
        let healthRegenerationFromStr =
            GameSettings.GetSettingValueAsNumber("dota_attribute_health_regeneneration_per_strength") * playerHeroStr;
        let magicResistanceFromStr = GameSettings.GetSettingValueAsNumber("dota_attribute_magic_resistance_per_strength") * playerHeroStr;
        fixedLabel = Utils.ReplaceAll(fixedLabel, "%HEALTH%", Math.round(healthFromStr * 100) / 100);
        fixedLabel = Utils.ReplaceAll(fixedLabel, "%HEALTH_REGENERATION%", Math.round(healthRegenerationFromStr * 100) / 100);
        fixedLabel = Utils.ReplaceAll(fixedLabel, "%MAGIC_RESISTANCE%", Math.round(magicResistanceFromStr));
        fixedLabel = Utils.ReplaceAll(fixedLabel, "%%", "%");
        DOTA_HUD_TOOLTIP_UNIT_STATS_PRIMARY_ATTRIBUTE_STRENGTH_DETAILS_LABEL.text = fixedLabel;
    }

    if (DOTA_HUD_TOOLTIP_UNIT_STATS_PRIMARY_ATTRIBUTE_AGILITY_DETAILS_LABEL) {
        let playerHeroAgi = GetLocalPlayerSelectedUnitAgility();
        let fixedLabel = $.Localize("#ui_unit_stats_detailed_agility_details");
        let armorFromAgi = GameSettings.GetSettingValueAsNumber("dota_attribute_armor_per_agility") * playerHeroAgi;
        let attackSpeedFromAgi = GameSettings.GetSettingValueAsNumber("dota_attribute_attack_speed_per_agility") * playerHeroAgi;
        let moveSpeedFromAgi = GameSettings.GetSettingValueAsNumber("dota_attribute_move_speed_per_agility") * playerHeroAgi;

        fixedLabel = Utils.ReplaceAll(fixedLabel, "%ARMOR%", Math.round(armorFromAgi * 10) / 10);
        fixedLabel = Utils.ReplaceAll(fixedLabel, "%ATTACK_SPEED%", Math.round(attackSpeedFromAgi * 100) / 100);
        fixedLabel = Utils.ReplaceAll(fixedLabel, "%MOVE_SPEED%", Math.floor(moveSpeedFromAgi));
        fixedLabel = Utils.ReplaceAll(fixedLabel, "%%", "%");
        DOTA_HUD_TOOLTIP_UNIT_STATS_PRIMARY_ATTRIBUTE_AGILITY_DETAILS_LABEL.text = fixedLabel;
    }

    if (DOTA_HUD_TOOLTIP_UNIT_STATS_PRIMARY_ATTRIBUTE_INTELLIGENCE_DETAILS_LABEL) {
        let playerHeroInt = GetLocalPlayerSelectedUnitIntellect();
        let fixedLabel = $.Localize("#ui_unit_stats_detailed_intelligence_details");
        let manaFromInt = GameSettings.GetSettingValueAsNumber("dota_attribute_mana_per_intelligence") * playerHeroInt;
        let manaRegenerationFromInt =
            GameSettings.GetSettingValueAsNumber("dota_attribute_mana_regeneration_per_intelligence") * playerHeroInt;
        let spellAmplificationFromInt =
            GameSettings.GetSettingValueAsNumber("dota_attribute_spell_ampification_per_intelligence") * playerHeroInt;
        fixedLabel = Utils.ReplaceAll(fixedLabel, "%MANA%", Math.round(manaFromInt * 100) / 100);
        fixedLabel = Utils.ReplaceAll(fixedLabel, "%MANA_REGEN%", Math.round(manaRegenerationFromInt * 100) / 100);
        fixedLabel = Utils.ReplaceAll(fixedLabel, "%SPELL_AMP%", Math.round(spellAmplificationFromInt * 10) / 10);
        fixedLabel = Utils.ReplaceAll(fixedLabel, "%%", "%");
        DOTA_HUD_TOOLTIP_UNIT_STATS_PRIMARY_ATTRIBUTE_INTELLIGENCE_DETAILS_LABEL.text = fixedLabel;
    }
}

(function () {
    $.RegisterForUnhandledEvent("TooltipVisible", OnTooltipVisible);

    GameSettings.ListenToGameSettingsLoadedEvent(function () {
        DOTA_HUD_TOOLTIP_UNIT_STATS_READY = true;
    });
})();
