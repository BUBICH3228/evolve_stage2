export const HeroesData: HeroesDataIntefase = {
    trapper: {
        npc_dota_hero_rattletrap: {
            abilities: {
                0: {
                    abilityName: "griffin_harpoon_gun",
                    abilityPreview: "file://{resources}/videos/heroes/ability1.webm"
                },
                1: {
                    abilityName: "griffin_sound_spikes",
                    abilityPreview: "file://{resources}/videos/heroes/ability1.webm"
                },
                2: {
                    abilityName: "griffin_scaner",
                    abilityPreview: "file://{resources}/videos/heroes/ability1.webm"
                },
                3: {
                    abilityName: "planetary_shield",
                    abilityPreview: "file://{resources}/videos/heroes/ability1.webm"
                }
            },
            stats: {
                health: 1654,
                shild: 250,
                armor: 10,
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
                    abilityName: "",
                    abilityPreview: "file://{resources}/videos/heroes/.webm"
                },
                1: {
                    abilityName: "",
                    abilityPreview: "file://{resources}/videos/heroes/.webm"
                },
                2: {
                    abilityName: "",
                    abilityPreview: "file://{resources}/videos/heroes/.webm"
                },
                3: {
                    abilityName: "",
                    abilityPreview: "file://{resources}/videos/heroes/.webm"
                },
                4: {
                    abilityName: "",
                    abilityPreview: "file://{resources}/videos/heroes/.webm"
                }
            },
            stats: {
                health: 1054,
                shild: 150,
                armor: 3,
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
                    abilityName: "hank_shield_projector",
                    abilityPreview: "file://{resources}/videos/heroes/.webm"
                },
                1: {
                    abilityName: "hank_orbital_barrage",
                    abilityPreview: "file://{resources}/videos/heroes/.webm"
                },
                2: {
                    abilityName: "hank_shield_burst",
                    abilityPreview: "file://{resources}/videos/heroes/.webm"
                },
                3: {
                    abilityName: "planetary_shield",
                    abilityPreview: "file://{resources}/videos/heroes/.webm"
                },
                4: {
                    abilityName: "",
                    abilityPreview: "file://{resources}/videos/heroes/.webm"
                }
            },
            stats: {
                health: 1254,
                shild: 450,
                armor: 1,
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
                    abilityName: "",
                    abilityPreview: "file://{resources}/videos/heroes/.webm"
                },
                1: {
                    abilityName: "",
                    abilityPreview: "file://{resources}/videos/heroes/.webm"
                },
                2: {
                    abilityName: "",
                    abilityPreview: "file://{resources}/videos/heroes/.webm"
                },
                3: {
                    abilityName: "",
                    abilityPreview: "file://{resources}/videos/heroes/.webm"
                },
                4: {
                    abilityName: "",
                    abilityPreview: "file://{resources}/videos/heroes/.webm"
                }
            },
            stats: {
                health: 1754,
                shild: 550,
                armor: 3,
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
                    abilityName: "goliath_base_attack",
                    abilityPreview: "file://{resources}/videos/heroes/ability1.webm"
                },
                1: {
                    abilityName: "goliath_fire_breath",
                    abilityPreview: "file://{resources}/videos/heroes/ability1.webm"
                },
                2: {
                    abilityName: "goliath_leap_smash",
                    abilityPreview: "file://{resources}/videos/heroes/ability1.webm"
                },
                3: {
                    abilityName: "goliath_charge",
                    abilityPreview: "file://{resources}/videos/heroes/ability1.webm"
                },
                4: {
                    abilityName: "goliath_rock_throw",
                    abilityPreview: "file://{resources}/videos/heroes/ability1.webm"
                }
            },
            stats: {
                health: 2254,
                shild: 550,
                armor: 3,
                damage: 20,
                speed: 550
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
    health: number;
    shild: number;
    armor: number;
    damage: number;
    speed: number;
}
