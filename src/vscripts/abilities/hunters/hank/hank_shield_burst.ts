import { BaseAbility, registerAbility } from "../../../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../../../libraries/dota_ts_adapter";

@registerAbility()
export class hank_shield_burst extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();

    Spawn(): void {
        if (!IsServer()) {
            return;
        }
        this.SetLevel(1);
    }

    Precache(context: CScriptPrecacheContext): void {
        PrecacheResource(PrecacheType.PARTICLE, "particles/custom/units/heroes/hank/hank_shield_burst_bubble.vpcf", context);
    }

    override OnSpellStart(): void {
        const enemies = FindUnitsInRadius(
            this.caster.GetTeamNumber(),
            Vector(0, 0, 0),
            undefined,
            FIND_UNITS_EVERYWHERE,
            this.GetAbilityTargetTeam(),
            this.GetAbilityTargetType(),
            this.GetAbilityTargetFlags(),
            FindOrder.ANY,
            false
        );

        enemies.forEach((target) => {
            target.AddNewModifier(this.caster, this, modifier_hank_shield_burst.name, { duration: -1 });
        });
    }
}

@registerModifier()
export class modifier_hank_shield_burst extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    shieldCapacity!: number;
    otherShieldCapacity!: number;
    selfShieldCapacity!: number;
    decayRate!: number;

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
            "particles/custom/units/heroes/hank/hank_shield_burst_bubble.vpcf",
            ParticleAttachment.CUSTOMORIGIN_FOLLOW,
            this.parent
        );
        ParticleManager.SetParticleControl(pfx, 0, this.parent.GetAbsOrigin());

        this.AddParticle(pfx, false, true, 0, true, true);
    }

    override OnRefresh(): void {
        this.otherShieldCapacity = this.ability.GetSpecialValueFor("other_shield_capacity");
        this.selfShieldCapacity = this.ability.GetSpecialValueFor("self_shield_capacity");
        this.decayRate = this.ability.GetSpecialValueFor("decay_rate");

        if (this.caster == this.parent) {
            this.shieldCapacity = this.selfShieldCapacity;
        } else {
            this.shieldCapacity = this.otherShieldCapacity;
        }

        if (!IsServer()) {
            return;
        }
        this.SetHasCustomTransmitterData(true);
        this.StartIntervalThink(1);
    }

    OnIntervalThink(): void {
        this.shieldCapacity = math.max(0, this.shieldCapacity - this.decayRate);
        if (this.shieldCapacity == 0) {
            this.Destroy();
        }
        this.SendBuffRefreshToClients();
    }

    AddCustomTransmitterData() {
        return {
            shieldCapacity: this.shieldCapacity,
            decayRate: this.decayRate
        };
    }

    HandleCustomTransmitterData(data: ReturnType<this["AddCustomTransmitterData"]>): void {
        this.shieldCapacity = data.shieldCapacity;
        this.decayRate = data.decayRate;
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
