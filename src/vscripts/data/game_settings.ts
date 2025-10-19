export const Settings = {
    server: {
        universal_shop_mode: false,

        enable_hero_respawn: true,
        hero_respawn_time: 120,
        starting_gold: 900,
        hero_start_level: 1,
        allow_same_hero_selection: false,
        free_couriers_enabled: true,
        hero_selection_time: 999999,
        hero_strategy_time: 0,
        hero_penalty_time: 0,
        hero_showcase_time: 0,

        gamesetup_lock: true,
        gamesetup_time: 10,
        pre_game_time: 15,
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
            1097831053 // mazZok_Kalla
        ],

        // Манакосты абилок героев на основе макс маны
        percentage_manacustom_increase_from_spell_amplify_delimiter: 0, // влияет на то как сильно доп. урон от заклинаний увеличивает мана косты героев

        // скиллы на которые не должно влиять увеличение манакоста героев на основе доп. урона от заклинаний
        percentage_manacustom_exceptions: {} as exceptionsList,

        // Абилки, которые надо добавить героям при первом респауне
        heroes_first_spawn_abilities_to_add: [""],

        // Модифаеры, которые надо добавить героям при первом респауне
        heroes_first_spawn_modifiers_to_add: [
            "modifier_custom_properties", // кастомные проперти модифаеров
            "modifier_heroes_passive_stats", // пассивные бонусы каждого героя
            "modifier_animal_instinct"
        ],

        heroes_difficulty_debuff: {},

        custom_exp_table: [
            0, // 1
            40, // 2
            60 // 3
        ]
    },
    client: {
        dota_attribute_health_per_strength: 0, // 20
        dota_attribute_health_regeneneration_per_strength: 0,
        dota_attribute_magic_resistance_per_strength: 0, //0.025
        dota_attribute_magic_resistance_per_strength_max: 0,
        dota_attribute_attack_damage_per_strength: 0,

        dota_attribute_armor_per_agility: 0, //0.167
        dota_attribute_attack_speed_per_agility: 0, // 1
        dota_attribute_move_speed_per_agility: 0,
        dota_attribute_move_speed_max: 1000,
        dota_attribute_attack_damage_per_agility: 0,

        dota_attribute_mana_per_intelligence: 0,
        dota_attribute_mana_regeneration_per_intelligence: 0,
        dota_attribute_spell_ampification_per_intelligence: 0,
        dota_attribute_attack_damage_per_intelligence: 0,

        dota_attribute_attack_damage_per_all: 0, // УРОН ЗА АТРИБУТ У УНИВЕРСАЛОВ

        team_max_players: {
            2: 4,
            3: 1,
            5: 5
        }
    }
};

interface exceptionsList {
    [key: string]: boolean;
}
