import { BaseAbility, registerAbility } from "../../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../../libraries/dota_ts_adapter";

@registerAbility()
export class dash_custom extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();

    Spawn(): void {
        if (!IsServer()) {
            return;
        }
        this.SetLevel(1);
    }
    Precache(context: CScriptPrecacheContext): void {
        PrecacheResource(PrecacheType.PARTICLE, "particles/items_fx/force_staff.vpcf", context);
    }

    override OnSpellStart(): void {
        this.caster.AddNewModifier(this.caster, this, modifier_dash_custom.name, {
            duration: this.GetSpecialValueFor("duration")
        });
    }
}

@registerModifier()
export class modifier_dash_custom extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    angle!: Vector;
    distance!: number;

    // Modifier specials

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
    override RemoveOnDeath() {
        return true;
    }

    override OnCreated(): void {
        this.OnRefresh();
    }

    override OnRefresh(): void {
        if (IsClient()) {
            return;
        }

        const pfx = ParticleManager.CreateParticle("particles/items_fx/force_staff.vpcf", ParticleAttachment.ABSORIGIN_FOLLOW, this.parent);
        ParticleManager.DestroyAndReleaseParticle(pfx, this.GetDuration(), false);
        this.parent.StartGesture(GameActivity.DOTA_FLAIL);

        this.angle = this.parent.GetForwardVector().Normalized() as Vector;
        this.distance = this.ability.GetSpecialValueFor("push_length") / (this.GetDuration() / FrameTime());
        this.StartIntervalThink(0);
    }

    OnIntervalThink(): void {
        const pos = this.parent.GetAbsOrigin();
        GridNav.DestroyTreesAroundPoint(pos, 80, false);
        const pos_p = this.angle * this.distance;
        const next_pos = GetGroundPosition((pos + pos_p) as Vector, this.parent);
        this.parent.SetAbsOrigin(next_pos);
        this.StartIntervalThink(FrameTime());
    }

    OnDestroy(): void {
        if (IsClient()) {
            return;
        }
        this.parent.FadeGesture(GameActivity.DOTA_FLAIL);
        ResolveNPCPositions(this.parent.GetAbsOrigin(), 128);
    }
}
