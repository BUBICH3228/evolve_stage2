import { DamageFilter } from "./damage_filter";
import { AbilityTurningValueFilter } from "./ability_tuning_value_filter";
import { ModifierGainedFilter } from "./modifier_gained_filter";
import { GoldFilter } from "./gold_filter";
import { OrderFilter } from "./order_filter";
export class Filters {
    static Init(gme: CDOTABaseGameMode) {
        AbilityTurningValueFilter.Init(gme);
        DamageFilter.Init(gme);
        GoldFilter.Init(gme);
        ModifierGainedFilter.Init(gme);
        OrderFilter.Init(gme);
    }
}
