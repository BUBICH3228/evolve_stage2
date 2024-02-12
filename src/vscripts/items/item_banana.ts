import { BaseItem, registerAbility } from "../libraries/dota_ts_adapter";

@registerAbility()
export class item_banana_custom extends BaseItem {
    override OnSpellStart(): void {
        const caster = this.GetCaster() as CDOTA_BaseNPC_Hero;
        const allStats = this.GetSpecialValueFor("bonus_all_stats");

        caster.ModifyStrength(allStats);
        caster.ModifyAgility(allStats);
        caster.ModifyIntellect(allStats);

        if (this.GetCurrentCharges() == 1) {
            caster.RemoveItem(this);
        } else if (this.GetCurrentCharges() > 1) {
            this.SetCurrentCharges(this.GetCurrentCharges() - 1);
        }

        EmitSoundOn("ItemBanana.Use", caster);
    }
}
