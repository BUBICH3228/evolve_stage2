// eslint-disable-next-line no-var
var HudButtons = GameUI.CustomUIConfig().HudButtons;
// eslint-disable-next-line no-var
var Constants = GameUI.CustomUIConfig().Constants;
// eslint-disable-next-line no-var
export class HuntersHealthbar {
    SHILD_PROGRESS_BAR = $("#ShildProgressBar") as unknown as ProgressBar;
    SHILD_PROGRESS_BAR_LABEL = $("#ShildProgressBarLabel") as LabelPanel;
    HEALTH__PROGRESS_BAR = $("#HealthProgressBar") as unknown as ProgressBar;
    HEALTH__PROGRESS_BAR_LABEL = $("#HealthProgressBarLabel") as LabelPanel;
    MAIN_PANEL = $("#MainPanel");
    playerID = Game.GetLocalPlayerID();
    constructor() {
        this.CreateOrUpdateHealthPanel();
        1;
        HudButtons.ListenToButtonClickedEvent(Constants.HUD_BUTTONS.HERO_SELECTED, () => {
            if (Players.GetTeam(this.playerID) == DotaTeam.GOODGUYS) {
                this.MAIN_PANEL.SetHasClass("Hidden", false);
            }
        });
    }

    private CreateOrUpdateHealthPanel() {
        const entityIndex = Players.GetPlayerHeroEntityIndex(this.playerID);
        if (entityIndex) {
            const maxHealth = Entities.GetMaxHealth(entityIndex);
            const currentHealth = Entities.GetHealth(entityIndex);
            const maxMana = Entities.GetMaxMana(entityIndex);
            const currentMana = Entities.GetMana(entityIndex);
            this.HEALTH__PROGRESS_BAR.max = maxHealth;
            this.HEALTH__PROGRESS_BAR.value = currentHealth;
            this.HEALTH__PROGRESS_BAR_LABEL.text = String(currentHealth);
            this.SHILD_PROGRESS_BAR.max = maxMana;
            this.SHILD_PROGRESS_BAR.value = currentMana;
            this.SHILD_PROGRESS_BAR_LABEL.text = String(currentMana);
        }

        $.Schedule(0.1, () => {
            this.CreateOrUpdateHealthPanel();
        });
    }
}

new HuntersHealthbar();
