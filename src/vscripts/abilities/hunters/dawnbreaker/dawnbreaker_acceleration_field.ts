import { BaseAbility, registerAbility } from "../../../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../../../libraries/dota_ts_adapter";
import { modifier_invulnerable_custom } from "../../../modifiers/modifier_invulnerable_custom";

@registerAbility()
export class dawnbreaker_acceleration_field extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC_Hero = this.GetCaster() as CDOTA_BaseNPC_Hero;
    Spawn(): void {
        if (IsClient()) {
            return;
        }
        this.SetLevel(1);
    }

    GetAOERadius(): number {
        return this.GetSpecialValueFor("radius");
    }

    Precache(context: CScriptPrecacheContext): void {
        PrecacheResource(
            PrecacheType.PARTICLE,
            "particles/custom/units/heroes/hunters/dawnbreaker/dawnbreaker_acceleration_ring_glow.vpcf",
            context
        );
        PrecacheResource(
            PrecacheType.PARTICLE,
            "particles/units/heroes/hero_dawnbreaker/dawnbreaker_celestial_hammer_grounded.vpcf",
            context
        );
        PrecacheResource(
            PrecacheType.PARTICLE,
            "particles/custom/units/heroes/hunters/dawnbreaker/dawnbreaker_acceleration_field_playercolor.vpcf",
            context
        );
        PrecacheResource(
            PrecacheType.PARTICLE,
            "particles/units/heroes/hero_dawnbreaker/dawnbreaker_celestial_hammer_projectile.vpcf",
            context
        );
    }

    override OnSpellStart(): void {
        const point = this.GetCursorPosition();

        this.caster.StartGesture(GameActivity.DOTA_CAST_ABILITY_2);
        Timers.CreateTimer(0.7, () => {
            this.caster.GetTogglableWearable(LoadoutType.TYPE_WEAPON)?.AddEffects(EntityEffects.EF_NODRAW);
            this.caster.AddActivityModifier("no_hammer");
        });
        let distance = CalculateDistance(this.caster.GetAbsOrigin(), point);

        const min_rate = 1;
        let direction = (point - this.caster.GetOrigin()) as Vector;
        const len = direction.Length2D();
        direction.z = 0;
        direction = direction.Normalized();

        distance = math.min(distance, len);
        const velocity = (direction * 1500) as Vector;
        let rotation = 0.5;
        const duration = distance / velocity.Length2D();
        let rate = rotation / duration;

        do {
            rotation = rotation + 1;
            rate = rotation / duration;
        } while (rate < min_rate);

        const pfx = ParticleManager.CreateParticle(
            "particles/units/heroes/hero_dawnbreaker/dawnbreaker_celestial_hammer_projectile.vpcf",
            ParticleAttachment.WORLDORIGIN,
            this.caster
        );
        ParticleManager.SetParticleControl(pfx, 0, this.caster.GetAbsOrigin());
        ParticleManager.SetParticleControl(pfx, 1, velocity);
        ParticleManager.SetParticleControl(pfx, 4, Vector(rate, 0, 0));

        Timers.CreateTimer(duration, () => {
            ParticleManager.DestroyAndReleaseParticle(pfx, 0, true);
            CreateModifierThinker(
                this.caster,
                this,
                modifierThinker_dawnbreaker_acceleration_field.name,
                {
                    duration: this.GetSpecialValueFor("duration")
                },
                point,
                this.caster.GetTeamNumber(),
                true
            );

            const pfx1 = ParticleManager.CreateParticle(
                "particles/units/heroes/hero_dawnbreaker/dawnbreaker_celestial_hammer_grounded.vpcf",
                ParticleAttachment.WORLDORIGIN,
                this.caster
            );

            ParticleManager.SetParticleControl(pfx1, 0, point);
            ParticleManager.DestroyAndReleaseParticle(pfx1, this.GetSpecialValueFor("duration"), true);
            const pfx2 = ParticleManager.CreateParticle(
                "particles/custom/units/heroes/hunters/dawnbreaker/dawnbreaker_acceleration_field_playercolor.vpcf",
                ParticleAttachment.WORLDORIGIN,
                this.caster
            );

            ParticleManager.SetParticleControl(pfx2, 0, point);
            ParticleManager.DestroyAndReleaseParticle(pfx2, this.GetSpecialValueFor("duration"), true);
            Timers.CreateTimer(this.GetSpecialValueFor("duration"), () => {
                let distance = CalculateDistance(this.caster.GetAbsOrigin(), point);

                let direction = (this.caster.GetOrigin() - point) as Vector;
                const len = direction.Length2D();
                direction.z = 0;
                direction = direction.Normalized();

                distance = math.min(distance, len);
                const velocity = (direction * 1100) as Vector;
                const duration = distance / velocity.Length2D();
                print(duration);
                let rate = rotation / duration;

                do {
                    rotation = rotation + 1;
                    rate = rotation / duration;
                } while (rate < min_rate);

                const pfx3 = ParticleManager.CreateParticle(
                    "particles/units/heroes/hero_dawnbreaker/dawnbreaker_celestial_hammer_projectile.vpcf",
                    ParticleAttachment.WORLDORIGIN,
                    this.caster
                );
                ParticleManager.SetParticleControl(pfx3, 0, point);
                ParticleManager.SetParticleControl(pfx3, 1, velocity);
                ParticleManager.SetParticleControl(pfx, 4, Vector(rate, 0, 0));
                ParticleManager.DestroyAndReleaseParticle(pfx3, duration, true);
            });
        });
    }
}

@registerModifier()
export class modifierThinker_dawnbreaker_acceleration_field extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC_Hero = this.GetCaster() as CDOTA_BaseNPC_Hero;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    targetFlags!: UnitTargetFlags;
    targetTeam!: UnitTargetTeam;
    targetType!: UnitTargetType;
    auraRadius!: number;
    timer!: string;

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
        return this.auraRadius;
    }

    GetModifierAura(): string {
        return modifier_dawnbreaker_acceleration_field_aura_buff.name;
    }

    override OnCreated(): void {
        this.auraRadius = this.ability.GetSpecialValueFor("radius");
        if (IsClient()) {
            return;
        }
        AddFOWViewer(DotaTeam.GOODGUYS, this.parent.GetAbsOrigin(), 100, this.GetDuration(), false);
        this.timer = Timers.CreateTimer(0, () => {
            const pfx = ParticleManager.CreateParticle(
                "particles/custom/units/heroes/hunters/dawnbreaker/dawnbreaker_acceleration_ring_glow.vpcf",
                ParticleAttachment.ABSORIGIN,
                this.parent
            );
            ParticleManager.SetParticleControl(pfx, 0, this.parent.GetAbsOrigin());
            return 1;
        });
        this.targetTeam = this.ability.GetAbilityTargetTeam();
        this.targetType = this.ability.GetAbilityTargetType();
        this.targetFlags = this.ability.GetAbilityTargetFlags();
    }

    OnDestroy(): void {
        if (IsClient()) {
            return;
        }
        Timers.RemoveTimer(this.timer);
        this.caster.ClearActivityModifiers();
        this.caster.GetTogglableWearable(LoadoutType.TYPE_WEAPON)?.RemoveEffects(EntityEffects.EF_NODRAW);
    }
}

@registerModifier()
export class modifier_dawnbreaker_acceleration_field_aura_buff extends BaseModifier {
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
