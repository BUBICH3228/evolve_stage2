/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/adjacent-overload-signatures */
/* eslint-disable no-redeclare */
/* eslint-disable no-undef */
var Utils = GameUI.CustomUIConfig().Utils;
var TopBarButtons = GameUI.CustomUIConfig().TopBarButtons;
var Constants = GameUI.CustomUIConfig().Constants;
var Selection = GameUI.CustomUIConfig().Selection;

var bHeroPickerVisible = false;

function ToggleHeroPicker(bMainHero) {
    Game.EmitSound("Item.PickUpGemShop");

    $("#SelectHeroContainer").SetHasClass("PickMainHero", bMainHero);

    var temp = bHeroPickerVisible;
    HideAllAdditionalPanels();
    bHeroPickerVisible = temp;
    SetHeroPickerVisible(!bHeroPickerVisible);
}

function SetHeroPickerVisible(bVisible) {
    if (bHeroPickerVisible) {
        if (!bVisible) {
            $("#SelectHeroContainer").RemoveClass("HeroPickerVisible");
            $("#SelectHeroContainer").FindChildTraverse("HeroSearchTextEntry").text = "";
        }
    } else {
        if (bVisible) {
            $("#SelectHeroContainer").AddClass("HeroPickerVisible");
            $("#SelectHeroContainer").FindChildTraverse("HeroSearchTextEntry").SetFocus();
        }
    }
    bHeroPickerVisible = bVisible;
}

function OnHeroSelected(nHeroID) {
    GameEvents.SendCustomGameEventToServer("debug_panel_set_hero", { id: nHeroID });

    $("#SelectHeroContainer").RemoveClass("PickMainHero");
    SetHeroPickerVisible(false);

    Game.EmitSound("Item.PickUpGemShop");
}

function HideAllAdditionalPanels() {
    SetHeroPickerVisible(false);
    ShowDummyDamageLog(false);
    ShowUnitTests(false);
}

function MouseOverRune(strRuneID, strRuneTooltip) {
    var runePanel = $("#" + strRuneID);
    runePanel.StartAnimating();
    $.DispatchEvent("UIShowTextTooltip", runePanel, strRuneTooltip);
}

function MouseOutRune(strRuneID) {
    var runePanel = $("#" + strRuneID);
    runePanel.StopAnimating();
    $.DispatchEvent("UIHideTextTooltip", runePanel);
}

function OnReloadKVRequest() {
    GameEvents.SendCustomGameEventToServer("debug_panel_reload_kv", {});
    Game.EmitSound("Item.PickUpGemShop");
}

function OnIncreaseLvlRequest(amount) {
    GameEvents.SendCustomGameEventToServer("debug_panel_increase_hero_level", {
        lvl: amount,
        unit: Selection.GetLocalPlayerSelectedUnit()
    });
    Game.EmitSound("Item.PickUpGemShop");
}

function OnScepterRequest() {
    GameEvents.SendCustomGameEventToServer("debug_panel_toggle_scepter", {
        unit: Selection.GetLocalPlayerSelectedUnit()
    });
    Game.EmitSound("Item.PickUpGemShop");
}

function OnShardRequest() {
    GameEvents.SendCustomGameEventToServer("debug_panel_toggle_shard", {
        unit: Selection.GetLocalPlayerSelectedUnit()
    });
    Game.EmitSound("Item.PickUpGemShop");
}

function OnInvulnerableRequest() {
    GameEvents.SendCustomGameEventToServer("debug_panel_toggle_invulnerable", {
        unit: Selection.GetLocalPlayerSelectedUnit()
    });
    Game.EmitSound("Item.PickUpGemShop");
}

function OnGraveRequest() {
    GameEvents.SendCustomGameEventToServer("debug_panel_toggle_grave", {
        unit: Selection.GetLocalPlayerSelectedUnit()
    });
    Game.EmitSound("Item.PickUpGemShop");
}

function OnResetHeroRequest() {
    GameEvents.SendCustomGameEventToServer("debug_panel_reset_hero", {
        unit: Selection.GetLocalPlayerSelectedUnit()
    });
    Game.EmitSound("Item.PickUpGemShop");
}

function OnRestoreRequest() {
    GameEvents.SendCustomGameEventToServer("debug_panel_restore", {
        unit: Selection.GetLocalPlayerSelectedUnit()
    });
    Game.EmitSound("Item.PickUpGemShop");
}

function OnRespawnRequest() {
    GameEvents.SendCustomGameEventToServer("debug_panel_respawn_hero", {
        unit: Selection.GetLocalPlayerSelectedUnit()
    });
    Game.EmitSound("Item.PickUpGemShop");
}

