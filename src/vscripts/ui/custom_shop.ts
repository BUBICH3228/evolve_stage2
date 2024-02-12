/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

export class CustomShop {
    constructor() {
        this.Initialize();
    }

    private Initialize() {
        ListenToGameEvent("game_rules_state_change", () => this.OnGameRulesStateChange(), undefined);
        ListenToGameEvent("entity_killed", (event) => this.OnEntityKilled(event), undefined);
        CustomGameEventManager.RegisterListener("custom_shop_purchase_neutral_item", (_, event) =>
            this.CustomShopPurchaseOrTakeNeutralItem(event)
        );
        CustomGameEventManager.RegisterListener("custom_shop_take_neutral_item", (_, event) =>
            this.CustomShopPurchaseOrTakeNeutralItem(event)
        );
    }

    private OnGameRulesStateChange() {
        const newState = GameRules.State_Get();

        if (newState == GameState.PRE_GAME) {
            CustomEvents.RegisterEventHandler(CustomEvent.CUSTOM_EVENT_ON_ORDER, (data) => this.OnOrder(data as ExecuteOrderFilterEvent));
            for (let PlayerID = 0; PlayerID <= 4; PlayerID++) {
                const player = PlayerResource.GetPlayer(PlayerID as PlayerID);
                if (player == undefined) {
                    return;
                }
                Timers.CreateTimer(0.5, () => {
                    CustomGameEventManager.Send_ServerToPlayer(player, "custom_shop_get_data", CustomShopTable);
                    return 0.5;
                });
            }
        }

        //Пока временная мера получения токенов
        if (newState == GameState.GAME_IN_PROGRESS) {
            let tier = 1;
            Timers.CreateTimer(120, () => {
                if (tier <= 5) {
                    for (let PlayerID = 0; PlayerID <= 4; PlayerID++) {
                        CustomShopTable[PlayerID].TokensData["TokensCountTier" + tier] = 2;
                    }
                    tier++;
                    return 600;
                }
            });
        }
    }

    private CustomShopPurchaseOrTakeNeutralItem(kv: CustomShopPurchaseOrTakeNeutralItem) {
        const PlayerID = kv.PlayerID;
        const itemName = kv.data.itemName;
        const itemCost = kv.data.itemCost;
        const tier = kv.data.tier;
        const hasPurchased = kv.hasPurchased;
        if (itemName == undefined || itemCost == undefined || PlayerID == undefined || hasPurchased == undefined || tier == undefined) {
            return;
        }
        const hero = PlayerResource.GetSelectedHeroEntity(PlayerID);
        const player = PlayerResource.GetPlayer(PlayerID);
        if (hero == undefined || player == undefined) {
            return;
        }
        if (hasPurchased == 0) {
            DropNeutralItemAtPositionForHero(itemName, hero.GetAbsOrigin(), hero, tier, true);
        } else if (itemCost <= CustomShopTable[PlayerID].TokensData["TokensCountTier" + tier]) {
            DropNeutralItemAtPositionForHero(itemName, hero.GetAbsOrigin(), hero, tier, true);
            CustomShopTable[PlayerID].TokensData["TokensCountTier" + tier] -= itemCost;
        } else {
            PlayerResource.SendCustomErrorMessageToPlayer(PlayerID, "ui_custom_shop_upgrade_item_not_gold");
        }
    }

    private OnOrder(kv: ExecuteOrderFilterEvent) {
        const item = EntIndexToHScript(kv.entindex_ability) as CDOTA_Item;

        if (kv.order_type == undefined) {
            return;
        }

        if (item == undefined) {
            return;
        }

        if (kv.order_type == UnitOrder.DROP_ITEM_AT_FOUNTAIN && item.IsNeutralDrop() == true) {
            const player = PlayerResource.GetPlayer(kv.issuer_player_id_const);
            if (player != undefined) {
                const data = CustomShopTable[kv.issuer_player_id_const].YourNeutralItems as string[];
                data.push(item.GetName());
                CustomShopTable[kv.issuer_player_id_const].YourNeutralItems = data;
            }
        }
    }

    private OnEntityKilled(kv: EntityKilledEvent) {
        const target = EntIndexToHScript(kv.entindex_killed) as CDOTA_BaseNPC;
        const player = EntIndexToHScript(kv.entindex_attacker);
        if (player == undefined) {
            return;
        }

        const hero = player.GetOwner() as CDOTA_BaseNPC_Hero;

        if (hero == undefined) {
            return;
        }

        if (target == undefined) {
            return;
        }
        const PlayerID = hero.GetPlayerID();

        if (target.IsBoss()) {
            const countRelic = target.GetCountRelics();
            for (let index = 0; index <= 4; index++) {
                if (PlayerID == index) {
                    this.DropRelicForPlayer(PlayerID, countRelic);
                } else {
                    this.DropRelicForPlayer(index as PlayerID, countRelic * 0.4);
                }
            }
        } else {
            const countRelic = target.GetCountRelics();
            if (RollPseudoRandomPercentage(6, hero) == true) {
                this.DropRelicForPlayer(PlayerID, countRelic);
            }
        }
    }

    private DropRelicForPlayer(PlayerID: PlayerID, count: number) {
        CustomShopTable[PlayerID].bossPoint += count;
    }
}

if (IsServer()) {
    new CustomShop();
}

export const CustomShopTable: CustomShopTable = {
    0: {
        bossPoint: 0,
        itemsCount: 0,
        itemsData: {},
        TokensData: {
            TokensCountTier1: 0,
            TokensCountTier2: 0,
            TokensCountTier3: 0,
            TokensCountTier4: 0,
            TokensCountTier5: 0
        },
        YourNeutralItems: {}
    },
    1: {
        bossPoint: 0,
        itemsCount: 0,
        itemsData: {},
        TokensData: {
            TokensCountTier1: 0,
            TokensCountTier2: 0,
            TokensCountTier3: 0,
            TokensCountTier4: 0,
            TokensCountTier5: 0
        },
        YourNeutralItems: {}
    },
    2: {
        bossPoint: 0,
        itemsCount: 0,
        itemsData: {},
        TokensData: {
            TokensCountTier1: 0,
            TokensCountTier2: 0,
            TokensCountTier3: 0,
            TokensCountTier4: 0,
            TokensCountTier5: 0
        },
        YourNeutralItems: {}
    },
    3: {
        bossPoint: 0,
        itemsCount: 0,
        itemsData: {},
        TokensData: {
            TokensCountTier1: 0,
            TokensCountTier2: 0,
            TokensCountTier3: 0,
            TokensCountTier4: 0,
            TokensCountTier5: 0
        },
        YourNeutralItems: {}
    },
    4: {
        bossPoint: 0,
        itemsCount: 0,
        itemsData: {},
        TokensData: {
            TokensCountTier1: 0,
            TokensCountTier2: 0,
            TokensCountTier3: 0,
            TokensCountTier4: 0,
            TokensCountTier5: 0
        },
        YourNeutralItems: {}
    }
};

interface CustomShopTable {
    [key: number]: any;
}
