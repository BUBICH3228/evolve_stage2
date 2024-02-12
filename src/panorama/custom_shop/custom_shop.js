/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */
let playerID = Game.GetLocalPlayerID();
var PlayerTables = GameUI.CustomUIConfig().PlayerTables;
let itemsUpgradePanel = $.GetContextPanel().GetParent();
var DotaHUD = GameUI.CustomUIConfig().DotaHUD;

itemsUpgradePanel.FindChildTraverse("UpgradeItemPanel").style.overflow = "squish scroll";
GameEvents.Subscribe("successful_item_upgrade", SuccessfulItemUpgrade);
GameEvents.Subscribe("create_or_update_upgarde_item_panel", CreateOrUpdateCustomShopPanel);

function CreateOrUpdateCustomShopPanel(CustomShopTable) {
    itemsUpgradePanel.FindChildTraverse("UpgradeItemPanel").RemoveAndDeleteChildren();
    itemsUpgradePanel.FindChildTraverse("UpgradeInfoPanel").style.visibility = "collapse";
    const itemsCount = CustomShopTable[Game.GetLocalPlayerID()].itemsCount;
    const itemData = CustomShopTable[Game.GetLocalPlayerID()].itemData;
    if (itemsCount != 0) {
        for (let index = 0; index < itemsCount + 1; index++) {
            if (itemData[index] != null) {
                itemsUpgradePanel.FindChildTraverse("UpgradeItemPanel").style.visibility = "visible";
                itemsUpgradePanel.FindChildTraverse("StatusPanel").style.visibility = "collapse";
                let panel = $.CreatePanel("Panel", $("#UpgradeItemPanel"), "Item");
                panel.BLoadLayoutSnippet("UpgradeItemSnippet");
                panel.style.marginTop = 75 * (index - 1) + 5 * (index - 1) + 5 + "px";
                panel.FindChildTraverse("ItemIcon").itemname = itemData[index].itemName;
                panel.FindChildTraverse("ItemIcon").contextEntityIndex = itemData[index].itemIndex;
                panel.FindChildTraverse("ItemName").text =
                    $.Localize("#DOTA_Tooltip_Ability_" + itemData[index].itemName) + " " + itemData[index].itemLvl + " lvl";
                panel.SetPanelEvent("onactivate", function () {
                    OnItemsUpgradePanelButtonPressed(itemData[index]);
                });
            } else {
            itemsUpgradePanel.FindChildTraverse("UpgradeItemPanel").style.visibility = "collapse";
            itemsUpgradePanel.FindChildTraverse("StatusPanel").style.visibility = "visible";
            itemsUpgradePanel.FindChildTraverse("UpgradeInfoPanel").style.visibility = "collapse";
            }}
    } else {
        itemsUpgradePanel.FindChildTraverse("UpgradeItemPanel").style.visibility = "collapse";
        itemsUpgradePanel.FindChildTraverse("StatusPanel").style.visibility = "visible";
        itemsUpgradePanel.FindChildTraverse("UpgradeInfoPanel").style.visibility = "collapse";
    }
}

function OnItemsUpgradePanelButtonPressed(itemData) {
    itemsUpgradePanel.FindChildTraverse("UpgradeInfoPanel").style.visibility = "visible";
    itemsUpgradePanel.FindChildTraverse("ItemIconNew").itemname = itemData.itemName;
    itemsUpgradePanel.FindChildTraverse("ItemIconNew").contextEntityIndex = itemData.itemIndex;
    itemsUpgradePanel.FindChildTraverse("OldLevelItem").text = itemData.itemLvl + " lvl";
    itemsUpgradePanel.FindChildTraverse("NewLevelItem").text = itemData.itemLvl + 1 + " lvl";
    itemsUpgradePanel.FindChildTraverse("GoldCostNumber").text = itemData.itemGoldCost;
    itemsUpgradePanel.FindChildTraverse("PointBossCostNumber").text = itemData.itemRelicCost;
    if (itemsUpgradePanel.FindChildTraverse("UpgradeItem")) {
        itemsUpgradePanel.FindChildTraverse("UpgradeItem").DeleteAsync(0);
    }
    itemsUpgradePanel.FindChildTraverse("UpgradeButtonPanel").SetPanelEvent("onactivate", function () {
        GameEvents.SendCustomGameEventToServer("checking_upgrade_item", { items: itemData, PlayerID: playerID }),
            Game.EmitSound("Item.PickUpGemShop");
    });
}

function SuccessfulItemUpgrade(itemData) {
    itemsUpgradePanel.FindChildTraverse("UpgradeInfoPanel").style.visibility = "collapse";
    OnItemsUpgradePanelButtonPressed(itemData.items);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function OnNeutralShopButtonPressed() {
    itemsUpgradePanel.FindChildTraverse("UpgradePanel").style.visibility = "collapse";
    itemsUpgradePanel.FindChildTraverse("NeutralShopPanel").style.visibility = "visible";
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function OnUpgradeButtonPressed() {
    itemsUpgradePanel.FindChildTraverse("UpgradePanel").style.visibility = "visible";
    itemsUpgradePanel.FindChildTraverse("NeutralShopPanel").style.visibility = "collapse";
}

function OnMouseEvent(eventType, clickBehavior) {
    if (
        (eventType == "pressed" && clickBehavior == CLICK_BEHAVIORS.DOTA_CLICK_BEHAVIOR_NONE) ||
        clickBehavior == CLICK_BEHAVIORS.DOTA_CLICK_BEHAVIOR_MOVE
    ) {
        let cursorPos = GameUI.GetCursorPosition();
        let panelPos = itemsUpgradePanel.FindChildTraverse("ShopMenuPanel").GetPositionWithinWindow();
        let width = Number(itemsUpgradePanel.FindChildTraverse("ShopMenuPanel").actuallayoutwidth);
        let height = Number(itemsUpgradePanel.FindChildTraverse("ShopMenuPanel").actuallayoutheight);

        if (
            !(
                Number(panelPos.x) < cursorPos[0] &&
                Number(panelPos.x) + width > cursorPos[0] &&
                Number(panelPos.y) < cursorPos[1] &&
                Number(panelPos.y) + height > cursorPos[1]
            )
        ) {
            itemsUpgradePanel.FindChildTraverse("ShopMenuPanel").style.visibility = "collapse";
        }
    }
}

(function () {
    GameEvents.SendCustomGameEventToServer("create_custom_shop_panel", {});
    DotaHUD.ListenToMouseEvent(OnMouseEvent);
})();
