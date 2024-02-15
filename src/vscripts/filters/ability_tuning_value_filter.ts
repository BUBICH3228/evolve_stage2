import { BaseModifier } from "../libraries/dota_ts_adapter";

export class AbilityTurningValueFilter {
    static Init(gme: CDOTABaseGameMode) {
        gme.SetAbilityTuningValueFilter((event) => this.OnFilter(event), this);
    }

    static OnFilter(event: AbilityTuningValueFilterEvent): boolean {
        const caster_index = event["entindex_caster_const"];
        const ability_index = event["entindex_ability_const"];
        if (!caster_index || !ability_index) {
            return true;
        }
        const ability = EntIndexToHScript(ability_index) as CDOTABaseAbility;
        const caster = EntIndexToHScript(caster_index) as CDOTA_BaseNPC;

        if (
            ability &&
            (ability.GetAbilityKeyValues() as any).AbilityValues &&
            type((ability.GetAbilityKeyValues() as any).AbilityValues[event.value_name_const]) == "table" &&
            (ability.GetAbilityKeyValues() as any).AbilityValues[event.value_name_const].affected_by_aoe_increase
        ) {
            let aoe_bonus_positive = 0;
            let aoe_bonus_negative = 0;
            for (const modifier of caster.FindAllModifiers() as BaseModifier[]) {
                if (modifier.GetModifierAoEBonusConstant && modifier.GetModifierAoEBonusConstant()) {
                    if (modifier.GetModifierAoEBonusConstant() > 0) {
                        aoe_bonus_positive = math.max(aoe_bonus_positive, modifier.GetModifierAoEBonusConstant());
                    } else {
                        aoe_bonus_negative = math.min(aoe_bonus_negative, modifier.GetModifierAoEBonusConstant());
                    }
                }
            }
            event.value = event.value + aoe_bonus_positive + aoe_bonus_negative;
        }
        return true;
    }
}
