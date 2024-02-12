/* eslint-disable no-undef */
let NEUTRAL_SHOP_MAIN_PANEL = $("#NeutralShopPanel");
const CustomShop = GameUI.CustomUIConfig().CustomShop;
NEUTRAL_SHOP_MAIN_PANEL.FindChildTraverse("NeutralShopItemContainer").style.overflow = "clip scroll";
NEUTRAL_SHOP_MAIN_PANEL.FindChildTraverse("YourNeutralItemsContainer").style.overflow = "scroll clip";

function CreateNeutralPanel() {
    $("#NeutralShopItemContainerTier1").RemoveAndDeleteChildren()
    $("#NeutralShopItemContainerTier2").RemoveAndDeleteChildren()
    $("#NeutralShopItemContainerTier3").RemoveAndDeleteChildren()
    $("#NeutralShopItemContainerTier4").RemoveAndDeleteChildren()
    $("#NeutralShopItemContainerTier5").RemoveAndDeleteChildren()
    for (let tier = 1; tier <= 5; tier++) {
        const itemData = CustomShop.GetNeutralItemsListDefiniteTier(tier);
        for (const [_, itemname] of Object.entries(itemData)) {
            let panel = $.CreatePanel("Panel", $("#NeutralShopItemContainerTier" + tier), "ShopItem");
            panel.BLoadLayoutSnippet("NeutralShopItemSnippet");
            panel.FindChildTraverse("ItemImage").itemname = itemname;
            panel.FindChildTraverse("ItemCost").text = 1;
            panel
                .FindChildTraverse("ItemCostImage")
                .SetImage("file://{images}/custom_game/ui/custom_shop/neutral_shop/tier" + tier + "_token_png.png");
            const data = {
                tier: tier,
                itemName: itemname,
                itemCost: 1
            };
            panel.SetPanelEvent("onactivate", function () {
                GameEvents.SendCustomGameEventToServer("custom_shop_purchase_neutral_item", {
                    data: data,
                    PlayerID: Game.GetLocalPlayerID(),
                    hasPurchased: true
                }),
                    Game.EmitSound("Item.PickUpGemShop");
            });
        }
    }
}

function CustomShopPutItemNeutralStash() {
    $("#YourNeutralItemsContainer").RemoveAndDeleteChildren();
    for (const [_, itemName] of Object.entries(CustomShop.GetPlayerNeutralItems(Game.GetLocalPlayerID()))) {
        let panel = $.CreatePanel("Panel", $("#YourNeutralItemsContainer"), "YourNeutralItem");
        panel.BLoadLayoutSnippet("YourNeutralShopItemSnippet");
        panel.FindChildTraverse("YourNeutralItemIcon").itemname = itemName;
        const data = {
            tier: 1,
            itemName: itemName,
            itemCost: 1
        };
        panel.SetPanelEvent("onactivate", function () {
            panel.DeleteAsync(0),
                GameEvents.SendCustomGameEventToServer("custom_shop_take_neutral_item", {
                    data: data,
                    PlayerID: Game.GetLocalPlayerID(),
                    hasPurchased: false
                }),
                Game.EmitSound("Item.PickUpGemShop");
        });
    }
    $.Schedule(1, CustomShopPutItemNeutralStash);
}

function CreateOrUpdateTokensTierCount() {
    NEUTRAL_SHOP_MAIN_PANEL.FindChildTraverse("Tier1Tokens").text = CustomShop.GetCountNeutralTokens(Game.GetLocalPlayerID(), 1);
    NEUTRAL_SHOP_MAIN_PANEL.FindChildTraverse("Tier2Tokens").text = CustomShop.GetCountNeutralTokens(Game.GetLocalPlayerID(), 2);
    NEUTRAL_SHOP_MAIN_PANEL.FindChildTraverse("Tier3Tokens").text = CustomShop.GetCountNeutralTokens(Game.GetLocalPlayerID(), 3);
    NEUTRAL_SHOP_MAIN_PANEL.FindChildTraverse("Tier4Tokens").text = CustomShop.GetCountNeutralTokens(Game.GetLocalPlayerID(), 4);
    NEUTRAL_SHOP_MAIN_PANEL.FindChildTraverse("Tier5Tokens").text = CustomShop.GetCountNeutralTokens(Game.GetLocalPlayerID(), 5);
    $.Schedule(1, CreateOrUpdateTokensTierCount);
}

(function () {
    CreateNeutralPanel();
    CreateOrUpdateTokensTierCount();
    CustomShopPutItemNeutralStash();
    GameUI.CustomUIConfig().DotaHUD.Get().FindChildTraverse("GridNeutralsTab").style.visibility = "collapse";
    GameUI.CustomUIConfig().DotaHUD.Get().FindChildTraverse("TeamNeutralItems").style.visibility = "collapse";
})();
