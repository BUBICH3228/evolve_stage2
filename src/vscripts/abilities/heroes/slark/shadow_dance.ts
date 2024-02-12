import { BaseAbility, registerAbility } from "../../../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../../../libraries/dota_ts_adapter";

@registerAbility()
export class slark_shadow_dance_custom extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();

    GetIntrinsicModifierName(): string {
        return modifier_slark_shadow_dance_passive_regen_custom.name;
    }

    GetAOERadius(): number {
        if (this.caster.HasTalent("talent_slark_shadow_dance_custom_aoe_cast")) {
            return this.GetSpecialValueFor("talent_radius");
        }
        return 0;
    }

    override OnSpellStart(): void {
        if (this.caster.HasTalent("talent_slark_shadow_dance_custom_aoe_cast")) {
            this.caster.AddNewModifier(this.caster, this, talent_modifier_slark_shadow_dance_custom.name, {
                duration: this.GetSpecialValueFor("duration")
            });
        } else {
            this.caster.AddNewModifier(this.caster, this, modifier_slark_shadow_dance_custom.name, {
                duration: this.GetSpecialValueFor("duration")
            });
        }

        EmitSoundOn("Hero_Slark.ShadowDance", this.caster);
    }
}

@registerModifier()
export class talent_modifier_slark_shadow_dance_custom extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
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

    override IsAura(): boolean {
        return true;
    }

    GetAuraSearchFlags(): UnitTargetFlags {
        return UnitTargetFlags.NONE;
    }

    GetAuraSearchTeam(): UnitTargetTeam {
        return UnitTargetTeam.BOTH;
    }

    GetAuraSearchType(): UnitTargetType {
        return UnitTargetType.BASIC + UnitTargetType.HERO;
    }

    GetAuraRadius(): number {
        return this.radius;
    }

    GetModifierAura(): string {
        return modifier_slark_shadow_dance_custom.name;
    }

    override OnCreated(): void {
        this.OnRefresh();
    }

    override OnRefresh(): void {
        this.radius = this.ability.GetSpecialValueFor("talent_radius");
    }
}

@registerModifier()
export class modifier_slark_shadow_dance_custom extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    pfx!: ParticleID;
    debufArmorPct!: number;

    // Modifier specials

    override IsHidden() {
        return this.parent.GetTeamNumber() != this.caster.GetTeamNumber();
    }
    override IsDebuff() {
        return this.parent.GetTeamNumber() != this.caster.GetTeamNumber();
    }
    override IsPurgable() {
        return false;
    }
    override IsPurgeException() {
        return false;
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.MOUNTAIN_PHYSICAL_ARMOR_TOTAL_PERCENTAGE];
    }

    GetModifierPhysicalArmorTotal_Percentage(): number {
        if (this.parent.GetTeamNumber() == this.caster.GetTeamNumber()) {
            return 0;
        }
        return this.debufArmorPct;
    }

    GetStatusEffectName(): string {
        return "particles/status_fx/status_effect_slark_shadow_dance.vpcf";
    }

    StatusEffectPriority(): ModifierPriority {
        return ModifierPriority.NORMAL;
    }

    CheckState(): Partial<Record<ModifierState, boolean>> {
        return {
            [ModifierState.INVISIBLE]: this.parent.GetTeamNumber() == this.caster.GetTeamNumber(),
            [ModifierState.TRUESIGHT_IMMUNE]: this.parent.GetTeamNumber() == this.caster.GetTeamNumber()
        };
    }

    OnCreated(): void {
        this.OnRefresh();

        if (!IsServer()) {
            return;
        }

        if (this.parent != this.caster && this.parent.GetTeamNumber() == this.caster.GetTeamNumber()) {
            this.parent.AddNewModifier(this.caster, this.ability, modifier_slark_shadow_dance_passive_regen_custom.name, {
                duration: -1
            });
        }

        this.pfx = ParticleManager.CreateParticle(
            "particles/units/heroes/hero_slark/slark_shadow_dance_dummy.vpcf",
            ParticleAttachment.WORLDORIGIN,
            this.parent
        );
        ParticleManager.SetParticleControl(this.pfx, 0, this.parent.GetAbsOrigin());
        ParticleManager.SetParticleControl(this.pfx, 1, this.parent.GetAbsOrigin());
        this.AddParticle(this.pfx, false, false, -1, false, false);

        const pfx = ParticleManager.CreateParticleForTeam(
            "particles/status_fx/status_effect_slark_shadow_dance.vpcf",
            ParticleAttachment.ABSORIGIN_FOLLOW,
            this.parent,
            this.parent.GetTeamNumber()
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
        ParticleManager.SetParticleControlEnt(
            pfx,
            3,
            this.parent,
            ParticleAttachment.POINT_FOLLOW,
            ParticleAttachmentLocation.EYER,
            Vector(0, 0, 0),
            true
        );
        ParticleManager.SetParticleControlEnt(
            pfx,
            4,
            this.parent,
            ParticleAttachment.POINT_FOLLOW,
            ParticleAttachmentLocation.EYEL,
            Vector(0, 0, 0),
            true
        );
        this.AddParticle(pfx, false, false, -1, false, false);

        this.StartIntervalThink(0.001);
    }

    OnRefresh(): void {
        this.debufArmorPct = -1 * this.ability.GetSpecialValueFor("talent_debuff_armor_pct");
    }

    OnIntervalThink(): void {
        if (this.pfx != undefined) {
            ParticleManager.SetParticleControl(this.pfx, 1, this.parent.GetAbsOrigin());
        }
    }

    OnDestroy(): void {
        if (!IsServer()) {
            return;
        }
        if (this.caster != this.parent) {
            const modifier = this.parent.FindModifierByName(modifier_slark_shadow_dance_passive_regen_custom.name);
            if (modifier != undefined) {
                modifier.Destroy();
            }
        }
    }
}

