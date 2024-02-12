import { BaseAbility, registerAbility } from "../../libraries/dota_ts_adapter";

@registerAbility()
export class custom_teleport_skeleton extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();

    OnChannelFinish(interrupted: boolean): void {
        if (interrupted == true) {
            this.UseResources(false, false, false, true);
            return;
        }
        const ParentID = this.caster.GetPlayerOwnerID() as PlayerID;

        const hero = PlayerResource.GetSelectedHeroEntity(ParentID);

        if (hero == undefined) {
            return;
        }

        const point = hero.GetAbsOrigin();

        this.caster.SetAbsOrigin((point + RandomVector(50)) as Vector);
    }
}
