/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */
"use strict";
// eslint-disable-next-line no-var
var DotaHUD = GameUI.CustomUIConfig().DotaHUD;
// eslint-disable-next-line no-var
var Constants = GameUI.CustomUIConfig().Constants;
// eslint-disable-next-line no-var
var Utils = GameUI.CustomUIConfig().Utils;
// eslint-disable-next-line no-var
var GameSettings = GameUI.CustomUIConfig().GameSettings;

class UnitDetailedStatsTooltip {
    private DOTA_HUD_TOOLTIP_UNIT_STATS_READY = false;
    private DOTA_HUD_TOOLTIP_UNIT_STRENGTH_LABEL: null | LabelPanel | Panel = null;
    private DOTA_HUD_TOOLTIP_UNIT_STRENGTH_BONUS_LABEL: null | LabelPanel | Panel = null;
    private DOTA_HUD_TOOLTIP_UNIT_AGILITY_LABEL: null | LabelPanel | Panel = null;
    private DOTA_HUD_TOOLTIP_UNIT_AGILITY_BONUS_LABEL: null | LabelPanel | Panel = null;
    private DOTA_HUD_TOOLTIP_UNIT_INTELLECT_LABEL: null | LabelPanel | Panel = null;
    private DOTA_HUD_TOOLTIP_UNIT_INTELLECT_BONUS_LABEL: null | LabelPanel | Panel = null;
    private DOTA_HUD_TOOLTIP_UNIT_STATS_CONTAINER: null | LabelPanel | Panel = null;
    private DOTA_HUD_TOOLTIP_UNIT_STATS_PRIMARY_ATTRIBUTE_STRENGTH_DETAILS_LABEL: null | LabelPanel | Panel = null;
    private DOTA_HUD_TOOLTIP_UNIT_STATS_PRIMARY_ATTRIBUTE_AGILITY_DETAILS_LABEL: null | LabelPanel | Panel = null;
    private DOTA_HUD_TOOLTIP_UNIT_STATS_PRIMARY_ATTRIBUTE_INTELLIGENCE_DETAILS_LABEL: null | LabelPanel | Panel = null;

    constructor() {
        $.RegisterForUnhandledEvent("TooltipVisible", () => {
            this.OnTooltipVisible();
        });
        GameSettings.ListenToGameSettingsLoadedEvent(() => {
            this.DOTA_HUD_TOOLTIP_UNIT_STATS_READY = true;
        });
    }

