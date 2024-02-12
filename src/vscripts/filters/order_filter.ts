export class OrderFilter {
    static Init(gme: CDOTABaseGameMode) {
        gme.SetExecuteOrderFilter((event) => this.OnFilter(event), this);
    }

    static OnFilter(event: ExecuteOrderFilterEvent): boolean {
        if (event.units["0"] != undefined) {
            const hero = EntIndexToHScript(event.units["0"]);
            if (
                event.order_type == UnitOrder.PURCHASE_ITEM ||
                event.order_type == UnitOrder.SELL_ITEM ||
                event.order_type == UnitOrder.DISASSEMBLE_ITEM
            ) {
                if (event.shop_item_name && event.shop_item_name == Teleports.GetTeleportItemName()) {
                    return false;
                }
            }
            if (hero != undefined) {
                if (!(hero as CDOTA_BaseNPC).IsHero()) {
                    CustomEvents.RunEventByName(CustomEvent.CUSTOM_EVENT_ON_ORDER, event);
                    return true;
                }
            }

            if (event.order_type == UnitOrder.ATTACK_TARGET) {
                CustomEvents.RunEventByName(CustomEvent.CUSTOM_EVENT_ON_ORDER, event);
                return true;
            }

            const target = EntIndexToHScript(event.entindex_target);
            if (target == undefined) {
                CustomEvents.RunEventByName(CustomEvent.CUSTOM_EVENT_ON_ORDER, event);
                return true;
            }
        }
        CustomEvents.RunEventByName(CustomEvent.CUSTOM_EVENT_ON_ORDER, event);
        return true;
    }
}
