import { BaseAbility, registerAbility } from "../../../../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../../../../libraries/dota_ts_adapter";

@registerAbility()
export class burrow_debuff extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();

    GetIntrinsicModifierName(): string {
        return modifier_burrow_debuff_aura.name;
    }

    GetAOERadius(): number {
        return this.GetSpecialValueFor("radius");
    }

    override OnSpellStart(): void {
        const pfx = ParticleManager.CreateParticle(
            "particles/units/heroes/hero_nyx_assassin/nyx_assassin_burrow.vpcf",
            ParticleAttachment.WORLDORIGIN,
            this.caster
        );
        ParticleManager.SetParticleControl(pfx, 0, this.caster.GetAbsOrigin());

        Timers.CreateTimer(1, () => {
            ParticleManager.DestroyAndReleaseParticle(pfx);
            const casterPosition = this.caster.GetAbsOrigin();
            casterPosition.z = casterPosition.z - 64;
            this.caster.SetAbsOrigin(casterPosition);
        });
    }

    OnChannelFinish(): void {
        const casterPosition = this.caster.GetAbsOrigin();
        casterPosition.z = casterPosition.z + 64;
        this.caster.SetAbsOrigin(casterPosition);
    }
}

@registerModifier()
export class modifier_burrow_debuff_aura extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    radius!: number;
    targetFlags1!: UnitTargetFlags;
    targetType1!: UnitTargetType;
    targetTeam1!: UnitTargetTeam;
    targetFlags2!: UnitTargetFlags;
    targetType2!: UnitTargetType;
    targetTeam2!: UnitTargetTeam;
    reduceArmorPerUnit!: number;

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

    override IsAura(): boolean {
        return true;
    }

    GetAuraSearchFlags(): UnitTargetFlags {
        return this.targetFlags1;
    }

    GetAuraSearchTeam(): UnitTargetTeam {
        return this.targetTeam1;
    }

    GetAuraSearchType(): UnitTargetType {
        return this.targetType1;
    }

    GetAuraRadius(): number {
        return this.radius;
    }

    GetModifierAura(): string {
        return modifier_burrow_debuff.name;
    }

    GetAuraEntityReject(): boolean {
        return !this.ability.IsChanneling();
    }

    override OnCreated(): void {
        this.OnRefresh();
        if (!IsServer()) {
            return;
        }
        this.targetTeam1 = this.ability.GetAbilityTargetTeam(1);
        this.targetType1 = this.ability.GetAbilityTargetType(1);
        this.targetFlags1 = this.ability.GetAbilityTargetFlags(1);
        this.targetTeam2 = this.ability.GetAbilityTargetTeam(2);
        this.targetType2 = this.ability.GetAbilityTargetType(2);
        this.targetFlags2 = this.ability.GetAbilityTargetFlags(2);
    }

    OnRefresh(): void {
        if (this.ability != undefined) {
            this.radius = this.ability.GetAOERadius();
        }
        if (!IsServer()) {
            return;
        }
        this.StartIntervalThink(0.25);
    }

    OnIntervalThink(): void {
        const enemies = FindUnitsInRadius(
            this.parent.GetTeamNumber(),
            this.parent.GetAbsOrigin(),
            undefined,
            this.radius,
            this.targetTeam2,
            this.targetType2,
            this.targetFlags2,
            FindOrder.ANY,
            false
        );
        this.SetStackCount(enemies.length);
    }
}

@registerModifier()
export class modifier_burrow_debuff extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    reduceArmorPerUnit!: number;
    // Modifier specials

    override IsHidden() {
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

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.PHYSICAL_ARMOR_BONUS];
    }

    GetModifierPhysicalArmorBonus(): number {
        return -(this.reduceArmorPerUnit * this.GetStackCount());
    }

    override OnCreated(): void {
        this.OnRefresh();
    }

    OnRefresh(): void {
        this.reduceArmorPerUnit = this.ability.GetSpecialValueFor("reduce_armor_per_unit");
        if (!IsServer()) {
            return;
        }
        this.StartIntervalThink(0.25);
    }

    OnIntervalThink(): void {
        const modifier = this.caster.FindModifierByName(modifier_burrow_debuff_aura.name);
        if (modifier != undefined) {
            this.SetStackCount(modifier.GetStackCount());
        }
    }
}
