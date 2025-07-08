import { BaseAbility, registerAbility } from "../../../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../../../libraries/dota_ts_adapter";
import { modifier_invulnerable_custom } from "../../../modifiers/modifier_invulnerable_custom";

@registerAbility()
export class dawnbreaker_napalm_grenade extends BaseAbility {
    projectile_table: any;
    private caster: CDOTA_BaseNPC_Hero = this.GetCaster() as CDOTA_BaseNPC_Hero;

    Spawn(): void {
        if (IsClient()) {
            return;
        }
        this.SetLevel(1);
    }

    Precache(context: CScriptPrecacheContext): void {
        PrecacheResource(PrecacheType.PARTICLE, "particles/units/heroes/hero_batrider/batrider_flamebreak.vpcf", context);
        PrecacheResource(PrecacheType.PARTICLE, "particles/units/heroes/hero_batrider/batrider_flamebreak_debuff.vpcf", context);
    }

    GetAOERadius(): number {
        return this.GetSpecialValueFor("radius");
    }

    override OnSpellStart(): void {
        if (this.GetCursorPosition() == this.caster.GetAbsOrigin())
            this.caster.SetCursorPosition((this.GetCursorPosition() + this.caster.GetForwardVector()) as Vector);

        const napalm_grenade = CreateUnitByName(
            "npc_dummy_unit",
            this.caster.GetAbsOrigin(),
            false,
            this.caster,
            this.caster,
            this.caster.GetTeamNumber()
        );
        napalm_grenade.EmitSound("Hero_Batrider.Flamebreak");
        napalm_grenade.AddNewModifier(this.caster, this, modifier_invulnerable_custom.name, { duration: -1 });

        const napalm_grenade_particle = ParticleManager.CreateParticle(
            "particles/units/heroes/hero_batrider/batrider_flamebreak.vpcf",
            ParticleAttachment.WORLDORIGIN,
            this.caster
        );
        ParticleManager.SetParticleControl(napalm_grenade_particle, 0, (this.caster.GetAbsOrigin() + Vector(0, 0, 128)) as Vector);
        ParticleManager.SetParticleControl(napalm_grenade_particle, 1, Vector(this.GetSpecialValueFor("speed")));
        ParticleManager.SetParticleControl(napalm_grenade_particle, 5, this.GetCursorPosition());

        if (!this.projectile_table) {
            this.projectile_table = {
                Ability: this,
                EffectName: undefined,
                vSpawnOrigin: undefined,
                fDistance: undefined,
                fStartRadius: 0,
                fEndRadius: 0,
                Source: this.caster,
                bHasFrontalCone: false,
                bReplaceExisting: false,
                iUnitTargetTeam: UnitTargetTeam.ENEMY,
                iUnitTargetFlags: this.GetAbilityTargetFlags(),
                iUnitTargetType: this.GetAbilityTargetType(),
                fExpireTime: undefined,
                bDeleteOnHit: false,
                vVelocity: undefined,
                bProvidesVision: true,
                iVisionRadius: 175,
                iVisionTeamNumber: this.caster.GetTeamNumber(),
                ExtraData: undefined
            };
        }

        this.projectile_table.vSpawnOrigin = this.caster.GetAbsOrigin();
        this.projectile_table.fDistance = ((this.GetCursorPosition() - this.caster.GetAbsOrigin()) as Vector).Length2D();
        this.projectile_table.fExpireTime = GameRules.GetGameTime() + 10.0;
        this.projectile_table.vVelocity =
            ((this.GetCursorPosition() - this.caster.GetAbsOrigin()) as Vector).Normalized() *
            this.GetSpecialValueFor("speed") *
            Vector(1, 1, 0);
        this.projectile_table.ExtraData = {
            napalm_grenade_entindex: napalm_grenade.entindex(),
            napalm_grenade_particle: napalm_grenade_particle
        };

        ProjectileManager.CreateLinearProjectile(this.projectile_table);
    }

    OnProjectileThink_ExtraData(
        location: Vector,
        extraData: { napalm_grenade_entindex: EntityIndex; napalm_grenade_particle: ParticleID }
    ): void {
        if (extraData != undefined && extraData.napalm_grenade_entindex != undefined) {
            (EntIndexToHScript(extraData.napalm_grenade_entindex) as CBaseEntity).SetAbsOrigin(location);
        }
    }

    OnProjectileHit_ExtraData(
        target: CDOTA_BaseNPC | undefined,
        location: Vector,
        extraData: { napalm_grenade_entindex: EntityIndex; napalm_grenade_particle: ParticleID }
    ): boolean | void {
        EmitSoundOnLocationWithCaster(location, "Hero_Batrider.Flamebreak.Impact", this.caster);

        if (extraData.napalm_grenade_entindex != undefined) {
            (EntIndexToHScript(extraData.napalm_grenade_entindex) as CBaseEntity).StopSound("Hero_Batrider.Flamebreak");
            (EntIndexToHScript(extraData.napalm_grenade_entindex) as CBaseEntity).RemoveSelf();
        }

        if (extraData.napalm_grenade_particle != undefined) {
            ParticleManager.DestroyAndReleaseParticle(extraData.napalm_grenade_particle, 0, false);
        }

        const enemies = FindUnitsInRadius(
            this.caster.GetTeamNumber(),
            location,
            undefined,
            this.GetSpecialValueFor("radius"),
            this.GetAbilityTargetTeam(),
            this.GetAbilityTargetType(),
            this.GetAbilityTargetFlags(),
            FindOrder.ANY,
            false
        );

        enemies.forEach((target) => {
            ApplyDamage({
                victim: target,
                attacker: this.caster,
                damage: this.GetSpecialValueFor("damage"),
                ability: this,
                damage_type: this.GetAbilityDamageType(),
                damage_flags: DamageFlag.NONE
            });
            target.AddNewModifier(this.caster, this, modifier_dawnbreaker_napalm_grenade.name, {
                duration: this.GetSpecialValueFor("flame_duration")
            });
        });
    }
}

@registerModifier()
export class modifier_dawnbreaker_napalm_grenade extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    damagePerSecond!: number;
    damgeTable!: ApplyDamageOptions;

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
        this.OnRefresh();
        if (IsClient()) {
            return;
        }
        this.damgeTable = {
            victim: this.parent,
            attacker: this.caster,
            damage: this.damagePerSecond,
            ability: this.ability,
            damage_type: this.ability.GetAbilityDamageType(),
            damage_flags: DamageFlag.NONE
        };

        this.StartIntervalThink(FrameTime());
    }

    override OnRefresh(): void {
        this.damagePerSecond = this.ability.GetSpecialValueFor("damage_per_second");
    }

    OnIntervalThink(): void {
        ApplyDamage(this.damgeTable);
        SendOverheadEventMessage(undefined, OverheadAlert.BONUS_SPELL_DAMAGE, this.parent, this.damagePerSecond, undefined);
        this.StartIntervalThink(1.2);
    }

    GetEffectName(): string {
        return "particles/units/heroes/hero_batrider/batrider_flamebreak_debuff.vpcf";
    }

    GetAttributes(): DOTAModifierAttribute_t {
        return ModifierAttribute.MULTIPLE;
    }
}
