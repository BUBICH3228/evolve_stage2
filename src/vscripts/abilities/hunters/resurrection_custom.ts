import { BaseAbility, registerAbility } from "../../libraries/dota_ts_adapter";
import { modifier_incapacitated_state } from "../../modifiers/modifier_incapacitated_state";

@registerAbility()
export class resurrection_custom extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();

    StartResurrection(target: CDOTA_BaseNPC_Hero): void {
        this.caster.BeginChannel(
            math.ceil(target.GetHealthDeficit() / this.GetSpecialValueFor("heal_per_second")),
            target,
            GetAbilityTextureNameForAbility(this.GetAbilityName()),
            50,
            () => {
                this.caster.StartGesture(GameActivity.DOTA_TELEPORT);
                const modifier = target.FindModifierByName(modifier_incapacitated_state.name);
                if (modifier != undefined) {
                    modifier.StartIntervalThink(-1);
                }
            },
            (thinkInterval) => {
                target.Heal(this.GetSpecialValueFor("heal_per_second") * thinkInterval, this);
                if (target.GetHealthPercent() == 100) {
                    this.caster.Interrupt();
                    const modifier = target.FindModifierByName(modifier_incapacitated_state.name);
                    if (modifier != undefined) {
                        modifier.Destroy();
                    }
                }
            },
            () => {
                const modifier = target.FindModifierByName(modifier_incapacitated_state.name);
                if (modifier != undefined) {
                    modifier.StartIntervalThink(1);
                }
                this.caster.RemoveGesture(GameActivity.DOTA_TELEPORT);
                this.caster.Interrupt();
            }
        );
    }
}
