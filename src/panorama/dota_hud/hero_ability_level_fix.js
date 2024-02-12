/* eslint-disable no-undef */
"use strict";

var DotaHUD = GameUI.CustomUIConfig().DotaHUD;

function FindAndFixAbilityLevel() {
    let dotaHud = DotaHUD.Get();
    const Abilities = dotaHud.FindChildTraverse("abilities");
    if (Abilities) {
        for (let index = 0; index < 10; index++) {
            const Ability = Abilities.FindChildTraverse("Ability" + index);
            if (Ability != undefined) {
                for (let index = 0; index < 20; index++) {
                    const levelUpContainer = Ability.FindChildTraverse("LevelUp" + index);
                    if (levelUpContainer != undefined) {
                        levelUpContainer.style.margin = "0px 0px 0px 0px";
                        levelUpContainer.style.width = "4px";
                    }
                }
            }
        }
        $.Schedule(5, FindAndFixAbilityLevel);
    } else {
        $.Schedule(5, FindAndFixAbilityLevel);
        $.Msg("Seems valve break FindAndFixAbilityLevel");
    }
}

(function () {
    FindAndFixAbilityLevel();
})();
