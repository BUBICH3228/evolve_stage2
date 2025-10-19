/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseAbility, BaseModifier, registerAbility, registerModifier } from "../../../libraries/dota_ts_adapter";
import { modifier_invulnerable_custom } from "../../../modifiers/modifier_invulnerable_custom";

@registerAbility()
export class sniper_toxic_grenade extends BaseAbility {
    Precache(context: CScriptPrecacheContext): void {
        PrecacheResource(PrecacheType.PARTICLE, "particles/units/heroes/hero_alchemist/alchemist_acid_spray.vpcf", context);
        PrecacheResource(PrecacheType.PARTICLE, "particles/custom/units/heroes/hunters/snapfire/healing_grenade.vpcf", context);
    }
    projectile_table: any;
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();

    override OnSpellStart(): void {
        if (this.GetCursorPosition() == this.caster.GetAbsOrigin())
            this.caster.SetCursorPosition((this.GetCursorPosition() + this.caster.GetForwardVector()) as Vector);

        const toxic_grenade = CreateUnitByName(
            "npc_dummy_unit",
            this.caster.GetAbsOrigin(),
            false,
            this.caster,
            this.caster,
            this.caster.GetTeamNumber()
        );
        toxic_grenade.EmitSound("Hero_Batrider.Flamebreak");
        toxic_grenade.AddNewModifier(this.caster, this, modifier_invulnerable_custom.name, { duration: -1 });

        const toxic_grenade_particle = ParticleManager.CreateParticle(
            "particles/custom/units/heroes/hunters/snapfire/healing_grenade.vpcf",
            ParticleAttachment.WORLDORIGIN,
            this.caster
        );
        ParticleManager.SetParticleControl(toxic_grenade_particle, 0, (this.caster.GetAbsOrigin() + Vector(0, 0, 128)) as Vector);
        ParticleManager.SetParticleControl(toxic_grenade_particle, 1, Vector(this.GetSpecialValueFor("speed")));
        ParticleManager.SetParticleControl(toxic_grenade_particle, 5, this.GetCursorPosition());

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
            toxic_grenade_entindex: toxic_grenade.entindex(),
            toxic_grenade_particle: toxic_grenade_particle
        };

        ProjectileManager.CreateLinearProjectile(this.projectile_table);
    }

    OnProjectileThink_ExtraData(
        location: Vector,
        extraData: { toxic_grenade_entindex: EntityIndex; toxic_grenade_particle: ParticleID }
    ): void {
        if (extraData != undefined && extraData.toxic_grenade_entindex != undefined) {
            (EntIndexToHScript(extraData.toxic_grenade_entindex) as CBaseEntity).SetAbsOrigin(location);
        }
    }

    OnProjectileHit_ExtraData(
        target: CDOTA_BaseNPC | undefined,
        location: Vector,
        extraData: { toxic_grenade_entindex: EntityIndex; toxic_grenade_particle: ParticleID }
    ): boolean | void {
        EmitSoundOnLocationWithCaster(location, "Hero_Batrider.Flamebreak.Impact", this.caster);

        if (extraData.toxic_grenade_entindex != undefined) {
            (EntIndexToHScript(extraData.toxic_grenade_entindex) as CBaseEntity).StopSound("Hero_Batrider.Flamebreak");
            (EntIndexToHScript(extraData.toxic_grenade_entindex) as CBaseEntity).RemoveSelf();
        }

        if (extraData.toxic_grenade_particle != undefined) {
            ParticleManager.DestroyAndReleaseParticle(extraData.toxic_grenade_particle, 0, false);
        }
        print(location);
        CreateModifierThinker(
            this.caster,
            this,
            modifierTinker_sniper_toxic_grenade.name,
            { duration: this.GetSpecialValueFor("duration") },
            location,
            this.caster.GetTeamNumber(),
            false
        );
    }
}

@registerModifier()
export class modifierTinker_sniper_toxic_grenade extends BaseModifier {
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
            victim: undefined,
            attacker: this.caster,
            damage: this.damagePerSecond,
            ability: this.ability,
            damage_type: this.ability.GetAbilityDamageType(),
            damage_flags: DamageFlag.NONE
        };

        const pfx = ParticleManager.CreateParticle(
            "particles/units/heroes/hero_alchemist/alchemist_acid_spray.vpcf",
            ParticleAttachment.POINT_FOLLOW,
            this.parent
        );
        ParticleManager.SetParticleControl(pfx, 0, Vector(0, 0, 0));
        ParticleManager.SetParticleControl(pfx, 1, Vector(this.ability.GetSpecialValueFor("radius"), 1, 1));
        ParticleManager.SetParticleControl(pfx, 15, Vector(25, 150, 25));
        ParticleManager.SetParticleControl(pfx, 16, Vector(0, 0, 0));

        this.StartIntervalThink(FrameTime());
    }

    override OnRefresh(): void {
        this.damagePerSecond = this.ability.GetSpecialValueFor("damage_per_second");
    }

    OnIntervalThink(): void {
        const enemies = FindUnitsInRadius(
            this.caster.GetTeamNumber(),
            this.parent.GetAbsOrigin(),
            undefined,
            this.ability.GetSpecialValueFor("radius"),
            this.ability.GetAbilityTargetTeam(),
            this.ability.GetAbilityTargetType(),
            this.ability.GetAbilityTargetFlags(),
            FindOrder.ANY,
            false
        );

        enemies.forEach((target) => {
            this.damgeTable.victim = target;
            ApplyDamage(this.damgeTable);
            SendOverheadEventMessage(undefined, OverheadAlert.BONUS_SPELL_DAMAGE, target, this.damagePerSecond, undefined);
        });

        this.StartIntervalThink(1);
    }

    GetAttributes(): DOTAModifierAttribute_t {
        return ModifierAttribute.MULTIPLE;
    }
}
