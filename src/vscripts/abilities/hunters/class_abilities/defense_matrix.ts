import { BaseAbility, registerAbility } from "../../../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../../../libraries/dota_ts_adapter";

@registerAbility()
export class defense_matrix extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();

    Precache(context: CScriptPrecacheContext): void {
        PrecacheResource(PrecacheType.PARTICLE, "particles/units/heroes/hero_pangolier/pangolier_tailthump_buff.vpcf", context);
    }

    override OnSpellStart(): void {
        this.caster.AddNewModifier(this.caster, this, modifier_defense_matrix.name, { duration: this.GetSpecialValueFor("duration") });
    }
}

@registerModifier()
export class modifier_defense_matrix extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    damageReduction!: number;

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

    DeclareFunctions(): modifierfunction[] {
        return [ModifierFunction.INCOMING_DAMAGE_PERCENTAGE];
    }

    GetModifierIncomingDamage_Percentage(): number {
        return this.damageReduction;
    }

    override OnCreated(): void {
        this.OnRefresh();

        if (IsClient()) {
            return;
        }

        const pfx = ParticleManager.CreateParticle(
            "particles/units/heroes/hero_pangolier/pangolier_tailthump_buff.vpcf",
            ParticleAttachment.ABSORIGIN_FOLLOW,
            this.parent
        );
        ParticleManager.SetParticleControlEnt(
            pfx,
            1,
            this.parent,
            ParticleAttachment.ABSORIGIN_FOLLOW,
            ParticleAttachmentLocation.HITLOC,
            Vector(0, 0, 0),
            true
        );
        ParticleManager.SetParticleControl(pfx, 3, Vector(50, 0, 0));

        this.AddParticle(pfx, false, false, -1, false, false);
    }

    override OnRefresh(): void {
        this.damageReduction = this.ability.GetSpecialValueFor("damage_reduction") * -1;
    }
}
