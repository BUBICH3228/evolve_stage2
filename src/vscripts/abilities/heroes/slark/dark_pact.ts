import { BaseAbility, registerAbility } from "../../../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../../../libraries/dota_ts_adapter";
import { modifier_shild_custom } from "../../../modifiers/modifier_shild_custom";

@registerAbility()
export class slark_dark_pact_custom extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();

    GetAOERadius(): number {
        return this.GetSpecialValueFor("radius");
    }

    GetIntrinsicModifierName(): string {
        if (!this.caster.HasTalent("talent_slark_dark_pact_custom_random_triggering")) {
            return "";
        }
        return talent_modifier_slark_dark_pact_custom.name;
    }

    override OnSpellStart(point?: Vector): void {
        if (point != undefined) {
            CreateModifierThinker(
                this.caster,
                this,
                modifier_slark_dark_pact_custom.name,
                { duration: -1 },
                point,
                this.caster.GetTeamNumber(),
                false
            );
        } else {
            this.caster.AddNewModifier(this.caster, this, modifier_slark_dark_pact_custom.name, { duration: -1 });
        }
    }
}

@registerModifier()
export class modifier_slark_dark_pact_custom extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    delay!: number;
    totalDamage!: number;
    totalPulses!: number;
    pulseInterval!: number;
    selfDamagePct!: number;
    IsDelay = true;
    count = 0;
    damgeTable!: {
        victim: CDOTA_BaseNPC;
        attacker: CDOTA_BaseNPC;
        damage: number;
        ability: CDOTABaseAbility;
        damage_type: DamageTypes;
        damage_flags: DamageFlag;
    };
    targetTeam!: UnitTargetTeam;
    targetType!: UnitTargetType;
    targetFlags!: UnitTargetFlags;
    healthShildPerDamage!: number;
    septerDecreaseColdown!: number;

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

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.ON_TAKEDAMAGE];
    }

    GetAttributes(): ModifierAttribute {
        return ModifierAttribute.MULTIPLE;
    }

    override OnCreated(): void {
        this.OnRefresh();

        if (!IsServer()) {
            return;
        }

        this.targetTeam = this.ability.GetAbilityTargetTeam();
        this.targetType = this.ability.GetAbilityTargetType();
        this.targetFlags = this.ability.GetAbilityTargetFlags();
    }

    override OnRefresh(): void {
        this.delay = this.ability.GetSpecialValueFor("delay");
        this.totalDamage = this.ability.GetSpecialValueFor("total_damage");
        this.totalPulses = this.ability.GetSpecialValueFor("total_pulses");
        this.pulseInterval = this.ability.GetSpecialValueFor("pulse_interval");
        this.selfDamagePct = this.ability.GetSpecialValueFor("self_damage_pct") / 100;
        this.septerDecreaseColdown = this.ability.GetSpecialValueFor("septer_decrease_cooldown");

        this.healthShildPerDamage = this.ability.GetSpecialValueFor("talent_health_shild_per_damage") / 100;

        if (!IsServer()) {
            return;
        }

        this.damgeTable = {
            victim: this.parent,
            attacker: this.caster,
            damage: 0,
            ability: this.ability,
            damage_type: this.ability.GetAbilityDamageType(),
            damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION
        };

        this.StartIntervalThink(this.delay);

        const pfx = ParticleManager.CreateParticle(
            "particles/units/heroes/hero_slark/slark_dark_pact_start.vpcf",
            ParticleAttachment.ABSORIGIN_FOLLOW,
            this.parent
        );
        ParticleManager.SetParticleControlEnt(
            pfx,
            1,
            this.parent,
            ParticleAttachment.ABSORIGIN_FOLLOW,
            ParticleAttachmentLocation.HITLOC,
            this.caster.GetAbsOrigin(),
            true
        );
        ParticleManager.DestroyAndReleaseParticle(pfx);
        if (this.parent == this.caster) {
            EmitSoundOn("Hero_Slark.DarkPact.PreCast", this.parent);
        }
    }

    OnIntervalThink(): void {
        if (this.IsDelay) {
            this.IsDelay = false;

            this.StartIntervalThink(this.pulseInterval);
            const pfx = ParticleManager.CreateParticle(
                "particles/units/heroes/hero_slark/slark_dark_pact_pulses.vpcf",
                ParticleAttachment.ABSORIGIN_FOLLOW,
                this.parent
            );
            this.parent.StartGesture(GameActivity.DOTA_CAST_ABILITY_1);
            ParticleManager.SetParticleControlEnt(
                pfx,
                1,
                this.parent,
                ParticleAttachment.ABSORIGIN_FOLLOW,
                ParticleAttachmentLocation.HITLOC,
                this.parent.GetAbsOrigin(),
                true
            );

            if (this.caster == this.parent) {
                EmitSoundOn("Hero_Slark.DarkPact.Cast", this.parent);
            }

            ParticleManager.DestroyAndReleaseParticle(pfx);
        } else {
            const enemies = FindUnitsInRadius(
                this.caster.GetTeamNumber(),
                this.parent.GetAbsOrigin(),
                undefined,
                this.ability.GetAOERadius(),
                this.targetTeam,
                this.targetType,
                this.targetFlags,
                FindOrder.ANY,
                false
            );

            enemies.forEach((target) => {
                this.damgeTable.victim = target;
                this.damgeTable.damage = (this.totalDamage / this.totalPulses) * (this.caster.GetSpellAmplification(false) + 1);
                this.damgeTable.damage_flags = DamageFlag.NO_SPELL_AMPLIFICATION;
                ApplyDamage(this.damgeTable);
                if (this.parent.HasScepter()) {
                    const cd = this.ability.GetCooldownTimeRemaining() - this.septerDecreaseColdown;
                    this.ability.EndCooldown();
                    this.ability.StartCooldown(cd);
                }
            });

            if (!this.parent.HasTalent("talent_slark_dark_pact_custom_shild") && this.parent == this.caster) {
                this.damgeTable.victim = this.parent;
                this.damgeTable.damage =
                    (this.totalDamage / this.totalPulses) * (this.caster.GetSpellAmplification(false) + 1) * this.selfDamagePct;
                this.damgeTable.damage_flags = DamageFlag.NO_SPELL_AMPLIFICATION + DamageFlag.NON_LETHAL;

                ApplyDamage(this.damgeTable);
            }

            this.parent.Purge(false, true, false, true, true);

            this.count++;
            if (this.count >= this.totalPulses) {
                this.Destroy();
            }
        }
    }

    OnTakeDamage(kv: ModifierInstanceEvent): void {
        if (!this.caster.HasTalent("talent_slark_dark_pact_custom_shild")) {
            return;
        }

        if (kv.unit == this.caster) {
            return;
        }

        if (kv.inflictor != this.ability) {
            return;
        }

        this.caster.AddNewModifier(this.caster, this.ability, modifier_shild_custom.name, {
            duaration: -1,
            PhysicalDamageBlock: kv.damage * this.healthShildPerDamage * 0.9,
            MagicalDamageBlock: kv.damage * this.healthShildPerDamage * 0.1
        });
    }
}

@registerModifier()
export class talent_modifier_slark_dark_pact_custom extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: slark_dark_pact_custom = this.GetAbility()! as slark_dark_pact_custom;
    private parent: CDOTA_BaseNPC = this.GetParent();
    radius!: number;
    rate!: number;

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
    }

    override OnRefresh(): void {
        this.radius = this.ability.GetSpecialValueFor("talent_radius_triggering");
        this.rate = this.ability.GetSpecialValueFor("talent_rate");

        if (!IsServer()) {
            return;
        }

        this.StartIntervalThink(this.rate);
    }

    OnIntervalThink(): void {
        const point = Vector(RandomInt(-this.radius, this.radius), RandomInt(-this.radius, this.radius), 0);
        this.ability.OnSpellStart((this.caster.GetAbsOrigin() + point) as Vector);
    }
}