function OnKillRequest() {
    GameEvents.SendCustomGameEventToServer("debug_panel_kill", {
        unit: Selection.GetLocalPlayerSelectedUnit()
    });
    Game.EmitSound("Item.PickUpGemShop");
}

function OnSetGoldRequest(gold) {
    GameEvents.SendCustomGameEventToServer("debug_panel_set_gold", {
        gold: gold
    });
    Game.EmitSound("Item.PickUpGemShop");
}

function OnRefreshAbilitiesAndItemsRequest() {
    GameEvents.SendCustomGameEventToServer("debug_panel_refresh_abilities_and_items", {
        unit: Selection.GetLocalPlayerSelectedUnit()
    });
    Game.EmitSound("Item.PickUpGemShop");
}

function OnWTFRequest() {
    let Player = Players.GetLocalPlayerPortraitUnit();
    if (!Entities.IsHero(Player)) {
        return;
    }
    let PlayerID = Entities.GetPlayerOwnerID(Player);
    GameEvents.SendCustomGameEventToServer("debug_panel_wtf", {ID: PlayerID});
    Game.EmitSound("Item.PickUpGemShop");
}

function OnHostTimeScaleSliderValueChanged() {
    var sliderValue = $("#HostTimescaleSlider").value;
    $("#HostTimescaleLabel").SetDialogVariable("value", Utils.Round(sliderValue, 2));
    GameEvents.SendCustomGameEventToServer("debug_panel_set_time_scale", { value: sliderValue });
}

function AdjustTimescaleSlider(value, isSet) {
    var slider = $("#HostTimescaleSlider");
    if (isSet == true) {
        slider.value = value;
        return;
    }
    slider.value = slider.value + value;
}

function OnSpawnRuneRequest(runeEnumName) {
    let rune = DOTA_RUNES.DOTA_RUNE_INVALID;
    if (DOTA_RUNES[runeEnumName] != null) {
        rune = DOTA_RUNES[runeEnumName];
    }
    GameEvents.SendCustomGameEventToServer("debug_panel_spawn_rune", {
        unit: Selection.GetLocalPlayerSelectedUnit(),
        rune: rune
    });
    Game.EmitSound("Item.PickUpGemShop");
}

function ClearDummyDamageLog() {
    $("#DamageLogJournal").RemoveAndDeleteChildren();
}

function ShowDummyDamageLog(state) {
    $("#DummyDamageLogContainer").SetHasClass("DamageLogVisible", state);
}

function ToggleDummyDamageLog() {
    var displayOpen = $("#DummyDamageLogContainer").BHasClass("DamageLogVisible");
    HideAllAdditionalPanels();
    ShowDummyDamageLog(!displayOpen);
    Game.EmitSound("Item.PickUpGemShop");
}

function CreateDummy() {
    GameEvents.SendCustomGameEventToServer("debug_panel_create_dummy", {});
    Game.EmitSound("Item.PickUpGemShop");
}

function ResetDummy() {
    GameEvents.SendCustomGameEventToServer("debug_panel_reset_dummy", {});
    Game.EmitSound("Item.PickUpGemShop");
    ClearDummyDamageLog();
}

function ClearDummyDamageLog() {
    $("#DamageLogJournal").RemoveAndDeleteChildren();
}

function GetDamageNameByType(type) {
    if (type == DAMAGE_TYPES.DAMAGE_TYPE_PHYSICAL) {
        return $.Localize("#DOTA_ToolTip_Damage_Physical");
    }
    if (type == DAMAGE_TYPES.DAMAGE_TYPE_MAGICAL) {
        return $.Localize("#DOTA_ToolTip_Damage_Magical");
    }
    if (type == DAMAGE_TYPES.DAMAGE_TYPE_PURE) {
        return $.Localize("#DOTA_ToolTip_Damage_Pure");
    }
    return "Unknown";
}

function GetNumberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function SetDummyTotalStats(total_dmg, dps, last_hit) {
    $("#DummyTotalDamage").SetDialogVariable("value", GetNumberWithCommas(Math.round(total_dmg)));
    $("#DummyDPS").SetDialogVariable("value", GetNumberWithCommas(Math.round(dps)));
    $("#DummyLastHit").SetDialogVariable("value", GetNumberWithCommas(Math.round(last_hit)));
    if (total_dmg < 1) {
        ClearDummyDamageLog();
    }
}

