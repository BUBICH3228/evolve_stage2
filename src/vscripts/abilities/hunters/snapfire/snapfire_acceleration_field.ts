/* eslint-disable @typescript-eslint/no-unused-vars */
import { BaseAbility, registerAbility } from "../../../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../../../libraries/dota_ts_adapter";

@registerAbility()
export class snapfire_acceleration_field extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC_Hero = this.GetCaster() as CDOTA_BaseNPC_Hero;
    Spawn(): void {
        if (IsClient()) {
            return;
        }
        this.SetLevel(1);
    }

    Precache(context: CScriptPrecacheContext): void {
        PrecacheResource(PrecacheType.PARTICLE, "particles/custom/units/heroes/hunters/snapfire/snapfire_acceleration_field.vpcf", context);
    }

    override OnSpellStart(): void {
        const point = this.GetCursorPosition();

        this.caster.AddNewModifier(this.caster, this, modifier_snapfire_acceleration_field.name, {
            duration: this.GetSpecialValueFor("duration")
        });
    }
}

@registerModifier()
export class modifier_snapfire_acceleration_field extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    targetTeam!: UnitTargetTeam;
    targetFlags!: UnitTargetFlags;
    targetType!: UnitTargetType;
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
    override RemoveOnDeath() {
        return true;
    }

    IsAura(): boolean {
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
        return modifier_snapfire_acceleration_field_aura_buff.name;
    }

    GetAuraDuration(): number {
        return FrameTime();
    }

    override OnCreated(): void {
        if (!IsServer()) {
            return;
        }
        this.targetTeam = this.ability.GetAbilityTargetTeam();
        this.targetType = this.ability.GetAbilityTargetType();
        this.targetFlags = this.ability.GetAbilityTargetFlags();
        this.radius = this.ability.GetSpecialValueFor("radius");

        const pfx = ParticleManager.CreateParticle(
            "particles/custom/units/heroes/hunters/snapfire/snapfire_acceleration_field.vpcf",
            ParticleAttachment.POINT_FOLLOW,
            this.caster
        );
        ParticleManager.SetParticleControl(pfx, 0, this.parent.GetAbsOrigin());
        ParticleManager.SetParticleControl(pfx, 1, Vector(this.radius, 0, 0));
        ParticleManager.DestroyAndReleaseParticle(pfx, this.GetDuration(), true);
    }
}

@registerModifier()
export class modifier_snapfire_acceleration_field_aura_buff extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    bonusMovementSpeed!: number;
    bonusAttackSpeed!: number;

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
        return [ModifierFunction.ATTACKSPEED_BONUS_CONSTANT, ModifierFunction.MOVESPEED_BONUS_CONSTANT];
    }

    GetModifierAttackSpeedBonus_Constant(): number {
        return this.bonusAttackSpeed;
    }

    GetModifierMoveSpeedBonus_Constant(): number {
        return this.bonusMovementSpeed;
    }

    override OnCreated(): void {
        this.OnRefresh();
    }

    override OnRefresh(): void {
        this.bonusMovementSpeed = this.ability.GetSpecialValueFor("bonus_movement_speed");
        this.bonusAttackSpeed = this.ability.GetSpecialValueFor("bonus_attack_speed");
    }
}
