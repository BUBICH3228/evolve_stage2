import { registerModifier, BaseModifier } from "../libraries/dota_ts_adapter";

@registerModifier()
export class modifier_emblem_donate extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();

    // Modifier specials

    Precache(context: CScriptPrecacheContext) {
        PrecacheResource(PrecacheType.PARTICLE, "particles/custom/emblem/ti10/viola/ti10_emblem_effect_viola.vpcf context", context);
        PrecacheResource(PrecacheType.PARTICLE, "particles/custom/emblem/diretide/orange/fall20_emblem_v2_effect_orange.vpcf", context);
        PrecacheResource(
            PrecacheType.PARTICLE,
            "particles/custom/emblem/ti22/green/fall_2022_emblem_effect_player_base_green.vpcf",
            context
        );
        PrecacheResource(PrecacheType.PARTICLE, "particles/custom/emblem/ti22/gray/fall_2022_emblem_effect_player_base_gray.vpcf", context);
    }
    override IsHidden() {
        return true;
    }
    override IsDebuff() {
        return false;
    }
    override IsPurgable() {
        return false;
    }
    override IsPurgeException() {
        return false;
    }

    override OnCreated(kv: any): void {
        if (!IsServer()) {
            return;
        }
        const effectCast = ParticleManager.CreateParticle(kv.EffectName, ParticleAttachment.POINT_FOLLOW, this.parent);
        ParticleManager.SetParticleControlEnt(
            effectCast,
            2,
            this.parent,
            ParticleAttachment.POINT_FOLLOW,
            ParticleAttachmentLocation.HITLOC,
            Vector(0, 0, 0),
            true
        );

        ParticleManager.SetParticleControl(effectCast, 1, Vector(0, 0, 0));
    }
}
