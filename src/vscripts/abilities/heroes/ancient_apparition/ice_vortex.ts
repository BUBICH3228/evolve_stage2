import { BaseAbility, registerAbility } from "../../../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../../../libraries/dota_ts_adapter";

@registerAbility()
export class ancient_apparition_ice_vortex_custom extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();

    GetIntrinsicModifierName(): string {
        return talent_modifier_ancient_apparition_ice_vortex_custom.name;
    }

    Precache(context: CScriptPrecacheContext): void {
        PrecacheResource(PrecacheType.PARTICLE, "particles/units/heroes/hero_ancient_apparition/ancient_ice_vortex.vpcf", context);
        PrecacheResource(PrecacheType.PARTICLE, "particles/status_fx/status_effect_frost.vpcf", context);
    }

    GetAOERadius(): number {
        return this.GetSpecialValueFor("radius");
    }

    GetAbilityDamageType(): DamageTypes {
        if (this.caster.HasShard()) {
            return DamageTypes.MAGICAL;
        }
        return super.GetAbilityDamageType();
    }

    override OnSpellStart(location?: Vector): void {
        EmitSoundOn("Hero_Ancient_Apparition.IceVortexCast", this.caster);
        let point = this.GetCursorPosition();
        if (location) {
            point = location;
        }
        CreateModifierThinker(
            this.caster,
            this,
            modifierThinker_ancient_apparition_ice_vortex_custom.name,
            { duration: this.GetSpecialValueFor("vortex_duration") },
            point,
            this.caster.GetTeamNumber(),
            false
        );
    }
}

@registerModifier()
export class talent_modifier_ancient_apparition_ice_vortex_custom extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    targetFlags!: UnitTargetFlags;
    targetTeam!: UnitTargetTeam;
    targetType!: UnitTargetType;
    radius!: number;
    duration!: number;
    cooldown!: number;

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

    override OnCreated(): void {
        this.OnRefresh();
        if (!IsServer()) {
            return;
        }
        this.targetTeam = this.ability.GetAbilityTargetTeam();
        this.targetType = this.ability.GetAbilityTargetType();
        this.targetFlags = this.ability.GetAbilityTargetFlags();
    }

    OnRefresh(): void {
        this.radius = this.ability.GetSpecialValueFor("talent_radius");
        this.duration = this.ability.GetSpecialValueFor("talent_duration");
        this.cooldown = this.ability.GetSpecialValueFor("talent_cooldown");
        if (!IsServer()) {
            return;
        }
        if (this.caster.HasTalent("talent_ancient_apparition_ice_vortex_applied_to_enemies_around_the_hero")) {
            this.StartIntervalThink(this.cooldown);
        }
    }

    OnIntervalThink(): void {
        const enemies = FindUnitsInRadius(
            this.caster.GetTeamNumber(),
            this.caster.GetAbsOrigin(),
            undefined,
            this.radius,
            this.targetTeam,
            this.targetType,
            this.targetFlags,
            FindOrder.ANY,
            false
        );

        enemies.forEach((target) => {
            target.AddNewModifier(this.caster, this.ability, modifier_ancient_apparition_ice_vortex_custom.name, {
                duration: this.duration
            });
        });
    }
}

