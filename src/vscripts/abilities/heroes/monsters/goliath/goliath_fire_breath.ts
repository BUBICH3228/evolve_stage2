import { BaseAbility, registerAbility } from "../../../../libraries/dota_ts_adapter";

@registerAbility()
export class goliath_fire_breath extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();
    private timer?: string;
    OnSpellStart(): void {
        this.timer = Timers.CreateTimer(0, () => {
            ProjectileManager.CreateLinearProjectile({
                Source: this.caster,
                Ability: this,
                vSpawnOrigin: (this.caster.GetAbsOrigin() + Vector(0, 0, 125)) as Vector,
                bDrawsOnMinimap: true,
                bHasFrontalCone: true,
                bIgnoreSource: true,
                bProvidesVision: true,
                bVisibleToEnemies: true,
                iVisionRadius: 200,
                iVisionTeamNumber: DotaTeam.GOODGUYS,
                iUnitTargetTeam: this.GetAbilityTargetTeam(),
                iUnitTargetType: this.GetAbilityTargetType(),
                iUnitTargetFlags: this.GetAbilityTargetFlags(),
                EffectName: "particles/units/heroes/hero_dragon_knight/dragon_knight_breathe_fire.vpcf",
                fDistance: this.GetEffectiveCastRange(this.caster.GetAbsOrigin(), this.caster),
                fStartRadius: 0,
                fEndRadius: math.abs(
                    ((math.pi * this.GetEffectiveCastRange(this.caster.GetAbsOrigin(), this.caster)) / 180) *
                        this.GetSpecialValueFor("angel")
                ),
                fProjectileSpeed: this.GetEffectiveCastRange(this.caster.GetAbsOrigin(), this.caster),
                vVelocity: (this.caster.GetForwardVector().Normalized() *
                    this.GetEffectiveCastRange(this.caster.GetAbsOrigin(), this.caster)) as Vector,
                fExpireTime: GameRules.GetGameTime() + 10
            });

            return this.GetChannelTime() / this.GetSpecialValueFor("count_uses");
        });
    }

    OnChannelFinish(): void {
        if (this.timer != undefined) {
            Timers.RemoveTimer(this.timer);
        }
    }

    OnProjectileHit(target: CDOTA_BaseNPC | undefined): boolean | void {
        if (target != undefined) {
            ApplyDamage({
                attacker: this.caster,
                victim: target,
                ability: this,
                damage: this.GetSpecialValueFor("damage") * (this.caster.GetSpellAmplification(false) + 1),
                damage_type: this.GetAbilityDamageType(),
                damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION
            });
        }
    }
}
