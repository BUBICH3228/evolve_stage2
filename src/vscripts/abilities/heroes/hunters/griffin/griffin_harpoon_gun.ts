import { BaseAbility, registerAbility } from "../../../../libraries/dota_ts_adapter";

@registerAbility()
export class griffin_harpoon_gun extends BaseAbility {
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
        const target = this.GetCursorTarget();
        if (target == undefined) {
            return;
        }
        //target?.AddNewModifier(this.caster, this, "", {
        //    duration: this.GetSpecialValueFor("duration") * (1 - target.GetStatusResistance())
        // });
        const direction = ((target.GetAbsOrigin() - this.GetCaster().GetAbsOrigin()) as Vector).Normalized();

        direction.z = 0;

        this.pfx = ParticleManager.CreateParticle(
            "particles/units/heroes/hero_rattletrap/rattletrap_hookshot.vpcf",
            ParticleAttachment.CUSTOMORIGIN,
            this.caster
        );

        ParticleManager.SetParticleControlEnt(
            this.pfx,
            0,
            this.GetCaster(),
            ParticleAttachment.POINT_FOLLOW,
            ParticleAttachmentLocation.WEAPON,
            this.GetCaster().GetAbsOrigin(),
            true
        );

        ParticleManager.SetParticleControl(this.pfx, 2, Vector(this.GetSpecialValueFor("speed"), 0, 0));
        ParticleManager.SetParticleControl(this.pfx, 3, Vector(this.GetSpecialValueFor("duration"), 0, 0));
        Timers.CreateTimer(0.1, () => {
            ParticleManager.SetParticleControl(this.pfx, 1, target.GetAbsOrigin());
            return 0.1;
        });
    }
}
