export const Settings = {
    server: {
        universal_shop_mode: true,

        enable_hero_respawn: true,
        hero_respawn_time: 10,
        starting_gold: 900,
        hero_start_level: 3,
        allow_same_hero_selection: false,
        free_couriers_enabled: true,
        hero_selection_time: 0,
        hero_strategy_time: 0,
        hero_showcase_time: 0,

        gamesetup_lock: true,
        gamesetup_time: 0,
        pre_game_time: 120,
        post_game_time: 20,
        tree_regrow_time: 300,
        passive_gold_tick: 1,

        recommended_builds_disabled: false,
        camera_distance_override: -1,

        minimap_icon_scale: 1,
        minimap_creep_icon_scale: 1,
        minimap_rune_icon_scale: 1,

        rune_spawn_time: 120,
        custom_buyback_cost_enabled: true,
        custom_buyback_cost: 250,
        custom_buyback_cooldown_enabled: false,
        custom_buyback_cooldown: 30,
        buyback_enabled: true,
        game_tv_delay: 0,

        disable_fog_of_war_entirely: false,
        use_unseen_fog_of_war: false,

        use_standard_hero_gold_bounty: true,
        maximum_attack_speed: 700,
        minimum_attack_speed: 50,

        enable_tower_backdoor_protection: false,
        remove_illusions_on_death: false,
        disable_gold_sounds: false,
        use_custom_top_bar_values: false,
        top_bar_visible: true,

        use_custom_hero_levels: true,
        use_custom_xp_values: true,

        give_free_tp_on_death: false,
        tp_scroll_item_slot_override: "item_tp_scroll_custom",

        // Список SteamID32 у которых есть доступ к дебаг панели всегда
        debug_panel_steam_ids: [
            42003545, // =)
            191255670, // Bubich
            475668609, // tychka
            191255670, // tychka(2 акк)
            1097831053 // mazZok_Kalla
        ],

        // Манакосты абилок героев на основе макс маны
        percentage_manacustom_increase_from_spell_amplify_delimiter: 175, // влияет на то как сильно доп. урон от заклинаний увеличивает мана косты героев

        // скиллы на которые не должно влиять увеличение манакоста героев на основе доп. урона от заклинаний
        percentage_manacustom_exceptions: {
            obsidian_destroyer_arcane_orb: true,
            storm_spirit_ball_lightning: true,
            lina_flame_cloak_custom: true,
            ancient_apparition_chilling_touch_custom: true,
            silencer_glaives_of_wisdom_custom: true
        } as exceptionsList,

        // Абилки, которые надо добавить героям при первом респауне
        heroes_first_spawn_abilities_to_add: [""],

        // Модифаеры, которые надо добавить героям при первом респауне
        heroes_first_spawn_modifiers_to_add: [
            "modifier_custom_properties", // кастомные проперти модифаеров
            "modifier_heroes_passive_stats", // пассивные бонусы каждого героя
            "modifier_hero_stats",
            "modifier_passive_gold"
        ],

        heroes_difficulty_debuff: {},

        custom_exp_table: [
            0, // 1
            150, // 2
            300, // 3
            450, // 4
            600, // 5
            750, // 6
            900, // 7
            1050, // 8
            1200, // 9
            1350, // 10
            1500, // 11
            1650, // 12
            1800, // 13
            1950, // 14
            2100, // 15
            2250, // 16
            2400, // 17
            2550, // 18
            2700, // 19
            2850, // 20
            3000, // 21
            3150, // 22
            3300, // 23
            3450, // 24
            3600, // 25
            3750, // 26
            3900, // 27
            4050, // 28
            4200, // 29
            4350, // 30
            4500, // 31
            4650, // 32
            4800, // 33
            4950, // 34
            5100, // 35
            5250, // 36
            5400, // 37
            5550, // 38
            5700, // 39
            5850, // 40
            6000, // 41
            6150, // 42
            6300, // 43
            6450, // 44
            6600, // 45
            6750, // 46
            6900, // 47
            7050, // 48
            7200, // 48
            7350, // 49
            7500, // 50
            7650, // 51
            7800, // 52
            7950, // 53
            8100, // 54
            8250, // 55
            8400, // 56
            8550, // 57
            8700, // 58
            8850, // 59
            9000, // 60
            9150, // 61
            9300, // 62
            9450, // 63
            9600, // 64
            9750, // 65
            9900, // 66
            10050, // 67
            10200, // 68
            10350, // 69
            10500, // 70
            10650, // 71
            10800, // 72
            10950, // 73
            11100, // 74
            11250, // 75
            11400, // 76
            11550, // 77
            11700, // 78
            11850, // 79
            12000, // 80
            12150, // 81
            12300, // 82
            12450, // 83
            12600, // 84
            12750, // 85
            12900, // 86
            13050, // 87
            13200, // 88
            13350, // 89
            13500, // 90
            13650, // 91
            13800, // 92
            13950, // 93
            14100, // 94
            14250, // 95
            14400, // 96
            14550, // 97
            14700, // 98
            14850 // 99
        ]
    },
    client: {
        dota_attribute_health_per_strength: 20, // 20
        dota_attribute_health_regeneneration_per_strength: 0.1,
        dota_attribute_magic_resistance_per_strength: 0.075, //0.025
        dota_attribute_magic_resistance_per_strength_max: 35,
        dota_attribute_attack_damage_per_strength: 1,

        dota_attribute_armor_per_agility: 0.45, //0.167
        dota_attribute_attack_speed_per_agility: 0.75, // 1
        dota_attribute_move_speed_per_agility: 0,
        dota_attribute_move_speed_max: 1000,
        dota_attribute_attack_damage_per_agility: 1,

        dota_attribute_mana_per_intelligence: 12,
        dota_attribute_mana_regeneration_per_intelligence: 0.05,
        dota_attribute_spell_ampification_per_intelligence: 0.2,
        dota_attribute_attack_damage_per_intelligence: 1,

        dota_attribute_attack_damage_per_all: 0.7, // УРОН ЗА АТРИБУТ У УНИВЕРСАЛОВ

        team_max_players: {
            2: 4,
            3: 1
        },

        hero_talents_row_1: 25,
        hero_talents_row_2: 25,
        hero_talents_row_3: 75,
        hero_talents_row_4: 75,
        hero_bonus_attributalent: "talent_bonus_attributes_custom"
    }
};

interface exceptionsList {
    [key: string]: boolean;
}
