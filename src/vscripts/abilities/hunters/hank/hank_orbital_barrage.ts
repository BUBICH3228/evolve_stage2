import { BaseAbility, registerAbility } from "../../../libraries/dota_ts_adapter";

@registerAbility()
export class hank_orbital_barrage extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();
    pfx!: ParticleID[];
    timer!: string[];

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

        for (let index = 0; index < countExplosions; index++) {
            const randomPoint = Vector(RandomInt(-radius, radius), RandomInt(-radius, radius), 0);
            randomPoint.z = 0;
            const newpoint = (point + randomPoint) as Vector;
            this.pfx.push(CastAoeStaticParticle(this.caster, newpoint, this.GetChannelTime(), radiusExplosions));
            this.timer.push(
                Timers.CreateTimer(this.GetChannelTime(), () => {
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

                    const pfx = ParticleManager.CreateParticle(
                        "particles/units/heroes/hero_invoker/invoker_sun_strike.vpcf",
                        ParticleAttachment.WORLDORIGIN,
                        this.caster
                    );
                    ParticleManager.SetParticleControl(pfx, 0, newpoint);
                    ParticleManager.DestroyAndReleaseParticle(pfx);
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
        }
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
