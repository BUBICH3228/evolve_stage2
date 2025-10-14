// eslint-disable-next-line no-var
export class MonsterHealthBar {
    SHILD_PROGRESS_BAR = $("#ShildBarFG");
    SHILD_PROGRESS_MID = $("#ShildBarMID");
    HERO_MOVIE_CONTAINER = $("#HeroMovieConatiner");
    SHILD_PROGRESS_BAR_LABEL = $("#ShildBarCount") as LabelPanel;
    HEALTH_PROGRESS_BAR = $("#HPBarFG");
    HEALTH_PROGRESS_MID = $("#HPBarMID");
    HEALTH_PROGRESS_BAR_LABEL = $("#HPBarCount") as LabelPanel;
    EVOLUTION_PANEL = $("#EvolutionPanel");
    EVOLUTION_LABLE = $("#EvolutionPoints");
    constructor() {
        $.Schedule(2, () => {
            this.CreateOrUpdateHealthPanel();
        });
    }

    CreateOrUpdateHealthPanel() {
        const playerID = Game.GetPlayerIDsOnTeam(DotaTeam.BADGUYS)[0];
        if (playerID == null || playerID == undefined) {
            $.Schedule(1, () => {
                this.CreateOrUpdateHealthPanel();
            });
            return;
        }
        const entityIndex = Players.GetPlayerHeroEntityIndex(playerID);
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
            const currentXP = Entities.GetCurrentXP(entityIndex);
            const neededXP = Math.max(Entities.GetNeededXPToLevel(entityIndex), 1);
            const percent = Math.min((currentXP / neededXP) * 100, 100);
            const normalized = Math.pow(percent / 100, 7);
            const r = Math.floor(255 * (1 - normalized)) || 0;
            const g = Math.floor(255 * normalized) || 0;
            this.EVOLUTION_PANEL.style.washColor = `rgb(${r}, ${g}, 0)`;
            if (playerID == Game.GetLocalPlayerID()) {
                this.EVOLUTION_LABLE.text = currentXP + " / " + neededXP;
            } else {
                this.EVOLUTION_LABLE.SetHasClass("Hidden", true);
            }
        }

        $.Schedule(0.1, () => {
            this.CreateOrUpdateHealthPanel();
        });
        return;
    }
}

new MonsterHealthBar();
