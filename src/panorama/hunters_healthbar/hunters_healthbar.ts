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
    playerID = Game.GetLocalPlayerID();
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
        if (Players.GetTeam(this.playerID) != DotaTeam.GOODGUYS) {
            return;
        }
        if (this.MAIN_PANEL.BHasClass("Hidden")) {
            this.MAIN_PANEL.SetHasClass("Hidden", false);
        }
        const entityIndex = Players.GetPlayerHeroEntityIndex(this.playerID);
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
                const PlayerInfo = Game.GetLocalPlayerInfo();
                if (this.HERO_MOVIE.heroid != PlayerInfo.player_selected_hero_id)
                    this.HERO_MOVIE.heroid = PlayerInfo.player_selected_hero_id;
            }
        }

        $.Schedule(0.1, () => {
            this.CreateOrUpdateHealthPanel();
        });
    }
}

new HuntersHealthbar();
