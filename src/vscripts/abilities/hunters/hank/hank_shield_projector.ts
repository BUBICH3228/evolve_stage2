import { BaseAbility, registerAbility } from "../../../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../../../libraries/dota_ts_adapter";

@registerAbility()
export class hank_shield_projector extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();

    Spawn(): void {
        if (!IsServer()) {
            return;
        }
        this.SetLevel(1);
    }

    Precache(context: CScriptPrecacheContext): void {
        PrecacheResource(PrecacheType.PARTICLE, "particles/custom/units/heroes/hank/hank_shield_projector_bubble.vpcf", context);
    }

    override OnSpellStart(): void {
        const target = this.GetCursorTarget();

        if (target == undefined) {
            return;
        }

        target.AddNewModifier(this.caster, this, modifier_hank_shield_projector.name, { duration: -1 });
    }
}

@registerModifier()
export class modifier_hank_shield_projector extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    shieldCapacity!: number;

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

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.INCOMING_DAMAGE_CONSTANT];
    }

    override OnCreated(): void {
        this.OnRefresh();

        const pfx = ParticleManager.CreateParticle(
            "particles/custom/units/heroes/hank/hank_shield_projector_bubble.vpcf",
            ParticleAttachment.CUSTOMORIGIN_FOLLOW,
            this.parent
        );
        ParticleManager.SetParticleControl(pfx, 0, this.parent.GetAbsOrigin());

        this.AddParticle(pfx, false, true, 0, true, true);
    }

    override OnRefresh(): void {
        this.shieldCapacity = this.ability.GetSpecialValueFor("shield_capacity");

        if (!IsServer()) {
            return;
        }
        this.SetHasCustomTransmitterData(true);
        this.StartIntervalThink(0.1);
    }

    OnIntervalThink(): void {
        this.shieldCapacity += 0.1;
        this.SendBuffRefreshToClients();
        this.shieldCapacity -= 0.1;
    }

    AddCustomTransmitterData() {
        return {
            shieldCapacity: this.shieldCapacity
        };
    }

    HandleCustomTransmitterData(data: ReturnType<this["AddCustomTransmitterData"]>): void {
        this.shieldCapacity = data.shieldCapacity;
    }

    GetModifierIncomingDamageConstant(kv: ModifierAttackEvent): number {
        if (this.shieldCapacity == 0) {
            return 0;
        }

        if (!IsServer()) {
            return this.shieldCapacity;
        }

        if (kv.damage > this.shieldCapacity) {
            this.Destroy();
            return -this.shieldCapacity;
        } else {
            this.shieldCapacity -= kv.damage;
            this.SendBuffRefreshToClients();
            return -kv.damage;
        }
    }
}
