"use strict";


var CustomShop = {
    PlayerData: {},
    neutaralItemsData: []
};

CustomShop.GetNeutralItemsListDefiniteTier = function(tier) {
    return CustomShop.neutaralItemsData[tier - 1]
}

CustomShop.GetCountNeutralTokens = function(PlayerID,tier) {
    if (CustomShop.PlayerData[PlayerID] == undefined) {
        return 0
    }
    return CustomShop.PlayerData[PlayerID].TokensData["TokensCountTier" + tier]
}

CustomShop.GetBossPoint = function(PlayerID) {
    if (CustomShop.PlayerData[PlayerID] == undefined) {
        return 0
    }
    return CustomShop.PlayerData[PlayerID].bossPoint
}

CustomShop.GetPlayerNeutralItems = function(PlayerID) {
    if (CustomShop.PlayerData[PlayerID] == undefined) {
        return {}
    }
    return CustomShop.PlayerData[PlayerID].YourNeutralItems
}

GameUI.CustomUIConfig().CustomShop = CustomShop;

function CustomShopGetData(CustomShopTable) {
    CustomShop.PlayerData = CustomShopTable
}

(function () {
    GameEvents.Subscribe("custom_shop_request_data", CustomShopGetData);
    GameEvents.Subscribe("custom_shop_get_data", CustomShopGetData);
})();