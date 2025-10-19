import { BaseAbility, registerAbility } from "../../../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../../../libraries/dota_ts_adapter";

@registerAbility()
export class sniper_flamethrower extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();

    override OnSpellStart(): void {
        const timer = Timers.CreateTimer(0, () => {
            const forwardVector = this.caster.GetForwardVector();
            ProjectileManager.CreateLinearProjectile({
                Source: this.caster,
                Ability: this,
                vSpawnOrigin: (this.caster.GetAbsOrigin() + Vector(30 * forwardVector.x, 30 * forwardVector.y, -40)) as Vector,
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
                fStartRadius: 50,
                fEndRadius: math.abs(
                    ((math.pi * this.GetEffectiveCastRange(this.caster.GetAbsOrigin(), this.caster)) / 180) *
                        this.GetSpecialValueFor("angel")
                ),
                fProjectileSpeed: this.GetEffectiveCastRange(this.caster.GetAbsOrigin(), this.caster),
                vVelocity: (this.caster.GetForwardVector().Normalized() *
                    this.GetEffectiveCastRange(this.caster.GetAbsOrigin(), this.caster)) as Vector,
                fExpireTime: GameRules.GetGameTime() + 10
            });
            return this.GetSpecialValueFor("interval");
        });
        Timers.CreateTimer(this.GetSpecialValueFor("duration"), () => {
            Timers.RemoveTimer(timer);
        });
        this.caster.AddNewModifier(this.caster, this, modifier_sniper_flamethrower.name, { duration: this.GetSpecialValueFor("duration") });
    }

    OnProjectileHit(target: CDOTA_BaseNPC | undefined): boolean | void {
        if (target != undefined) {
            ApplyDamage({
                attacker: this.caster,
                victim: target,
                ability: this,
                damage: this.GetSpecialValueFor("damage_per_hit") * (this.caster.GetSpellAmplification(false) + 1),
                damage_type: this.GetAbilityDamageType(),
                damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION
            });
        }
    }
}

@registerModifier()
export class modifier_sniper_flamethrower extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();

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

    CheckState(): Partial<Record<modifierstate, boolean>> {
        return { [ModifierState.DISARMED]: true };
    }
}
