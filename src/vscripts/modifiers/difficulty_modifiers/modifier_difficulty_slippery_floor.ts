import { registerModifier, BaseModifier } from "../../libraries/dota_ts_adapter";

@registerModifier()
export class modifier_difficulty_slippery_floor extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();

    // Modifier specials

    override IsHidden(): boolean {
        return false;
    }
    override IsDebuff() {
        return true;
    }
    override IsPurgable() {
        return false;
    }
    override IsPurgeException() {
        return false;
    }
    override RemoveOnDeath(): boolean {
        return false;
    }

    GetTexture(): string {
        return "difficulty_modifiers/slippery_floor";
    }

    override OnCreated(): void {
        if (!IsServer()) {
            return;
        }
        Timers.CreateTimer(RandomFloat(80, 180), () => {
            this.parent.AddNewModifier(this.parent, this.ability, "modifier_ice_slide", { duration: 15 });
            return RandomFloat(80, 180);
        });
    }
}
