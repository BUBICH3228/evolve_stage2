/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */
"use strict";

var TopBarButtons = GameUI.CustomUIConfig().TopBarButtons;
var Constants = GameUI.CustomUIConfig().Constants;

function OnDashboardButtonClicked() {
    TopBarButtons.FireButtonClickedEvent(Constants.TOP_BAR_BUTTONS.DASHBOARD);
    $.DispatchEvent("DOTAHUDShowDashboard", $.GetContextPanel());
    Game.EmitSound("Item.PickUpGemShop");
}

function OnSettingsButtonPressed() {
    TopBarButtons.FireButtonClickedEvent(Constants.TOP_BAR_BUTTONS.SETTINGS);
    $.DispatchEvent("DOTAShowSettingsPopup", $.GetContextPanel());
    Game.EmitSound("Item.PickUpGemShop");
}

function OnScoreboardButtonPressed() {
    TopBarButtons.FireButtonClickedEvent(Constants.TOP_BAR_BUTTONS.SCOREBOARD);
    $.DispatchEvent("DOTAHUDToggleScoreboard", $.GetContextPanel());
    Game.EmitSound("Item.PickUpGemShop");
}

function OnDiscordButtonPressed() {
    TopBarButtons.FireButtonClickedEvent(Constants.TOP_BAR_BUTTONS.DISCORD);
    $.DispatchEvent("ExternalBrowserGoToURL", $.GetContextPanel(), "https://discord.gg/U9AaaxM2by");
    Game.EmitSound("Item.PickUpGemShop");
}

function OnDebugButtonPressed() {
    TopBarButtons.FireButtonClickedEvent(Constants.TOP_BAR_BUTTONS.DEBUG);
    Game.EmitSound("Item.PickUpGemShop");
}

function OnDonationPanelButtonPressed() {
    TopBarButtons.FireButtonClickedEvent(Constants.TOP_BAR_BUTTONS.DONATE);
    $.DispatchEvent("ExternalBrowserGoToURL", $.GetContextPanel(), "https://www.donationalerts.com/r/bubich228322");
    Game.EmitSound("Item.PickUpGemShop");
}

function OnPlayersTopButtonPressed() {
    TopBarButtons.FireButtonClickedEvent(Constants.TOP_BAR_BUTTONS.PLAYERS_TOP);
    Game.EmitSound("Item.PickUpGemShop");
}

(function () {
    TopBarButtons.SetButton(Constants.TOP_BAR_BUTTONS.DASHBOARD, $("#DashboardButton"));
    TopBarButtons.SetButton(Constants.TOP_BAR_BUTTONS.SETTINGS, $("#SettingsButton"));
    TopBarButtons.SetButton(Constants.TOP_BAR_BUTTONS.SCOREBOARD, $("#ToggleScoreboardButton"));
    TopBarButtons.SetButton(Constants.TOP_BAR_BUTTONS.DISCORD, $("#DiscordButton"));
    TopBarButtons.SetButton(Constants.TOP_BAR_BUTTONS.DEBUG, $("#DebugButton"));
    TopBarButtons.SetButton(Constants.TOP_BAR_BUTTONS.DONATE, $("#DonationPanelButton"));
    TopBarButtons.SetButton(Constants.TOP_BAR_BUTTONS.PLAYERS_TOP, $("#PlayersTopButton"));
    TopBarButtons.SetIsInitialized(true);
})();
