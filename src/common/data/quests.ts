import { DealDamageQuestAction } from "../quests/actions/deal_damage_quest_action";
import { ReachHeroLevelQuestAction } from "../quests/actions/reach_hero_level_quest_action";
import { TalkToNpcQuestAction } from "../quests/actions/talk_to_npc_quest_action";
import { UseTeleportScrollQuestAction } from "../quests/actions/use_teleport_scroll_quest_action";
import { Quest } from "../quests/interfaces/quest";
import { ArrayWithUniqueValues } from "../types/array_with_unique_values";

// Возможные id квестов (должны быть уникальные и больше 0)
const questIds = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const; //, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30] as const;

// Квесты менять тут (награду и т.п.)
export const QuestsList: Readonly<Record<QuestID, Quest>> = {
    1: {
        name: "tutorial_1",
        actions: {
            0: new TalkToNpcQuestAction({
                npcName: "npc_quests_base_2",
                requiredCompletedQuestActions: [],
                infoTargetName: "npc_quests_base_2"
            })
        },
        //addQuestOnHeroSelected: true,
        npcName: "npc_quests_base_2",
        repeatable: false,
        rewards: {
            gold: 0,
            heroExperience: 0,
            items: []
        }
    },
    2: {
        name: "tutorial_2",
        actions: {
            0: new TalkToNpcQuestAction({
                npcName: "npc_goodguys_fort",
                requiredCompletedQuestActions: [],
                infoTargetName: undefined
            })
        },
        requirments: {
            completedQuests: [1]
        },
        npcName: "npc_quests_base_2",
        repeatable: true,
        rewards: {
            gold: 0,
            heroExperience: 0,
            items: []
        }
    },
    3: {
        name: "tutorial_3",
        actions: {
            0: new TalkToNpcQuestAction({
                npcName: "npc_dota_good_tower",
                requiredCompletedQuestActions: [],
                infoTargetName: undefined
            })
        },
        npcName: "npc_goodguys_fort",
        requirments: {
            completedQuests: [2]
        },
        repeatable: true,
        rewards: {
            gold: 0,
            heroExperience: 0,
            items: []
        }
    },
    4: {
        name: "tutorial_4",
        actions: {
            0: new UseTeleportScrollQuestAction({
                teleportScrollsToUse: 1,
                requiredCompletedQuestActions: [],
                infoTargetName: undefined
            })
        },
        requirments: {
            completedQuests: [3]
        },
        npcName: "npc_goodguys_fort",
        repeatable: true,
        rewards: {
            gold: 0,
            heroExperience: 0,
            items: []
        }
    },
    5: {
        name: "tutorial_5",
        actions: {
            0: new DealDamageQuestAction({
                requiredDamageDone: 10000,
                requiredCompletedQuestActions: [],
                infoTargetName: undefined
            }),
            1: new TalkToNpcQuestAction({
                npcName: "npc_quests_base_3",
                requiredCompletedQuestActions: [0],
                infoTargetName: undefined
            })
        },
        npcName: "npc_quests_base_3",
        repeatable: false,
        rewards: {
            gold: 0,
            heroExperience: 0,
            items: []
        }
    },
    6: {
        name: "reach_hero_level_1",
        actions: {
            0: new ReachHeroLevelQuestAction({
                requiredHeroLevel: 25,
                requiredCompletedQuestActions: [],
                infoTargetName: undefined
            }),
            1: new TalkToNpcQuestAction({
                npcName: "npc_quests_base_1",
                requiredCompletedQuestActions: [0],
                infoTargetName: undefined
            })
        },
        npcName: "npc_quests_base_1",
        repeatable: false,
        rewards: {
            gold: 0,
            heroExperience: 0,
            items: []
        }
    },
    7: {
        name: "reach_hero_level_2",
        actions: {
            0: new ReachHeroLevelQuestAction({
                requiredHeroLevel: 50,
                requiredCompletedQuestActions: [],
                infoTargetName: undefined
            }),
            1: new TalkToNpcQuestAction({
                npcName: "npc_quests_base_1",
                requiredCompletedQuestActions: [0],
                infoTargetName: undefined
            })
        },
        npcName: "npc_quests_base_1",
        repeatable: false,
        requirments: {
            completedQuests: [1]
        },
        rewards: {
            gold: 0,
            heroExperience: 0,
            items: []
        }
    },
    8: {
        name: "reach_hero_level_3",
        actions: {
            0: new ReachHeroLevelQuestAction({
                requiredHeroLevel: 75,
                requiredCompletedQuestActions: [],
                infoTargetName: undefined
            }),
            1: new TalkToNpcQuestAction({
                npcName: "npc_quests_base_1",
                requiredCompletedQuestActions: [0],
                infoTargetName: undefined
            })
        },
        npcName: "npc_quests_base_1",
        repeatable: false,
        requirments: {
            completedQuests: [2]
        },
        rewards: {
            gold: 0,
            heroExperience: 0,
            items: []
        }
    },
    9: {
        name: "reach_hero_level_4",
        actions: {
            0: new ReachHeroLevelQuestAction({
                requiredHeroLevel: 100,
                requiredCompletedQuestActions: [],
                infoTargetName: undefined
            }),
            1: new TalkToNpcQuestAction({
                npcName: "npc_quests_base_1",
                requiredCompletedQuestActions: [0],
                infoTargetName: undefined
            })
        },
        npcName: "npc_quests_base_1",
        repeatable: false,
        requirments: {
            completedQuests: [3]
        },
        rewards: {
            gold: 0,
            heroExperience: 0,
            items: []
        }
    }
};

const QuestID: ArrayWithUniqueValues<typeof questIds> = questIds;
export type QuestID = (typeof QuestID)[number];
