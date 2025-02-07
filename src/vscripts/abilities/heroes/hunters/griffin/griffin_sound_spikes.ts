import { BaseAbility, registerAbility } from "../../../../libraries/dota_ts_adapter";

@registerAbility()
export class griffin_sound_spikes extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();
    pfx!: ParticleID;

    Spawn(): void {
        if (!IsServer()) {
            return;
        }
        this.SetLevel(1);
    }

    override OnSpellStart(): void {
        const position = this.GetCursorPosition();

        CreateUnitByName("", position, true, this.caster, this.caster, this.caster.GetTeam());
    }
}
