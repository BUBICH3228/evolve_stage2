import { BaseAbility, registerAbility } from "../../../libraries/dota_ts_adapter";
import { modifier_invulnerable_custom } from "../../../modifiers/modifier_invulnerable_custom";

@registerAbility()
export class dawnbreaker_healing_grenade extends BaseAbility {
    projectile_table: any;
    private caster: CDOTA_BaseNPC_Hero = this.GetCaster() as CDOTA_BaseNPC_Hero;

    Spawn(): void {
        if (IsClient()) {
            return;
        }
        this.SetLevel(1);
    }

    Precache(context: CScriptPrecacheContext): void {
        PrecacheResource(PrecacheType.PARTICLE, "particles/custom/units/heroes/hunters/dawnbreaker/healing_grenade.vpcf", context);
    }

    GetAOERadius(): number {
        return this.GetSpecialValueFor("radius");
    }

    override OnSpellStart(): void {
        if (this.GetCursorPosition() == this.caster.GetAbsOrigin())
            this.caster.SetCursorPosition((this.GetCursorPosition() + this.caster.GetForwardVector()) as Vector);

        const healing_grenade = CreateUnitByName(
            "npc_dummy_unit",
            this.caster.GetAbsOrigin(),
            false,
            this.caster,
            this.caster,
            this.caster.GetTeamNumber()
        );
        healing_grenade.EmitSound("Hero_Batrider.Flamebreak");
        healing_grenade.AddNewModifier(this.caster, this, modifier_invulnerable_custom.name, { duration: -1 });

        const healing_grenade_particle = ParticleManager.CreateParticle(
            "particles/custom/units/heroes/hunters/dawnbreaker/healing_grenade.vpcf",
            ParticleAttachment.WORLDORIGIN,
            this.caster
        );
        ParticleManager.SetParticleControl(healing_grenade_particle, 0, (this.caster.GetAbsOrigin() + Vector(0, 0, 128)) as Vector);
        ParticleManager.SetParticleControl(healing_grenade_particle, 1, Vector(this.GetSpecialValueFor("speed")));
        ParticleManager.SetParticleControl(healing_grenade_particle, 5, this.GetCursorPosition());

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
                iUnitTargetTeam: this.GetAbilityTargetTeam(),
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
            healing_grenade_entindex: healing_grenade.entindex(),
            healing_grenade_particle: healing_grenade_particle
        };

        ProjectileManager.CreateLinearProjectile(this.projectile_table);
    }

    OnProjectileThink_ExtraData(
        location: Vector,
        extraData: { healing_grenade_entindex: EntityIndex; healing_grenade_particle: ParticleID }
    ): void {
        if (extraData != undefined && extraData.healing_grenade_entindex != undefined) {
            (EntIndexToHScript(extraData.healing_grenade_entindex) as CBaseEntity).SetAbsOrigin(location);
        }
    }

    OnProjectileHit_ExtraData(
        target: CDOTA_BaseNPC | undefined,
        location: Vector,
        extraData: { healing_grenade_entindex: EntityIndex; healing_grenade_particle: ParticleID }
    ): boolean | void {
        if (target == this.caster) {
            return false;
        }
        EmitSoundOnLocationWithCaster(location, "Hero_Batrider.Flamebreak.Impact", this.caster);

        if (extraData.healing_grenade_entindex != undefined) {
            (EntIndexToHScript(extraData.healing_grenade_entindex) as CBaseEntity).RemoveSelf();
        }

        if (extraData.healing_grenade_particle != undefined) {
            ParticleManager.DestroyAndReleaseParticle(extraData.healing_grenade_particle, 0, false);
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
            const heal = this.GetSpecialValueFor("heal");
            const healSelf = this.GetSpecialValueFor("heal_self");
            const healIncapped = this.GetSpecialValueFor("heal_incapped");
            if (target != this.caster) {
                target.Heal(heal, this);
            } else {
                target.Heal(healSelf, this);
            }
        });
    }
}