    private OnTooltipVisible() {
        if (this.DOTA_HUD_TOOLTIP_UNIT_STATS_READY == false) {
            return;
        }

        const dotaHUD = DotaHUD.Get();

        if (!this.DOTA_HUD_TOOLTIP_UNIT_STATS_CONTAINER) {
            this.DOTA_HUD_TOOLTIP_UNIT_STATS_CONTAINER = dotaHUD.FindChildTraverse("DOTAHUDDamageArmorTooltip");
        }

        if (!this.DOTA_HUD_TOOLTIP_UNIT_STATS_PRIMARY_ATTRIBUTE_STRENGTH_DETAILS_LABEL && this.DOTA_HUD_TOOLTIP_UNIT_STATS_CONTAINER) {
            this.DOTA_HUD_TOOLTIP_UNIT_STATS_PRIMARY_ATTRIBUTE_STRENGTH_DETAILS_LABEL =
                this.DOTA_HUD_TOOLTIP_UNIT_STATS_CONTAINER.FindChildTraverse("StrengthDetails") as Panel;
            this.DOTA_HUD_TOOLTIP_UNIT_STATS_PRIMARY_ATTRIBUTE_STRENGTH_DETAILS_LABEL.style.height = "40px";
            this.DOTA_HUD_TOOLTIP_UNIT_STATS_PRIMARY_ATTRIBUTE_STRENGTH_DETAILS_LABEL.style.whiteSpace = "normal";
            this.DOTA_HUD_TOOLTIP_UNIT_STATS_PRIMARY_ATTRIBUTE_STRENGTH_DETAILS_LABEL.style.textOverflow = "noclip";

            (dotaHUD.FindChildTraverse("AttributesContainer") as Panel).style.height = "280px";
        }
        if (!this.DOTA_HUD_TOOLTIP_UNIT_STATS_PRIMARY_ATTRIBUTE_AGILITY_DETAILS_LABEL && this.DOTA_HUD_TOOLTIP_UNIT_STATS_CONTAINER) {
            this.DOTA_HUD_TOOLTIP_UNIT_STATS_PRIMARY_ATTRIBUTE_AGILITY_DETAILS_LABEL =
                this.DOTA_HUD_TOOLTIP_UNIT_STATS_CONTAINER.FindChildTraverse("AgilityDetails") as Panel;
            this.DOTA_HUD_TOOLTIP_UNIT_STATS_PRIMARY_ATTRIBUTE_AGILITY_DETAILS_LABEL.style.height = "40px";
            this.DOTA_HUD_TOOLTIP_UNIT_STATS_PRIMARY_ATTRIBUTE_AGILITY_DETAILS_LABEL.style.whiteSpace = "normal";
            this.DOTA_HUD_TOOLTIP_UNIT_STATS_PRIMARY_ATTRIBUTE_AGILITY_DETAILS_LABEL.style.textOverflow = "noclip";
        }
        if (!this.DOTA_HUD_TOOLTIP_UNIT_STATS_PRIMARY_ATTRIBUTE_INTELLIGENCE_DETAILS_LABEL && this.DOTA_HUD_TOOLTIP_UNIT_STATS_CONTAINER) {
            this.DOTA_HUD_TOOLTIP_UNIT_STATS_PRIMARY_ATTRIBUTE_INTELLIGENCE_DETAILS_LABEL =
                this.DOTA_HUD_TOOLTIP_UNIT_STATS_CONTAINER.FindChildTraverse("IntelligenceDetails") as Panel;
            this.DOTA_HUD_TOOLTIP_UNIT_STATS_PRIMARY_ATTRIBUTE_INTELLIGENCE_DETAILS_LABEL.style.height = "40px";
            this.DOTA_HUD_TOOLTIP_UNIT_STATS_PRIMARY_ATTRIBUTE_INTELLIGENCE_DETAILS_LABEL.style.whiteSpace = "normal";
            this.DOTA_HUD_TOOLTIP_UNIT_STATS_PRIMARY_ATTRIBUTE_INTELLIGENCE_DETAILS_LABEL.style.textOverflow = "noclip";
        }

        if (this.DOTA_HUD_TOOLTIP_UNIT_STATS_PRIMARY_ATTRIBUTE_STRENGTH_DETAILS_LABEL) {
            const playerHeroStr = this.GetLocalPlayerSelectedUnitStrength();
            let fixedLabel = $.Localize("#ui_unit_stats_detailed_strength_details");
            const healthFromStr = GameSettings.GetSettingValueAsNumber("dota_attribute_health_per_strength") * playerHeroStr;
            const healthRegenerationFromStr =
                GameSettings.GetSettingValueAsNumber("dota_attribute_health_regeneneration_per_strength") * playerHeroStr;
            const magicResistanceFromStr =
                GameSettings.GetSettingValueAsNumber("dota_attribute_magic_resistance_per_strength") * playerHeroStr;
            fixedLabel = Utils.ReplaceAll(fixedLabel, "%HEALTH%", String(Math.round(healthFromStr * 100) / 100));
            fixedLabel = Utils.ReplaceAll(fixedLabel, "%HEALTH_REGENERATION%", String(Math.round(healthRegenerationFromStr * 100) / 100));
            fixedLabel = Utils.ReplaceAll(fixedLabel, "%MAGIC_RESISTANCE%", String(Math.round(magicResistanceFromStr)));
            fixedLabel = Utils.ReplaceAll(fixedLabel, "%%", "%");
            this.DOTA_HUD_TOOLTIP_UNIT_STATS_PRIMARY_ATTRIBUTE_STRENGTH_DETAILS_LABEL.text = fixedLabel;
        }

        if (this.DOTA_HUD_TOOLTIP_UNIT_STATS_PRIMARY_ATTRIBUTE_AGILITY_DETAILS_LABEL) {
            const playerHeroAgi = this.GetLocalPlayerSelectedUnitAgility();
            let fixedLabel = $.Localize("#ui_unit_stats_detailed_agility_details");
            const armorFromAgi = GameSettings.GetSettingValueAsNumber("dota_attribute_armor_per_agility") * playerHeroAgi;
            const attackSpeedFromAgi = GameSettings.GetSettingValueAsNumber("dota_attribute_attack_speed_per_agility") * playerHeroAgi;
            const moveSpeedFromAgi = GameSettings.GetSettingValueAsNumber("dota_attribute_move_speed_per_agility") * playerHeroAgi;

            fixedLabel = Utils.ReplaceAll(fixedLabel, "%ARMOR%", String(Math.round(armorFromAgi * 10) / 10));
            fixedLabel = Utils.ReplaceAll(fixedLabel, "%ATTACK_SPEED%", String(Math.round(attackSpeedFromAgi * 100) / 100));
            fixedLabel = Utils.ReplaceAll(fixedLabel, "%MOVE_SPEED%", String(Math.floor(moveSpeedFromAgi)));
            fixedLabel = Utils.ReplaceAll(fixedLabel, "%%", "%");
            this.DOTA_HUD_TOOLTIP_UNIT_STATS_PRIMARY_ATTRIBUTE_AGILITY_DETAILS_LABEL.text = fixedLabel;
        }

        if (this.DOTA_HUD_TOOLTIP_UNIT_STATS_PRIMARY_ATTRIBUTE_INTELLIGENCE_DETAILS_LABEL) {
            const playerHeroInt = this.GetLocalPlayerSelectedUnitIntellect();
            let fixedLabel = $.Localize("#ui_unit_stats_detailed_intelligence_details");
            const manaFromInt = GameSettings.GetSettingValueAsNumber("dota_attribute_mana_per_intelligence") * playerHeroInt;
            const manaRegenerationFromInt =
                GameSettings.GetSettingValueAsNumber("dota_attribute_mana_regeneration_per_intelligence") * playerHeroInt;
            const spellAmplificationFromInt =
                GameSettings.GetSettingValueAsNumber("dota_attribute_spell_ampification_per_intelligence") * playerHeroInt;
            fixedLabel = Utils.ReplaceAll(fixedLabel, "%MANA%", String(Math.round(manaFromInt * 100) / 100));
            fixedLabel = Utils.ReplaceAll(fixedLabel, "%MANA_REGEN%", String(Math.round(manaRegenerationFromInt * 100) / 100));
            fixedLabel = Utils.ReplaceAll(fixedLabel, "%SPELL_AMP%", String(Math.round(spellAmplificationFromInt * 10) / 10));
            fixedLabel = Utils.ReplaceAll(fixedLabel, "%%", "%");
            this.DOTA_HUD_TOOLTIP_UNIT_STATS_PRIMARY_ATTRIBUTE_INTELLIGENCE_DETAILS_LABEL.text = fixedLabel;
        }
    }

