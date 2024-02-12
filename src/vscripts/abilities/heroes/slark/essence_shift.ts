import { BaseAbility, BaseModifier, registerAbility, registerModifier } from "../../../libraries/dota_ts_adapter";

@registerAbility()
export class slark_essence_shift_custom extends BaseAbility {
    public pathToOnDeathParticle = "particles/units/heroes/hero_slark/slark_essence_shift.vpcf";
    private caster = this.GetCaster() as CDOTA_BaseNPC_Hero;
    override Precache(context: CScriptPrecacheContext): void {
        PrecacheResource(PrecacheType.PARTICLE, ParticleManager.GetParticleReplacement(this.pathToOnDeathParticle, this.caster), context);
    }

    GetAOERadius(): number {
        return this.GetSpecialValueFor("talent_additional_attack_radius");
    }

    GetBehavior(): AbilityBehavior | Uint64 {
        if (this.caster.HasTalent("talent_slark_essence_shift_custom_activated")) {
            return AbilityBehavior.NO_TARGET + AbilityBehavior.IGNORE_BACKSWING;
        }
        return super.GetBehavior();
    }

    override GetIntrinsicModifierName() {
        return modifier_permament_slark_essence_shift_custom.name;
    }

    OnSpellStart(): void {
        this.caster.AddNewModifier(this.caster, this, talent_modifier_slark_essence_shift_custom.name, {
            duration: this.GetSpecialValueFor("duration")
        });
    }
}

@registerModifier()
export class modifier_permament_slark_essence_shift_custom extends BaseModifier {
    // Modifier properties
    private ability: slark_essence_shift_custom = this.GetAbility() as slark_essence_shift_custom;
    private parent: CDOTA_BaseNPC_Hero = this.GetParent() as CDOTA_BaseNPC_Hero;
    targetTeam!: UnitTargetTeam;
    targetType!: UnitTargetType;
    targetFlags!: UnitTargetFlags;
    bonusAgi = 0;
    permanenAtagiStealAmount!: number;
    cahnceSteal!: number;
    cahnceStealPerKill!: number;
    durationStack!: number;
    additionalAttackChance!: number;
    additionalAttackCount!: number;
    buff = 1;

