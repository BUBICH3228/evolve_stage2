export const Difficulties: DifficultiesData = {
    difficulties: {
        [1]: {
            ["max_health_bonus_pct"]: 75,
            ["attack_damage_bonus_pct"]: 75,
            ["spell_amp_bonus_pct"]: 75,
            ["bonus_gold_pct"]: 200,
            ["bonus_XP_pct"]: 200,
            ["count_debuffs_for_hero"]: 0,
            ["spawn_farm_bosses_respawn_time"]: 30,
            ["tower_upgrade_time"]: 60
        },
        [2]: {
            ["max_health_bonus_pct"]: 100,
            ["attack_damage_bonus_pct"]: 100,
            ["spell_amp_bonus_pct"]: 100,
            ["bonus_gold_pct"]: 150,
            ["bonus_XP_pct"]: 100,
            ["count_debuffs_for_hero"]: 1,
            ["spawn_farm_bosses_respawn_time"]: 30,
            ["tower_upgrade_time"]: 50
        },
        [3]: {
            ["max_health_bonus_pct"]: 150,
            ["attack_damage_bonus_pct"]: 150,
            ["spell_amp_bonus_pct"]: 150,
            ["bonus_gold_pct"]: 175,
            ["bonus_XP_pct"]: 125,
            ["count_debuffs_for_hero"]: 2,
            ["spawn_farm_bosses_respawn_time"]: 30,
            ["tower_upgrade_time"]: 40
        },
        [4]: {
            ["max_health_bonus_pct"]: 200,
            ["attack_damage_bonus_pct"]: 200,
            ["spell_amp_bonus_pct"]: 200,
            ["bonus_gold_pct"]: 200,
            ["bonus_XP_pct"]: 150,
            ["count_debuffs_for_hero"]: 3,
            ["spawn_farm_bosses_respawn_time"]: 30,
            ["tower_upgrade_time"]: 30
        }
    }
};

interface DifficultiesData {
    difficulties: { [key: number]: DifficultiSettings };
}

interface DifficultiSettings {
    [key: string]: number;
}
