// eslint-disable-next-line no-var
var Constants: Constants = {
    TOP_BAR_BUTTONS: {
        DASHBOARD: 0,
        SETTINGS: 1,
        SCOREBOARD: 2,
        DISCORD: 3,
        DEBUG: 4,
        DONATE: 5,
        PLAYERS_TOP: 6
    },
    HUD_BUTTONS: {
        HERO_SELECTED: 0
    },
    AttributeDerivedStats: {
        DOTA_ATTRIBUTE_STRENGTH_DAMAGE: 0,
        DOTA_ATTRIBUTE_STRENGTH_HP: 1,
        DOTA_ATTRIBUTE_STRENGTH_HP_REGEN: 2,
        DOTA_ATTRIBUTE_STRENGTH_MAGIC_RESISTANCE: 80,
        DOTA_ATTRIBUTE_AGILITY_DAMAGE: 3,
        DOTA_ATTRIBUTE_AGILITY_ARMOR: 4,
        DOTA_ATTRIBUTE_AGILITY_ATTACK_SPEED: 5,
        DOTA_ATTRIBUTE_AGILITY_MOVE_SPEED: 81,
        DOTA_ATTRIBUTE_AGILITY_MOVE_SPEED_MAX: 82,
        DOTA_ATTRIBUTE_INTELLIGENCE_DAMAGE: 6,
        DOTA_ATTRIBUTE_INTELLIGENCE_MANA: 7,
        DOTA_ATTRIBUTE_INTELLIGENCE_MANA_REGEN: 8,
        DOTA_ATTRIBUTE_INTELLIGENCE_SPELL_AMP: 83
    }
};

declare type TopBarButton = {
    DASHBOARD: number;
    SETTINGS: number;
    SCOREBOARD: number;
    DISCORD: number;
    DEBUG: number;
    DONATE: number;
    PLAYERS_TOP: number;
};

declare type AttributeDerivedStat = {
    DOTA_ATTRIBUTE_STRENGTH_DAMAGE: number;
    DOTA_ATTRIBUTE_STRENGTH_HP: number;
    DOTA_ATTRIBUTE_STRENGTH_HP_REGEN: number;
    DOTA_ATTRIBUTE_STRENGTH_MAGIC_RESISTANCE: number;
    DOTA_ATTRIBUTE_AGILITY_DAMAGE: number;
    DOTA_ATTRIBUTE_AGILITY_ARMOR: number;
    DOTA_ATTRIBUTE_AGILITY_ATTACK_SPEED: number;
    DOTA_ATTRIBUTE_AGILITY_MOVE_SPEED: number;
    DOTA_ATTRIBUTE_AGILITY_MOVE_SPEED_MAX: number;
    DOTA_ATTRIBUTE_INTELLIGENCE_DAMAGE: number;
    DOTA_ATTRIBUTE_INTELLIGENCE_MANA: number;
    DOTA_ATTRIBUTE_INTELLIGENCE_MANA_REGEN: number;
    DOTA_ATTRIBUTE_INTELLIGENCE_SPELL_AMP: number;
};

declare type HudButton = {
    HERO_SELECTED: number;
};

declare interface Constants {
    TOP_BAR_BUTTONS: TopBarButton;
    AttributeDerivedStats: AttributeDerivedStat;
    HUD_BUTTONS: HudButton;
}

declare global {
    interface CustomUIConfig {
        Constants: Constants;
    }
}

GameUI.CustomUIConfig().Constants = Constants;
$.Msg("[Constants] Loaded");
export { Constants };
