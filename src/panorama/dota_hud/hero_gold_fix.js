/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */
"use strict";
var DotaHUD = GameUI.CustomUIConfig().DotaHUD.Get();
var Utils = GameUI.CustomUIConfig().Utils;
var heroGoldLabel = DotaHUD.FindChildTraverse("quickbuy").FindChildTraverse("GoldLabel");

function FindAndFixHeroGold(HeroGoldTable) {
    if (heroGoldLabel == undefined) {
        $.Msg("Seems valve break FindAndFixLevelLabel");
        return;
    }
    let Player = Players.GetLocalPlayerPortraitUnit();
    if (!Entities.IsHero(Player)) {
        heroGoldLabel.text = 0;
        return;
    }
    let PlayerId = Entities.GetPlayerOwnerID(Player);

    let CurrentGold = HeroGoldTable["Player"][PlayerId].CurrentGold;
    if (CurrentGold >= 1000000) {
        CurrentGold = Utils.FormatBigNumber(CurrentGold, 1);
    }
    heroGoldLabel.text = CurrentGold;
}

function Think() {
    let Player = Players.GetLocalPlayerPortraitUnit();
    if (!Entities.IsHero(Player)) {
        heroGoldLabel.text = 0;
        $.Schedule(0.25, Think);
        return;
    }
    let PlayerID = Entities.GetPlayerOwnerID(Player);
    GameEvents.SendCustomGameEventToServer("hero_gold_fix_update_table", { ID: PlayerID });

    $.Schedule(0.5, Think);
}

(function () {
    Think();
    GameEvents.Subscribe("hero_gold_fix_update_label", FindAndFixHeroGold);
})();
