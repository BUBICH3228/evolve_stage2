export const HeroesData: HeroesDataIntefase = {
    trapper: {
        npc_dota_hero_rattletrap: {
            abilities: {
                0: {
                    abilityName: "rattletrap_harpoon_gun",
                    abilityPreview: "file://{resources}/videos/heroes/ability1.webm"
                },
                1: {
                    abilityName: "rattletrap_sound_spikes",
                    abilityPreview: "file://{resources}/videos/heroes/ability1.webm"
                },
                2: {
                    abilityName: "planetary_shield",
                    abilityPreview: "file://{resources}/videos/heroes/ability1.webm"
                }
            },
            stats: {
                health: 1600,
                attackRate: 1,
                damage: 40,
                speed: 320
            },
            aboutHero: {
                personality: "#ui_hero_rattletrap_personality",
                biography: "ui_hero_rattletrap_biography"
            }
        }
    },
    assault: {
        npc_dota_hero_sniper: {
            abilities: {
                0: {
                    abilityName: "sniper_flamethrower",
                    abilityPreview: "file://{resources}/videos/heroes/ability1.webm"
                },
                1: {
                    abilityName: "sniper_toxic_grenade",
                    abilityPreview: "file://{resources}/videos/heroes/ability1.webm"
                },
                2: {
                    abilityName: "defense_matrix",
                    abilityPreview: "file://{resources}/videos/heroes/ability1.webm"
                }
            },
            stats: {
                health: 1600,
                attackRate: 1,
                damage: 70,
                speed: 550
            },
            aboutHero: {
                personality: "",
                biography: ""
            }
        }
    },
    support: {
        npc_dota_hero_tinker: {
            abilities: {
                0: {
                    abilityName: "tinker_shield_projector",
                    abilityPreview: "file://{resources}/videos/heroes/ability1.webm"
                },
                1: {
                    abilityName: "tinker_orbital_barrage",
                    abilityPreview: "file://{resources}/videos/heroes/ability1.webm"
                },
                2: {
                    abilityName: "shield_burst",
                    abilityPreview: "file://{resources}/videos/heroes/ability1.webm"
                }
            },
            stats: {
                health: 1600,
                attackRate: 1,
                damage: 10,
                speed: 550
            },
            aboutHero: {
                personality: "",
                biography: ""
            }
        }
    },
    medic: {
        npc_dota_hero_snapfire: {
            abilities: {
                0: {
                    abilityName: "snapfire_healing_grenade",
                    abilityPreview: "file://{resources}/videos/heroes/ability1.webm"
                },
                1: {
                    abilityName: "snapfire_acceleration_field",
                    abilityPreview: "file://{resources}/videos/heroes/ability1.webm"
                },
                2: {
                    abilityName: "healing_burst",
                    abilityPreview: "file://{resources}/videos/heroes/ability1.webm"
                }
            },
            stats: {
                health: 1600,
                attackRate: 1,
                damage: 20,
                speed: 550
            },
            aboutHero: {
                personality: "",
                biography: ""
            }
        }
    },
    monster: {
        npc_dota_hero_primal_beast: {
            abilities: {
                0: {
                    abilityName: "goliath_fire_breath",
                    abilityPreview: "file://{resources}/videos/heroes/ability1.webm"
                },
                1: {
                    abilityName: "goliath_leap_smash",
                    abilityPreview: "file://{resources}/videos/heroes/ability1.webm"
                },
                2: {
                    abilityName: "primal_beast_onslaught",
                    abilityPreview: "file://{resources}/videos/heroes/ability1.webm"
                },
                3: {
                    abilityName: "primal_beast_rock_throw",
                    abilityPreview: "file://{resources}/videos/heroes/ability1.webm"
                },
                4: {
                    abilityName: "goliath_smash_attack",
                    abilityPreview: "file://{resources}/videos/heroes/ability1.webm"
                }
            },
            stats: {
                health: [8000, 13000, 18000],
                shild: [4000, 5000, 6000],
                attackRate: 1,
                damage: 70,
                speed: 750
            },
            aboutHero: {
                personality: "",
                biography: ""
            }
        }
    }
};

export declare interface HeroesDataIntefase {
    [classes: string]: { [key: string]: { abilities: AbilitiesData; stats: StatsData; aboutHero: AboutHeroData } };
}

export declare interface AboutHeroData {
    personality: string;
    biography: string;
}

export declare interface AbilitiesData {
    [key: number]: { abilityName: string; abilityPreview: string };
}

export declare interface StatsData {
    health: number | number[];
    shild?: number | number[];
    attackRate: number;
    damage: number | number[];
    speed: number;
}
