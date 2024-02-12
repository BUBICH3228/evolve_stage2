/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */
let MAIN_PANEL = $("#WaveInfoContainer");
let TIMER_PANEL = $("#Timer");
let TIMER_PROGRESS_PANEL = $("#TimerProgressPanel");
let Utils = GameUI.CustomUIConfig().Utils;
let timer = TIMER_PANEL.text;
let OldTimer = timer;

let tick = 0.25;

function Think() {
    timer = Math.max(timer - tick,0);
    TIMER_PANEL.text = Utils.FormatTime(timer);
    TIMER_PROGRESS_PANEL.style.width = 100 - ((OldTimer - timer) / OldTimer) * 100 + "%";
    $.Schedule(tick, Think);
}

(function () {
    Think();
})();
