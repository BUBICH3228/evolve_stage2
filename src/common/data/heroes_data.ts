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
                    abilityName: "rattletrap_scaner",
                    abilityPreview: "file://{resources}/videos/heroes/ability1.webm"
                },
                3: {
                    abilityName: "rattletrap_jetpack",
                    abilityPreview: "file://{resources}/videos/heroes/ability1.webm"
                },
                4: {
                    abilityName: "planetary_shield",
                    abilityPreview: "file://{resources}/videos/heroes/ability1.webm"
                }
            },
            stats: {
                health: 1600,
                shild: 250,
                armor: 0,
                damage: 40,
                speed: 550
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
                    abilityName: "sniper_shrapnel",
                    abilityPreview: "file://{resources}/videos/heroes/ability1.webm"
                },
                1: {
                    abilityName: "sniper_assassinate",
                    abilityPreview: "file://{resources}/videos/heroes/ability1.webm"
                },
                2: {
                    abilityName: "sniper_concussive_grenade",
                    abilityPreview: "file://{resources}/videos/heroes/ability1.webm"
                },
                3: {
                    abilityName: "rattletrap_jetpack",
                    abilityPreview: "file://{resources}/videos/heroes/ability1.webm"
                },
                4: {
                    abilityName: "planetary_shield",
                    abilityPreview: "file://{resources}/videos/heroes/ability1.webm"
                }
            },
            stats: {
                health: 1600,
                shild: 250,
                armor: 0,
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
                    abilityName: "tinker_shield_burst",
                    abilityPreview: "file://{resources}/videos/heroes/ability1.webm"
                },
                3: {
                    abilityName: "rattletrap_jetpack",
                    abilityPreview: "file://{resources}/videos/heroes/ability1.webm"
                },
                4: {
                    abilityName: "planetary_shield",
                    abilityPreview: "file://{resources}/videos/heroes/ability1.webm"
                }
            },
            stats: {
                health: 1600,
                shild: 250,
                armor: 0,
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
        npc_dota_hero_dawnbreaker: {
            abilities: {
                0: {
                    abilityName: "dawnbreaker_healing_grenade",
                    abilityPreview: "file://{resources}/videos/heroes/ability1.webm"
                },
                1: {
                    abilityName: "dawnbreaker_napalm_grenade",
                    abilityPreview: "file://{resources}/videos/heroes/ability1.webm"
                },
                2: {
                    abilityName: "dawnbreaker_acceleration_field",
                    abilityPreview: "file://{resources}/videos/heroes/ability1.webm"
                },
                3: {
                    abilityName: "rattletrap_jetpack",
                    abilityPreview: "file://{resources}/videos/heroes/ability1.webm"
                },
                4: {
                    abilityName: "planetary_shield",
                    abilityPreview: "file://{resources}/videos/heroes/ability1.webm"
                }
            },
            stats: {
                health: 1600,
                shild: 250,
                armor: 0,
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
                armor: 0,
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
    shild: number | number[];
    armor: number;
    damage: number | number[];
    speed: number;
}