@registerModifier()
export class modifier_slark_shadow_dance_passive_regen_custom extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    bonusRegen!: number;
    bonusMovementSpeed!: number;
    activationDelay!: number;
    neutralDisable!: number;
    targetTeam!: UnitTargetTeam;
    targetType!: UnitTargetType;
    targetFlags!: UnitTargetFlags;
    bonusAttackSpeedPct!: number;
    healthRegenPct!: number;

    // Modifier specials

    override IsHidden() {
        return this.GetStackCount() == 1;
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
        return [
            ModifierFunction.HEALTH_REGEN_CONSTANT,
            ModifierFunction.MOVESPEED_BONUS_PERCENTAGE,
            ModifierFunction.ON_TAKEDAMAGE,
            ModifierFunction.HEALTH_REGEN_PERCENTAGE,
            ModifierFunction.ATTACKSPEED_PERCENTAGE
        ];
    }

    GetModifierConstantHealthRegen(): number {
        if (this.GetStackCount() == 1) {
            return 0;
        } else {
            return this.bonusRegen;
        }
    }

    GetModifierMoveSpeedBonus_Percentage(): number {
        if (this.GetStackCount() == 1) {
            return 0;
        } else {
            return this.bonusMovementSpeed;
        }
    }

    GetModifierAttackSpeedPercentage(): number {
        if (this.parent.HasModifier(modifier_slark_shadow_dance_custom.name)) {
            return this.bonusAttackSpeedPct;
        }
        return 0;
    }

    GetModifierHealthRegenPercentage(): number {
        if (this.parent.HasModifier(modifier_slark_shadow_dance_custom.name)) {
            return this.healthRegenPct;
        }
        return 0;
    }

    GetEffectName(): string {
        return "particles/units/heroes/hero_slark/slark_regen.vpcf";
    }

    override OnCreated(): void {
        this.OnRefresh();

        if (!IsServer()) {
            return;
        }

        this.targetTeam = this.ability.GetAbilityTargetTeam(1);
        this.targetType = this.ability.GetAbilityTargetType(1);
        this.targetFlags = this.ability.GetAbilityTargetFlags(1);
    }

    override OnRefresh(): void {
        this.bonusRegen = this.ability.GetSpecialValueFor("bonus_regen");
        this.bonusMovementSpeed = this.ability.GetSpecialValueFor("bonus_movement_speed");
        this.activationDelay = this.ability.GetSpecialValueFor("activation_delay");

        this.bonusAttackSpeedPct = this.ability.GetSpecialValueFor("talent_bonus_attack_speed_pct");
        this.healthRegenPct = this.ability.GetSpecialValueFor("talent_health_regen_pct");

        if (!IsServer()) {
            return;
        }

        this.StartIntervalThink(this.activationDelay);
    }

    OnIntervalThink(): void {
        const enemies = FindUnitsInRadius(
            this.caster.GetTeamNumber(),
            this.parent.GetAbsOrigin(),
            undefined,
            800,
            this.targetTeam,
            this.targetType,
            this.targetFlags,
            FindOrder.CLOSEST,
            false
        );

        if (enemies.length == 0) {
            this.SetStackCount(0);
            return;
        }

        if (enemies[0].CanEntityBeSeenByMyTeam(this.parent)) {
            this.SetStackCount(1);
        } else {
            this.SetStackCount(0);
        }
    }
}
