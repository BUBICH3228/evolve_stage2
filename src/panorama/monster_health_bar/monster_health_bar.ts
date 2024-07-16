// eslint-disable-next-line no-var
var HudButtons = GameUI.CustomUIConfig().HudButtons;
// eslint-disable-next-line no-var
var Constants = GameUI.CustomUIConfig().Constants;
// eslint-disable-next-line no-var
export class MonsterHealthBar {
    SHILD_BAR_PANEL = $("#ShildBar");
    HEALTH_BAR_PANEL = $("#HealthBar");
    MAIN_PANEL = $("#MainPanel");
    playerID = Game.GetLocalPlayerID();
    entityIndex = Players.GetPlayerHeroEntityIndex(this.playerID);
    constructor() {
        this.CreateOrUpdateHealthPanel();
        HudButtons.ListenToButtonClickedEvent(Constants.HUD_BUTTONS.HERO_SELECTED, () => {
            if (Players.GetTeam(this.playerID) == DotaTeam.BADGUYS) {
                this.MAIN_PANEL.SetHasClass("Hidden", false);
            }
        });
    }

    CreateOrUpdateHealthPanel() {
        //const playerInfo = Game.GetPlayerInfo(this.playerID);
        //const Player = Players.GetLocalPlayerPortraitUnit();
        //const PlayerID = Entities.GetPlayerOwnerID(Player);
        //$.Msg(PlayerID);
        //$.Msg(Entities.NotOnMinimapForEnemies(Player));
        //if (playerInfo.player_team_id != DotaTeam.BADGUYS) {
        //    $.Msg("sss");
        //}

        const playerID = Game.GetPlayerIDsOnTeam(DotaTeam.BADGUYS)[0];
        if (playerID == null || playerID == undefined) {
            $.Schedule(0.1, () => {
                this.CreateOrUpdateHealthPanel();
            });
            return;
        }
        const entityIndex = Players.GetPlayerHeroEntityIndex(playerID);
        if (entityIndex) {
            const maxHealth = Entities.GetMaxHealth(entityIndex);
            const currentHealthPercent = Entities.GetHealthPercent(entityIndex);
            const maxMana = Entities.GetMaxMana(entityIndex);
            const currentMana = Entities.GetMana(entityIndex);
            const currentManaPercent = (currentMana / maxMana) * 100;
            $("#HealthBarSeparator").style.backgroundSize = 700 / (maxHealth / 25) + "px" + " 25px";
            $("#HealthProgress").style.width = currentHealthPercent + "%";

            $("#ShildBarSeparator").style.backgroundSize = (700 * 0.7) / (maxMana / 100) + "px" + " 25px";
            $("#ShildProgress").style.width = currentManaPercent + "%";
        }

        $.Schedule(0.1, () => {
            this.CreateOrUpdateHealthPanel();
        }); //GetPlayerIDsOnTeam
        return;
    }
}

new MonsterHealthBar();