function OnDamageDoneToDummy(kv) {
    let panel = $.CreatePanel("Label", $("#DamageLogJournal"), "");
    panel.BLoadLayoutSnippet("LabelWithHTML");

    let text = "BUG";

    if (kv.inflictor != null) {
        text = $.Localize("#ui_debug_panel_dummy_target_damage_ability");
    } else {
        text = $.Localize("#ui_debug_panel_dummy_target_damage");
    }

    text = Utils.ReplaceAll(text, "%damage%", GetNumberWithCommas(Math.floor(kv.damage)));
    text = Utils.ReplaceAll(text, "%original_damage%", GetNumberWithCommas(Math.floor(kv.original_damage)));
    text = Utils.ReplaceAll(text, "%damage_type%", GetDamageNameByType(kv.damage_type));
    text = Utils.ReplaceAll(text, "%ability%", kv.inflictor != null ? $.Localize("#dota_tooltip_ability_" + kv.inflictor) : "unknown");

    panel.text = text;
}

function OnUnitTestsDataReceived(kv) {
    for (const [_, error] of Object.entries(kv.data)) {
        let panel = $.CreatePanel("Label", $("#UnitTestsJournal"), "");
        panel.BLoadLayoutSnippet("LabelWithHTML");
        let preSymbol = "<font color='white'>* </font>";
        if (error.level == Constants.UNIT_TESTS_LOG_LEVELS.ERROR) {
            preSymbol = "<font color='red'>X </font>";
        }
        if (error.level == Constants.UNIT_TESTS_LOG_LEVELS.SUCCESS) {
            preSymbol = "<font color='green'>V </font>";
        }
        panel.text = preSymbol + error.text;
    }
}

function RunUnitTests() {
    $("#UnitTestsJournal").RemoveAndDeleteChildren();
    GameEvents.SendCustomGameEventToServer("debug_panel_run_tests", {});
    Game.EmitSound("Item.PickUpGemShop");
}

function ShowUnitTests(state) {
    $("#UnitTestsContainer").SetHasClass("UnitTestsVisible", state);
}

function ToggleUnitTests() {
    var displayOpen = $("#UnitTestsContainer").BHasClass("UnitTestsVisible");
    HideAllAdditionalPanels();
    ShowUnitTests(!displayOpen);
    Game.EmitSound("Item.PickUpGemShop");
}

function FixSelectedHeroButton() {
    let playerHero = Players.GetPlayerHeroEntityIndex(Players.GetLocalPlayer());

    if (playerHero < 0) {
        $.Schedule(0.25, FixSelectedHeroButton);
        return;
    }
    let heroName = Entities.GetUnitName(playerHero);
    var HeroPickerImage = $("#HeroPickerImage");
    if (HeroPickerImage != null) {
        HeroPickerImage.heroname = heroName;
    }

    var spawnHeroNameLabel = $("#SpawnHeroName");
    if (spawnHeroNameLabel != null) {
        spawnHeroNameLabel.text = $.Localize("#" + heroName);
    }
}

function FixHostTimeScaleSlider() {
    var slider = $("#HostTimescaleSlider");
    slider.min = 0.25;
    slider.value = 1;
    slider.max = 20;
    slider.increment = 0.01;
}

function ToggleDebugPanel() {
    var slideThumb = $("#DebugPanelRoot");
    var bMinimized = slideThumb.BHasClass("Minimized");
    HideAllAdditionalPanels();
    slideThumb.SetHasClass("Minimized", !bMinimized);
}

function RestoreState(kv) {
    AdjustTimescaleSlider(kv.timescale, true);
    var wtfCheckbox = $("#FreeSpellsButton");
    if (wtfCheckbox != null) {
        wtfCheckbox.SetSelected(kv.wtf == 1);
    }
    TopBarButtons.ShowButton(Constants.TOP_BAR_BUTTONS.DEBUG, kv.enabled == 1);
}

(function () {
    $.RegisterEventHandler("DOTAUIHeroPickerHeroSelected", $("#SelectHeroContainer"), OnHeroSelected);
    FixSelectedHeroButton();
    FixHostTimeScaleSlider();
    SetDummyTotalStats(0, 0, 0);
    OnHostTimeScaleSliderValueChanged();
    GameEvents.Subscribe("debug_panel_set_hero_response", FixSelectedHeroButton);
    GameEvents.Subscribe("debug_panel_state_for_player_response", RestoreState);
    GameEvents.Subscribe("debug_panel_dummy_on_take_damage", OnDamageDoneToDummy);
    GameEvents.Subscribe("debug_panel_dummy_on_stats", function (kv) {
        SetDummyTotalStats(kv.dummy_total_damage, kv.dummy_dps, kv.dummy_last_hit);
    });
    GameEvents.Subscribe("debug_panel_run_tests_response", OnUnitTestsDataReceived);
    GameEvents.SendCustomGameEventToServer("debug_panel_state_for_player", {});
    TopBarButtons.ListenToButtonClickedEvent(Constants.TOP_BAR_BUTTONS.DEBUG, function () {
        ToggleDebugPanel();
    });
})();
