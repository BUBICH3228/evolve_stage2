import { BaseAbility, registerAbility } from "../../../libraries/dota_ts_adapter";

@registerAbility()
export class tinker_orbital_barrage extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();
    pfx!: ParticleID[];
    timer!: string[];
    currentExplosions!: number;

    Precache(context: CScriptPrecacheContext): void {
        PrecacheResource(PrecacheType.PARTICLE, "particles/units/heroes/hero_invoker/invoker_sun_strike.vpcf", context);
        PrecacheResource(PrecacheType.PARTICLE, "particles/units/heroes/hero_gyrocopter/gyro_calldown_marker.vpcf", context);
        PrecacheResource(PrecacheType.PARTICLE, "particles/units/heroes/hero_gyrocopter/gyro_calldown_first.vpcf", context);
    }

    Spawn(): void {
        if (!IsServer()) {
            return;
        }
        this.SetLevel(1);
    }

    GetAOERadius(): number {
        return this.GetSpecialValueFor("radius");
    }

    override OnSpellStart(): void {
        this.pfx = [];
        this.timer = [];
        const point = this.GetCursorPosition();
        const radius = this.GetSpecialValueFor("radius");
        const countExplosions = this.GetSpecialValueFor("count_explosions");
        const radiusExplosions = this.GetSpecialValueFor("radius_explosions");
        const maxDamage = this.GetSpecialValueFor("max_damage");
        const minDamage = this.GetSpecialValueFor("min_damage");
        const launchDelay = this.GetSpecialValueFor("launch_delay");
        const explosionsDelay = this.GetSpecialValueFor("explosions_delay");

        this.currentExplosions = 0;

        Timers.CreateTimer(0, () => {
            let newpoint = point;
            if (this.currentExplosions > this.GetSpecialValueFor("dispersal")) {
                const randomPoint = Vector(RandomInt(-radius, radius), RandomInt(-radius, radius), 0);
                randomPoint.z = 0;
                newpoint = (point + randomPoint) as Vector;
            }

            this.currentExplosions++;
            const pfx = ParticleManager.CreateParticle(
                "particles/units/heroes/hero_gyrocopter/gyro_calldown_marker.vpcf",
                ParticleAttachment.WORLDORIGIN,
                this.caster
            );
            ParticleManager.SetParticleControl(pfx, 0, newpoint);
            ParticleManager.SetParticleControl(pfx, 1, Vector(radiusExplosions, 1, radiusExplosions * -1));
            ParticleManager.DestroyAndReleaseParticle(pfx, explosionsDelay, true);

            const pfx1 = ParticleManager.CreateParticle(
                "particles/units/heroes/hero_gyrocopter/gyro_calldown_first.vpcf",
                ParticleAttachment.WORLDORIGIN,
                this.caster
            );
            ParticleManager.SetParticleControl(
                pfx1,
                0,
                this.caster.GetAttachmentOrigin(this.caster.ScriptLookupAttachment("attach_attack1"))
            );
            ParticleManager.SetParticleControl(pfx1, 1, newpoint);
            ParticleManager.SetParticleControl(pfx1, 5, Vector(radiusExplosions, radiusExplosions, 0));
            this.timer.push(
                Timers.CreateTimer(explosionsDelay, () => {
                    const enemies = FindUnitsInRadius(
                        this.caster.GetTeamNumber(),
                        newpoint,
                        undefined,
                        radiusExplosions,
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
                            damage:
                                maxDamage -
                                ((maxDamage - minDamage) / radiusExplosions) *
                                    CalculateDistance(target.GetAbsOrigin(), newpoint) *
                                    (1 + this.caster.GetSpellAmplification(false)),
                            ability: this,
                            damage_type: this.GetAbilityDamageType(),
                            damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION
                        });
                    });
                })
            );

            if (this.currentExplosions < countExplosions) {
                if (this.currentExplosions < this.GetSpecialValueFor("dispersal")) {
                    return launchDelay;
                } else {
                    return launchDelay / this.currentExplosions;
                }
            }
        });
    }

    OnChannelFinish(interrupted: boolean): void {
        if (interrupted == true) {
            this.pfx.forEach((pfx) => {
                ParticleManager.DestroyAndReleaseParticle(pfx, 0, true);
            });
            this.timer.forEach((timer) => {
                Timers.RemoveTimer(timer);
            });
        }
    }
}
