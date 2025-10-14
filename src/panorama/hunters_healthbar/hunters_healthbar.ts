/* eslint-disable @typescript-eslint/no-unused-vars */
// eslint-disable-next-line no-var
var HudButtons = GameUI.CustomUIConfig().HudButtons;
// eslint-disable-next-line no-var
var Constants = GameUI.CustomUIConfig().Constants;
// eslint-disable-next-line no-var
export class HuntersHealthbar {
    SHILD_PROGRESS_BAR = $("#ShildBarFG");
    SHILD_PROGRESS_MID = $("#ShildBarMID");
    HERO_MOVIE_CONTAINER = $("#HeroMovieConatiner");
    SHILD_PROGRESS_BAR_LABEL = $("#ShildBarCount") as LabelPanel;
    HEALTH_PROGRESS_BAR = $("#HPBarFG");
    HEALTH_PROGRESS_MID = $("#HPBarMID");
    HEALTH_PROGRESS_BAR_LABEL = $("#HPBarCount") as LabelPanel;
    MAIN_PANEL = $("#MainPanel");
    currentPlayerID = Game.GetLocalPlayerID();
    HERO_MOVIE: HeroMovie;
    constructor() {
        const p = this.HERO_MOVIE_CONTAINER.FindChildTraverse("HeroMovie");
        if (p != null) {
            p.DeleteAsync(0);
        }
        this.HERO_MOVIE = $.CreatePanel("DOTAHeroMovie", this.HERO_MOVIE_CONTAINER, "HeroMovie");
        this.CreateOrUpdateHealthPanel();
    }

    private CreateOrUpdateHealthPanel() {
        const Player = Players.GetLocalPlayerPortraitUnit();
        if (!Entities.IsHero(Player)) {
            $.Schedule(0.5, () => {
                this.CreateOrUpdateHealthPanel();
            });
            return;
        }
        const playerID = Entities.GetPlayerOwnerID(Player);
        if (playerID == this.currentPlayerID && Players.GetTeam(this.currentPlayerID) != Players.GetTeam(playerID)) {
            this.CreateOrUpdateHealthPanel();
        }
        this.currentPlayerID = playerID;
        if (Players.GetTeam(this.currentPlayerID) != DotaTeam.GOODGUYS) {
            return;
        }
        if (this.MAIN_PANEL.BHasClass("Hidden")) {
            this.MAIN_PANEL.SetHasClass("Hidden", false);
        }
        const entityIndex = Players.GetPlayerHeroEntityIndex(this.currentPlayerID);
        if (entityIndex) {
            const maxHealth = Entities.GetMaxHealth(entityIndex);
            const currentHealth = Entities.GetHealth(entityIndex);
            const maxMana = Entities.GetMaxMana(entityIndex);
            const currentMana = Entities.GetMana(entityIndex);
            this.HEALTH_PROGRESS_BAR.style.width = (currentHealth / maxHealth) * 100 + "%";
            $.Schedule(0.215, () => {
                this.HEALTH_PROGRESS_MID.style.width = (currentHealth / maxHealth) * 100 + "%";
            });
            this.HEALTH_PROGRESS_BAR_LABEL.text = currentHealth + " / " + maxHealth;
            this.SHILD_PROGRESS_BAR.style.width = (currentMana / maxMana) * 100 + "%";
            $.Schedule(0.215, () => {
                this.SHILD_PROGRESS_MID.style.width = (currentMana / maxMana) * 100 + "%";
            });
            this.SHILD_PROGRESS_BAR_LABEL.text = currentMana + " / " + maxMana;
            if (this.HERO_MOVIE != null) {
                const PlayerInfo = Game.GetPlayerInfo(this.currentPlayerID);
                if (this.HERO_MOVIE.heroid != PlayerInfo.player_selected_hero_id)
                    this.HERO_MOVIE.heroid = PlayerInfo.player_selected_hero_id;
                this.HERO_MOVIE.SetPanelEvent("onactivate", function () {
                    GameUI.SetCameraTargetPosition(Entities.GetAbsOrigin(PlayerInfo.player_selected_hero_entity_index), 0.1);
                    Players.PlayerPortraitClicked(PlayerInfo.player_id, false, false);
                });
            }
        }

        $.Schedule(0.1, () => {
            this.CreateOrUpdateHealthPanel();
        });
    }
}

new HuntersHealthbar();
