declare interface CustomUIConfig {
    Constants: Constants;
}

declare type TopBarButton = {
    DASHBOARD: 0;
    SETTINGS: 1;
    SCOREBOARD: 2;
    DISCORD: 3;
    DEBUG: 4;
};

declare type AttributeDerivedStat = {
    DOTA_ATTRIBUTE_STRENGTH_DAMAGE: 0;
    DOTA_ATTRIBUTE_STRENGTH_HP: 1;
    DOTA_ATTRIBUTE_STRENGTH_HP_REGEN: 2;
    DOTA_ATTRIBUTE_STRENGTH_MAGIC_RESISTANCE: 80;
    DOTA_ATTRIBUTE_AGILITY_DAMAGE: 3;
    DOTA_ATTRIBUTE_AGILITY_ARMOR: 4;
    DOTA_ATTRIBUTE_AGILITY_ATTACK_SPEED: 5;
    DOTA_ATTRIBUTE_AGILITY_MOVE_SPEED: 81;
    DOTA_ATTRIBUTE_AGILITY_MOVE_SPEED_MAX: 82;
    DOTA_ATTRIBUTE_INTELLIGENCE_DAMAGE: 6;
    DOTA_ATTRIBUTE_INTELLIGENCE_MANA: 7;
    DOTA_ATTRIBUTE_INTELLIGENCE_MANA_REGEN: 8;
    DOTA_ATTRIBUTE_INTELLIGENCE_SPELL_AMP: 83;
};

declare type TalentTreeBranche = {
    RIGHT_BRANCH_25: 1;
    LEFT_BRANCH_25: 2;
    RIGHT_BRANCH_50: 3;
    LEFT_BRANCH_50: 4;
    RIGHT_BRANCH_75: 5;
    LEFT_BRANCH_75: 6;
    RIGHT_BRANCH_100: 7;
    LEFT_BRANCH_100: 8;
    BOTTOM_BRANCH_ATTRIBUTES: 9;
};

declare type GameDifficultyType = {
    GAME_DIFFICULTY_EASY: 1;
    GAME_DIFFICULTY_NORMAL: 2;
    GAME_DIFFICULTY_HARD: 3;
    GAME_DIFFICULTY_IMPOSSIBLE: 4;
};

declare type UnitTestsLogLevel = {
    INFO: 0;
    ERROR: 1;
    SUCCESS: 2;
};

declare interface Constants {
    TOP_BAR_BUTTONS: TopBarButton;
    AttributeDerivedStats: AttributeDerivedStat;
    TALENT_TREE_BRANCHES: TalentTreeBranche;
    GAME_DIFFICULTY: GameDifficultyType;
    UNIT_TESTS_LOG_LEVELS: UnitTestsLogLevel;
}

// eslint-disable-next-line no-var
declare var Constants: Constants;