    private GetLocalPlayerSelectedUnitStrength() {
        const dotaHUD = DotaHUD.Get();

        if (!this.DOTA_HUD_TOOLTIP_UNIT_STRENGTH_LABEL) {
            this.DOTA_HUD_TOOLTIP_UNIT_STRENGTH_LABEL = dotaHUD.FindChildTraverse("StrengthLabel");
        }
        if (!this.DOTA_HUD_TOOLTIP_UNIT_STRENGTH_BONUS_LABEL) {
            this.DOTA_HUD_TOOLTIP_UNIT_STRENGTH_BONUS_LABEL = dotaHUD.FindChildTraverse("StrengthModifierLabel");
        }

        if (this.DOTA_HUD_TOOLTIP_UNIT_STRENGTH_LABEL != null && this.DOTA_HUD_TOOLTIP_UNIT_STRENGTH_BONUS_LABEL != null) {
            let baseValue = parseInt(this.DOTA_HUD_TOOLTIP_UNIT_STRENGTH_LABEL.text);
            let bonusValue: number | string = this.DOTA_HUD_TOOLTIP_UNIT_STRENGTH_BONUS_LABEL.text;
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

    private GetLocalPlayerSelectedUnitAgility() {
        const dotaHUD = DotaHUD.Get();

        if (!this.DOTA_HUD_TOOLTIP_UNIT_AGILITY_LABEL) {
            this.DOTA_HUD_TOOLTIP_UNIT_AGILITY_LABEL = dotaHUD.FindChildTraverse("AgilityLabel");
        }
        if (!this.DOTA_HUD_TOOLTIP_UNIT_AGILITY_BONUS_LABEL) {
            this.DOTA_HUD_TOOLTIP_UNIT_AGILITY_BONUS_LABEL = dotaHUD.FindChildTraverse("AgilityModifierLabel");
        }
        if (this.DOTA_HUD_TOOLTIP_UNIT_AGILITY_LABEL != null && this.DOTA_HUD_TOOLTIP_UNIT_AGILITY_BONUS_LABEL != null) {
            let baseValue = parseInt(this.DOTA_HUD_TOOLTIP_UNIT_AGILITY_LABEL.text);
            let bonusValue: number | string = this.DOTA_HUD_TOOLTIP_UNIT_AGILITY_BONUS_LABEL.text;
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

    private GetLocalPlayerSelectedUnitIntellect() {
        const dotaHUD = DotaHUD.Get();

        if (!this.DOTA_HUD_TOOLTIP_UNIT_INTELLECT_LABEL) {
            this.DOTA_HUD_TOOLTIP_UNIT_INTELLECT_LABEL = dotaHUD.FindChildTraverse("IntelligenceLabel");
        }
        if (!this.DOTA_HUD_TOOLTIP_UNIT_INTELLECT_BONUS_LABEL) {
            this.DOTA_HUD_TOOLTIP_UNIT_INTELLECT_BONUS_LABEL = dotaHUD.FindChildTraverse("IntelligenceModifierLabel");
        }

        if (this.DOTA_HUD_TOOLTIP_UNIT_INTELLECT_LABEL != null && this.DOTA_HUD_TOOLTIP_UNIT_INTELLECT_BONUS_LABEL != null) {
            let baseValue = parseInt(this.DOTA_HUD_TOOLTIP_UNIT_INTELLECT_LABEL.text);
            let bonusValue: number | string = this.DOTA_HUD_TOOLTIP_UNIT_INTELLECT_BONUS_LABEL.text;
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
}

new UnitDetailedStatsTooltip();
