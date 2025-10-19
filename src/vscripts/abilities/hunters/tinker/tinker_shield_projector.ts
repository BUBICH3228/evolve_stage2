import { BaseAbility, registerAbility } from "../../../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../../../libraries/dota_ts_adapter";

@registerAbility()
export class tinker_shield_projector extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();
    target: CDOTA_BaseNPC | undefined;
    shieldAccumulator = 0;

    Spawn(): void {
        if (!IsServer()) {
            return;
        }
        this.SetLevel(1);
    }

    Precache(context: CScriptPrecacheContext): void {
        PrecacheResource(
            PrecacheType.PARTICLE,
            "particles/custom/units/heroes/hunters/tinker/tinker_shield_projector_bubble.vpcf",
            context
        );
    }

    CastFilterResultTarget(target: CDOTA_BaseNPC): UnitFilterResult {
        if (target == this.caster) {
            return UnitFilterResult.FAIL_CUSTOM;
        }

        if (target.GetTeamNumber() != this.caster.GetTeamNumber()) {
            return UnitFilterResult.FAIL_ENEMY;
        }
        return UnitFilterResult.SUCCESS;
    }

    GetCustomCastErrorTarget(): string {
        return "#dota_hud_error_cant_cast_on_self";
    }

    OnAbilityPhaseStart(): boolean {
        if (IsClient()) {
            return true;
        }

        this.target = this.GetCursorTarget();
        return true;
    }

    OnChannelThink(interval: number): void {
        if (this.target == undefined) {
            return;
        }

        const modifier = this.target.AddNewModifier(this.caster, this, modifier_tinker_shield_projector.name, {
            duration: -1
        });

        if (modifier == undefined) {
            return;
        }

        if (this.shieldAccumulator === undefined) {
            this.shieldAccumulator = 0;
        }

        this.shieldAccumulator += this.GetSpecialValueFor("shild_regen_per_second") * interval;

        const shieldToAdd = Math.floor(this.shieldAccumulator);

        if (shieldToAdd > 0) {
            const newShield = math.min(modifier.GetStackCount() + shieldToAdd, this.GetSpecialValueFor("shield_capacity_max"));

            modifier.SetStackCount(newShield);

            this.shieldAccumulator -= shieldToAdd;
        }

        if (modifier.GetStackCount() >= this.GetSpecialValueFor("shield_capacity_max")) {
            this.caster.Interrupt();
        }
    }
}

@registerModifier()
export class modifier_tinker_shield_projector extends BaseModifier {
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
            "particles/custom/units/heroes/hunters/tinker/tinker_shield_projector_bubble.vpcf",
            ParticleAttachment.CUSTOMORIGIN_FOLLOW,
            this.parent
        );
        ParticleManager.SetParticleControl(pfx, 0, this.parent.GetAbsOrigin());

        this.AddParticle(pfx, false, true, 0, true, true);
    }

    override OnRefresh(): void {
        if (!IsServer()) {
            return;
        }
        this.StartIntervalThink(FrameTime());
    }

    OnIntervalThink(): void {
        this.SendBuffRefreshToClients();
    }

    GetModifierIncomingDamageConstant(kv: ModifierAttackEvent): number {
        if (this.shieldCapacity == 0) {
            return 0;
        }

        if (IsClient()) {
            return this.GetStackCount();
        }

        if (this.parent != kv.target) {
            return 0;
        }

        if (kv.damage > this.GetStackCount()) {
            this.Destroy();
            return -this.GetStackCount();
        } else {
            this.SetStackCount(this.GetStackCount() - kv.damage);
            this.SendBuffRefreshToClients();
            return -kv.damage;
        }
    }
}
