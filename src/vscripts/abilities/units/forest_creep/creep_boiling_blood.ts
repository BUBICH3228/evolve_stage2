import { BaseAbility, registerAbility } from "../../../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../../../libraries/dota_ts_adapter";

@registerAbility()
export class creep_boiling_blood extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();

    GetIntrinsicModifierName(): string {
        return modifier_creep_boiling_blood.name;
    }
}

@registerModifier()
export class modifier_creep_boiling_blood extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    damage!: number;
    targetTeam!: UnitTargetTeam;
    targetType!: UnitTargetType;
    targetFlags!: UnitTargetFlags;
    damageTable!: {
        victim: CDOTA_BaseNPC;
        attacker: CDOTA_BaseNPC;
        damage: number;
        ability: CDOTABaseAbility;
        damage_type: DamageTypes;
        damage_flags: DamageFlag;
    };
    radius!: number;

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

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.ON_DEATH];
    }

    OnDeath(kv: ModifierInstanceEvent): void {
        if (kv.unit != this.parent) {
            return;
        }

        CreateModifierThinker(
            this.caster,
            this.ability,
            modifierThinker_creep_boiling_blood.name,
            { duration: this.ability.GetSpecialValueFor("duration") },
            kv.attacker.GetAbsOrigin(),
            this.caster.GetTeamNumber(),
            false
        );
    }
}

@registerModifier()
export class modifierThinker_creep_boiling_blood extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    radius!: number;
    visionAoe!: number;
    vortexDuration!: number;
    targetFlags!: UnitTargetFlags;
    targetTeam!: UnitTargetTeam;
    targetType!: UnitTargetType;

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
        return this.targetFlags;
    }

    GetAuraSearchTeam(): UnitTargetTeam {
        return this.targetTeam;
    }

    GetAuraSearchType(): UnitTargetType {
        return this.targetType;
    }

    GetAuraRadius(): number {
        return this.radius;
    }

    GetModifierAura(): string {
        return modifier_creep_boiling_blood_debuff.name;
    }

    override OnCreated(): void {
        this.OnRefresh();
        if (!IsServer()) {
            return;
        }
        this.targetTeam = this.ability.GetAbilityTargetTeam();
        this.targetType = this.ability.GetAbilityTargetType();
        this.targetFlags = this.ability.GetAbilityTargetFlags();

        const pfx = ParticleManager.CreateParticle(
            "particles/units/heroes/hero_bloodseeker/bloodseeker_scepter_blood_mist_aoe_pulse.vpcf",
            ParticleAttachment.WORLDORIGIN,
            this.parent
        );
        ParticleManager.SetParticleControl(pfx, 0, this.parent.GetAbsOrigin());
        ParticleManager.SetParticleControl(pfx, 1, Vector(this.radius, 0, 0));
        this.AddParticle(pfx, false, false, -1, false, false);
    }

    OnRefresh(): void {
        if (!IsServer()) {
            return;
        }
        this.radius = this.ability.GetSpecialValueFor("radius");
    }
}

@registerModifier()
export class modifier_creep_boiling_blood_debuff extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    damageTable!: {
        victim: CDOTA_BaseNPC;
        attacker: CDOTA_BaseNPC;
        damage: number;
        ability: CDOTABaseAbility;
        damage_type: DamageTypes;
        damage_flags: DamageFlag;
    };
    interval!: number;
    damage!: number;

    // Modifier specials

    override IsHidden() {
        return true;
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

    override OnCreated(): void {
        this.OnRefresh();

        if (!IsServer()) {
            return;
        }

        this.damageTable = {
            victim: this.parent,
            attacker: this.caster,
            damage: 0,
            ability: this.ability,
            damage_type: this.ability.GetAbilityDamageType(),
            damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION
        };
    }

    override OnRefresh(): void {
        this.ability = this.GetAbility()!;
        if (this.ability == undefined) {
            return;
        }
        this.damage = this.ability.GetSpecialValueFor("damage_pct_per_max_health") / 100;
        this.interval = this.ability.GetSpecialValueFor("interval");

        if (!IsServer()) {
            return;
        }

        this.StartIntervalThink(this.interval);
    }

    OnIntervalThink(): void {
        const damage = this.damage * this.parent.GetMaxHealth() * (this.caster.GetSpellAmplification(false) + 1);
        this.damageTable.damage = damage * this.interval;
        ApplyDamage(this.damageTable);
    }
}
