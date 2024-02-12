import { BaseAbility, registerAbility } from "../../../libraries/dota_ts_adapter";
import { modifier_dragon_knight_elder_dragon_form_custom } from "./elder_dragon_form";

@registerAbility()
export class dragon_knight_dragon_tail_custom extends BaseAbility {
    private pathToProjectile = "particles/units/heroes/hero_dragon_knight/dragon_knight_dragon_tail_dragonform_proj.vpcf";
    private pathToEffectParticle = "particles/units/heroes/hero_dragon_knight/dragon_knight_dragon_tail.vpcf";

    // Ability properties
    private caster: CDOTA_BaseNPC_Hero = this.GetCaster() as CDOTA_BaseNPC_Hero;
    private damageTable: ApplyDamageOptions = {
        victim: this.caster,
        attacker: this.caster,
        damage: 0,
        ability: this,
        damage_type: this.GetAbilityDamageType == undefined ? DamageTypes.NONE : this.GetAbilityDamageType(),
        damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION
    };

    override Precache(context: CScriptPrecacheContext): void {
        PrecacheResource(PrecacheType.PARTICLE, ParticleManager.GetParticleReplacement(this.pathToProjectile, this.caster), context);
        PrecacheResource(PrecacheType.PARTICLE, ParticleManager.GetParticleReplacement(this.pathToEffectParticle, this.caster), context);
    }

    override GetCastRange(location: Vector, target: CDOTA_BaseNPC | undefined): number {
        if (this.caster.HasModifier(modifier_dragon_knight_elder_dragon_form_custom.name)) {
            return this.GetSpecialValueFor("cast_range_in_dragon_form");
        }

        return super.GetCastRange(location, target);
    }

    override GetBehavior(): AbilityBehavior | Uint64 {
        if (this.caster.HasTalent("talent_dragon_knight_dragon_tail_aoe")) {
            return AbilityBehavior.UNIT_TARGET + AbilityBehavior.AOE;
        }

        return super.GetBehavior();
    }

    override GetAOERadius(): number {
        return this.GetSpecialValueFor("talent_aoe_radius");
    }

    override OnSpellStart(): void {
        const target = this.GetCursorTarget() as CDOTA_BaseNPC;

        let targets = [];

        if (this.caster.HasTalent("talent_dragon_knight_dragon_tail_aoe")) {
            targets = FindUnitsInRadius(
                this.caster.GetTeamNumber(),
                target.GetAbsOrigin(),
                undefined,
                this.GetSpecialValueFor("talent_aoe_radius"),
                this.GetAbilityTargetTeam(),
                this.GetAbilityTargetType(),
                this.GetAbilityTargetFlags(),
                FindOrder.ANY,
                false
            );
        } else {
            targets.push(target);
        }

        let projectile = "";
        let projectileSpeed = 99999;
        if (this.caster.HasModifier(modifier_dragon_knight_elder_dragon_form_custom.name)) {
            projectile = ParticleManager.GetParticleReplacement(this.pathToProjectile, this.caster);
            projectileSpeed = this.GetSpecialValueFor("projectile_speed");
            EmitSoundOn("Hero_DragonKnight.DragonTail.DragonFormCast", this.caster);
        }

        for (const enemy of targets) {
            ProjectileManager.CreateTrackingProjectile({
                EffectName: projectile,
                Ability: this,
                Source: this.caster,
                bDodgeable: false,
                iMoveSpeed: projectileSpeed,
                Target: enemy
            });
        }
    }

    override OnProjectileHit(target: CDOTA_BaseNPC | undefined): boolean | void {
        if (target == undefined) {
            return;
        }

        if (target.TriggerSpellAbsorb(this)) {
            return true;
        }

        let damage = this.GetSpecialValueFor("damage");
        damage = damage * (this.caster.GetSpellAmplification(false) + 1);
        damage = damage + (this.caster.GetStrength() * this.GetSpecialValueFor("str_to_dmg_pct")) / 100;

        target.AddNewModifier(this.caster, this, "modifier_stunned", { duration: this.GetSpecialValueFor("stun_duration") });

        this.damageTable.victim = target;
        this.damageTable.damage = damage;

        ApplyDamage(this.damageTable);

        const pfx = ParticleManager.CreateParticle(
            ParticleManager.GetParticleReplacement(this.pathToEffectParticle, this.caster),
            ParticleAttachment.ABSORIGIN_FOLLOW,
            target
        );
        ParticleManager.SetParticleControl(pfx, 3, (target.GetAbsOrigin() - this.caster.GetAbsOrigin()) as Vector);
        ParticleManager.SetParticleControlEnt(
            pfx,
            2,
            this.caster,
            ParticleAttachment.POINT_FOLLOW,
            ParticleAttachmentLocation.HITLOC,
            Vector(0, 0, 0),
            true
        );
        ParticleManager.SetParticleControlEnt(
            pfx,
            4,
            target,
            ParticleAttachment.POINT_FOLLOW,
            ParticleAttachmentLocation.HITLOC,
            Vector(0, 0, 0),
            true
        );
        ParticleManager.DestroyAndReleaseParticle(pfx);

        EmitSoundOn("Hero_DragonKnight.DragonTail.Target", target);
    }
}