@registerModifier()
export class modifierThinker_ancient_apparition_ice_vortex_custom extends BaseModifier {
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
        return modifier_ancient_apparition_ice_vortex_custom.name;
    }

    override OnCreated(): void {
        this.OnRefresh();
        if (!IsServer()) {
            return;
        }
        this.targetTeam = this.ability.GetAbilityTargetTeam();
        this.targetType = this.ability.GetAbilityTargetType();
        this.targetFlags = this.ability.GetAbilityTargetFlags();

        EmitSoundOn("Hero_Ancient_Apparition.IceVortex", this.parent);
        EmitSoundOn("Hero_Ancient_Apparition.IceVortex.lp", this.parent);

        const pfx = ParticleManager.CreateParticle(
            "particles/units/heroes/hero_ancient_apparition/ancient_ice_vortex.vpcf",
            ParticleAttachment.WORLDORIGIN,
            this.parent
        );
        ParticleManager.SetParticleControl(pfx, 0, (this.parent.GetAbsOrigin() + Vector(0, 0, 128)) as Vector);
        ParticleManager.SetParticleControl(pfx, 5, Vector(this.radius, 0, 0));
        this.AddParticle(pfx, false, false, -1, false, false);

        AddFOWViewer(this.caster.GetTeamNumber(), this.parent.GetAbsOrigin(), this.visionAoe, this.vortexDuration, false);
    }

    OnRefresh(): void {
        this.radius = this.ability.GetSpecialValueFor("radius");
        this.visionAoe = this.ability.GetSpecialValueFor("vision_aoe");
        this.vortexDuration = this.ability.GetSpecialValueFor("vortex_duration");
    }

    OnDestroy(): void {
        if (!IsServer()) {
            return;
        }

        StopSoundOn("Hero_Ancient_Apparition.IceVortex.lp", this.parent);
        this.parent.RemoveSelf;
    }
}

@registerModifier()
export class modifier_ancient_apparition_ice_vortex_custom extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    spellRresistPct!: number;
    movementSpeedPct!: number;
    interval!: number;
    damage!: number;
    damageTable!: ApplyDamageOptions;
    maxEffectThrough!: number;
    maxIncreasesPct!: number;

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

    override GetEffectName(): string {
        return "particles/status_fx/status_effect_frost.vpcf";
    }

    GetAttributes(): ModifierAttribute {
        return ModifierAttribute.MULTIPLE;
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.MOVESPEED_BONUS_PERCENTAGE, ModifierFunction.MAGICAL_RESISTANCE_BONUS];
    }

    GetModifierMoveSpeedBonus_Percentage(): number {
        if (this.caster.HasTalent("talent_ancient_apparition_ice_vortex_increases_strength")) {
            if (this.GetElapsedTime() < this.maxEffectThrough) {
                return (
                    this.movementSpeedPct + this.movementSpeedPct * this.maxIncreasesPct * (this.GetElapsedTime() / this.maxEffectThrough)
                );
            }
            return this.movementSpeedPct + this.movementSpeedPct * this.maxIncreasesPct;
        }
        return this.movementSpeedPct;
    }

    GetModifierMagicalResistanceBonus(): number {
        if (this.caster.HasTalent("talent_ancient_apparition_ice_vortex_increases_strength")) {
            if (this.GetElapsedTime() < this.maxEffectThrough) {
                return this.spellRresistPct + this.spellRresistPct * this.maxIncreasesPct * (this.GetElapsedTime() / this.maxEffectThrough);
            }
            return this.spellRresistPct + this.spellRresistPct * this.maxIncreasesPct;
        }
        return this.spellRresistPct;
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

    OnRefresh(): void {
        this.movementSpeedPct = -1 * this.ability.GetSpecialValueFor("movement_speed_pct");
        this.spellRresistPct = -1 * this.ability.GetSpecialValueFor("spell_resist_pct");
        this.maxEffectThrough = this.ability.GetSpecialValueFor("talent_max_effect_through");
        this.maxIncreasesPct = this.ability.GetSpecialValueFor("talent_max_increases_pct") / 100;
        this.damage = this.ability.GetSpecialValueFor("damage");
        this.interval = this.ability.GetSpecialValueFor("interval");
        if (this.caster.HasShard() && IsServer()) {
            this.StartIntervalThink(this.interval);
        }
    }

    OnIntervalThink(): void {
        const damage = this.damage * (this.caster.GetSpellAmplification(false) + 1) * this.interval;
        this.damageTable.damage = damage;
        ApplyDamage(this.damageTable);
        SendOverheadEventMessage(undefined, OverheadAlert.BONUS_SPELL_DAMAGE, this.parent, damage, undefined);
    }
}
