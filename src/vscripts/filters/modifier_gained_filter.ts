import { BaseModifier } from "../libraries/dota_ts_adapter";

export class ModifierGainedFilter {
    static Init(gme: CDOTABaseGameMode) {
        gme.SetModifierGainedFilter((event) => this.OnFilter(event), this);
    }

    static OnFilter(keys: ModifierGainedFilterEvent): boolean {
        if (keys.name_const == "modifier_fountain_invulnerability") {
            return false;
        }
        if (!keys.entindex_parent_const || !keys.name_const) {
            return true;
        }
        const parent = EntIndexToHScript(keys.entindex_parent_const) as CDOTA_BaseNPC;
        const modifiers = parent.FindAllModifiersByName(keys.name_const) as BaseModifier[];
        for (const modifier of modifiers) {
            if (ModifierGainedFilter._OverrideModifierFunctions(modifier as BaseModifierModifierGainedFilter) == true) {
                break;
            }
        }
        return true;
    }

    static _OverrideModifierFunctions(modifier: BaseModifierModifierGainedFilter): boolean {
        if (modifier._OverrideModifierFunctionsDone) {
            return false;
        }
        modifier._oldOnDestroy = modifier.OnDestroy;
        modifier.OnDestroy = () => {
            if (modifier._oldOnDestroy != undefined) {
                modifier._oldOnDestroy();
            }
            CustomEvents.RunEventByName(CustomEvent.CUSTOM_EVENT_ON_MODIFIER_DESTROYED, {
                modifier: modifier as BaseModifier
            });
        };
        modifier._oldOnRefresh = modifier.OnRefresh;
        modifier.OnRefresh = (data) => {
            if (modifier._oldOnRefresh != undefined) {
                modifier._oldOnRefresh(data);
            }
            CustomEvents.RunEventByName(CustomEvent.CUSTOM_EVENT_ON_MODIFIER_REFRESHED, {
                modifier: modifier as BaseModifier,
                params: data
            });
        };
        modifier._OnStackCountChanged = modifier.OnStackCountChanged;
        modifier.OnStackCountChanged = (oldStacks) => {
            if (modifier._OnStackCountChanged != undefined) {
                modifier._OnStackCountChanged(oldStacks);
            }
            CustomEvents.RunEventByName(CustomEvent.CUSTOM_EVENT_ON_MODIFIER_STACKS_COUNT_CHANGED, {
                modifier: modifier as BaseModifier,
                oldStacks: oldStacks
            });
        };

        const stacks = modifier.GetStackCount();
        if (stacks != 0) {
            CustomEvents.RunEventByName(CustomEvent.CUSTOM_EVENT_ON_MODIFIER_STACKS_COUNT_CHANGED, {
                modifier: modifier as BaseModifier,
                oldStacks: 0
            });
        }
        CustomEvents.RunEventByName(CustomEvent.CUSTOM_EVENT_ON_MODIFIER_ADDED, {
            modifier: modifier as BaseModifier
        });
        modifier._OverrideModifierFunctionsDone = true;
        return true;
    }
}

interface BaseModifierModifierGainedFilter extends BaseModifier {
    _oldOnDestroy: () => void;
    _oldOnRefresh: (params: object) => void;
    _OnStackCountChanged: (stackCount: number) => void;
    _OverrideModifierFunctionsDone: boolean;
}
