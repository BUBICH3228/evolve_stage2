export class GoldFilter {
    static Init(gme: CDOTABaseGameMode) {
        gme.SetModifyGoldFilter((event) => this.OnFilter(event), this);
    }

    static OnFilter(event: ModifyGoldFilterEvent): boolean {
        CustomEvents.RunEventByName(CustomEvent.CUSTOM_EVENT_ON_PRE_PLAYER_GAIN_GOLD, event);
        return true;
    }
}