    override IsHidden() {
        return this.GetStackCount() == 0;
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

    override DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.ON_DEATH, ModifierFunction.STATS_AGILITY_BONUS, ModifierFunction.ON_ATTACK_LANDED];
    }

    override GetModifierBonusStats_Agility(): number {
        return this.GetBonusAgility();
    }

    override OnCreated(): void {
        this.OnRefresh();
        if (!IsServer()) {
            return;
        }
        this.targetTeam = this.ability.GetAbilityTargetTeam();
        this.targetType = this.ability.GetAbilityTargetType();
        this.targetFlags = this.ability.GetAbilityTargetFlags();

        this.SetHasCustomTransmitterData(true);
    }

    OnRefresh(): void {
        this.permanenAtagiStealAmount = this.ability.GetSpecialValueFor("permanent_agi_steal_amount") * this.buff;
        this.cahnceSteal = this.ability.GetSpecialValueFor("cahnce_steal") * this.buff;
        this.cahnceStealPerKill = this.ability.GetSpecialValueFor("cahnce_steal_per_kill") * this.buff;
        this.durationStack = this.ability.GetSpecialValueFor("duration_stack") * this.buff;

        this.additionalAttackChance = this.ability.GetSpecialValueFor("talent_additional_attack_chance") * this.buff;
        this.additionalAttackCount = this.ability.GetSpecialValueFor("talent_additional_attack_count") * this.buff;

        if (!IsServer()) {
            return;
        }

        this.StartIntervalThink(0.1);
    }

    OnIntervalThink(): void {
        if (this.parent.HasModifier(talent_modifier_slark_essence_shift_custom.name)) {
            this.buff = 1 + this.ability.GetSpecialValueFor("talent_buff") / 100;

            this.OnRefresh();
        } else {
            this.buff = 1;
            this.OnRefresh();
        }
    }

    override OnAttackLanded(kv: ModifierAttackEvent): void {
        if (this.parent != kv.attacker) {
            return;
        }

        if (this.parent.PassivesDisabled()) {
            return;
        }

        if (
            UnitFilter(kv.target, this.targetTeam, this.targetType, this.targetFlags, this.parent.GetTeamNumber()) !=
            UnitFilterResult.SUCCESS
        ) {
            return;
        }

        if (
            this.parent.HasTalent("talent_slark_essence_shift_custom_additional_attack") &&
            kv.no_attack_cooldown == false &&
            RollPseudoRandomPercentage(this.additionalAttackChance, this.ability) == true
        ) {
            const enemies = FindUnitsInRadius(
                this.parent.GetTeamNumber(),
                kv.target.GetAbsOrigin(),
                undefined,
                this.ability.GetAOERadius(),
                this.targetTeam,
                this.targetType,
                this.targetFlags,
                FindOrder.ANY,
                false
            );

            for (let index = 0; index < this.additionalAttackCount; index++) {
                this.parent.PerformAttack(enemies[RandomInt(0, enemies.length - 1)], true, true, true, false, false, false, false);
            }
        }

        const particle = ParticleManager.CreateParticle(
            ParticleManager.GetParticleReplacement(this.ability.pathToOnDeathParticle, this.parent),
            ParticleAttachment.POINT_FOLLOW,
            kv.target
        );
        ParticleManager.SetParticleControlEnt(
            particle,
            1,
            this.parent,
            ParticleAttachment.POINT_FOLLOW,
            ParticleAttachmentLocation.HITLOC,
            Vector(0, 0, 0),
            true
        );
        ParticleManager.DestroyAndReleaseParticle(particle);

        const modifier = this.parent.AddNewModifier(this.parent, this.ability, modifier_slark_essence_shift_custom.name, {
            duration: this.durationStack
        });

        if (modifier != undefined) {
            modifier.IncrementIndependentStackCount();
        }

        if (RollPseudoRandomPercentage(this.cahnceSteal, this.ability) == false) {
            return;
        }

        this.IncrementBonusAgility(this.permanenAtagiStealAmount);
    }

    override OnDeath(event: ModifierInstanceEvent): void {
        if (event.attacker != this.parent) {
            return;
        }

        if (RollPseudoRandomPercentage(this.cahnceStealPerKill, this.ability) == false) {
            return;
        }

        this.IncrementBonusAgility(this.permanenAtagiStealAmount);
    }

    IncrementBonusAgility(value: number): void {
        if (this.parent.HasModifier(talent_modifier_slark_essence_shift_custom.name)) {
            this.bonusAgi += value * this.buff;
        } else {
            this.bonusAgi += value;
        }

        this.SendBuffRefreshToClients();
        this.SetStackCount(this.bonusAgi);
    }

    GetBonusAgility(): number {
        return this.bonusAgi;
    }

    AddCustomTransmitterData() {
        return {
            bonusAgi: this.bonusAgi
        };
    }

    HandleCustomTransmitterData(data: ReturnType<this["AddCustomTransmitterData"]>): void {
        this.bonusAgi = data.bonusAgi;
    }
}

@registerModifier()
export class modifier_slark_essence_shift_custom extends BaseModifier {
    // Modifier properties
    private ability: slark_essence_shift_custom = this.GetAbility() as slark_essence_shift_custom;
    private parent = this.GetParent() as CDOTA_BaseNPC;
    agiSteal!: number;
    buff!: number;

    override IsHidden() {
        return this.GetStackCount() == 0;
    }

    override IsDebuff() {
        return false;
    }

    override IsPurgable() {
        return false;
    }

    override IsPurgeException() {
        return true;
    }

    override DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.STATS_AGILITY_BONUS];
    }

    override GetModifierBonusStats_Agility(): number {
        if (this.parent.HasModifier(talent_modifier_slark_essence_shift_custom.name)) {
            return this.GetStackCount() * this.agiSteal * this.buff;
        }
        return this.GetStackCount() * this.agiSteal;
    }

    override OnCreated(): void {
        this.OnRefresh();
    }

    override OnRefresh(): void {
        this.agiSteal = this.ability.GetSpecialValueFor("agi_steal");
        this.buff = 1 + this.ability.GetSpecialValueFor("talent_buff") / 100;
    }
}

@registerModifier()
export class talent_modifier_slark_essence_shift_custom extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    buff!: number;

    // Modifier specials

    override IsHidden() {
        return false;
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
        return [ModifierFunction.TOOLTIP];
    }

    OnTooltip(): number {
        return this.buff;
    }

    override OnCreated(): void {
        this.OnRefresh();
    }

    override OnRefresh(): void {
        this.buff = this.ability.GetSpecialValueFor("talent_buff");
    }
}
