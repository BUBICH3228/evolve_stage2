import { BaseAbility, registerAbility } from "../../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../../libraries/dota_ts_adapter";

@registerAbility()
export class planetary_shield extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();
    shildSpawnPosition!: Vector;
    Precache(context: CScriptPrecacheContext): void {
        PrecacheResource(PrecacheType.PARTICLE, "particles/custom/units/heroes/hunters/planet_shild.vpcf", context);
    }
    Spawn(): void {
        if (!IsServer()) {
            return;
        }
        this.SetLevel(1);
    }

    OnChannelFinish(interrupted: boolean): void {
        if (interrupted == true) {
            this.EndCooldown();
            return;
        }
        this.shildSpawnPosition = this.caster.GetAbsOrigin();
        CreateModifierThinker(
            this.caster,
            this,
            modifierThinker_modifier_planetary_shield.name,
            { duration: this.GetSpecialValueFor("duration") },
            this.shildSpawnPosition,
            this.caster.GetTeamNumber(),
            false
        );
    }
}

@registerModifier()
export class modifierThinker_modifier_planetary_shield extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();

    targetFlags!: UnitTargetFlags;
    targetType!: UnitTargetType;
    targetTeam!: UnitTargetTeam;
    radius!: number;
    duration!: number;

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

    override OnCreated(): void {
        if (!IsServer()) {
            return;
        }
        this.targetTeam = this.ability.GetAbilityTargetTeam();
        this.targetType = this.ability.GetAbilityTargetType();
        this.targetFlags = this.ability.GetAbilityTargetFlags();
        this.radius = this.ability.GetSpecialValueFor("radius");
        this.duration = this.ability.GetSpecialValueFor("duration");
        AddFOWViewer(DotaTeam.BADGUYS, this.parent.GetAbsOrigin(), this.radius, this.duration, false);
        AddFOWViewer(DotaTeam.GOODGUYS, this.parent.GetAbsOrigin(), this.radius, this.duration, false);
        const pfx = ParticleManager.CreateParticle(
            "particles/custom/units/heroes/hunters/planet_shild.vpcf",
            ParticleAttachment.ABSORIGIN,
            this.caster
        );
        ParticleManager.SetParticleControl(pfx, 0, this.caster.GetAbsOrigin());
        ParticleManager.SetParticleControl(pfx, 1, Vector(this.radius, this.radius, this.radius));
        ParticleManager.DestroyAndReleaseParticle(pfx, this.duration, false);
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
        return this.radius + 100;
    }

    GetModifierAura(): string {
        return modifier_planetary_shield.name;
    }

    GetAuraDuration(): number {
        return FrameTime();
    }
}

@registerModifier()
export class modifier_planetary_shield extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: planetary_shield = this.GetAbility()! as planetary_shield;
    private parent: CDOTA_BaseNPC = this.GetParent();
    inside = true;
    moveSpeedLimit!: number;
    radius!: number;

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
    override RemoveOnDeath() {
        return true;
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.MOVESPEED_LIMIT];
    }

    override OnCreated(): void {
        if (!IsServer()) {
            return;
        }
        this.radius = this.ability.GetSpecialValueFor("radius");
        this.StartIntervalThink(FrameTime());
    }

    OnIntervalThink() {
        const center_of_shield = this.ability.shildSpawnPosition;

        //Solves for the target's distance from the border of the field (negative is inside, positive is outside)
        const distance = CalculateDistance(this.parent.GetAbsOrigin(), center_of_shield);
        const distance_from_border = distance - this.radius;
        const parentDirection = ((this.parent.GetAbsOrigin() - center_of_shield) as Vector).Normalized();
        if (
            this.GetWallAngel(parentDirection) <= 90 &&
            distance_from_border <= 0 &&
            math.abs(distance_from_border) <= math.max(this.parent.GetHullRadius(), 50)
        ) {
            this.parent.InterruptMotionControllers(true);
            this.moveSpeedLimit = -1;
        } else if (this.GetWallAngel(parentDirection) >= 70 && distance_from_border >= 0 && distance_from_border <= 15) {
            this.moveSpeedLimit = -1;
            this.parent.InterruptMotionControllers(true);
        } else {
            this.moveSpeedLimit = 0;
        }
    }

    GetWallAngel(parentDirection: Vector): number {
        const angel = VectorToAngles(parentDirection).y;
        const parentAngel = this.parent.GetAnglesAsVector().y;
        const wallAngel = math.abs(AngleDiff(angel, parentAngel));
        return wallAngel;
    }

    GetModifierMoveSpeed_Limit(): number {
        if (!IsServer()) {
            return 0;
        }

        return this.moveSpeedLimit;
    }
}
