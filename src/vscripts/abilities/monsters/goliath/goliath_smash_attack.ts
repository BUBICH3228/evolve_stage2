import { BaseAbility, registerAbility } from "../../../libraries/dota_ts_adapter";
/* eslint-disable @typescript-eslint/no-unused-vars */
@registerAbility()
export class goliath_smash_attack extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();

    Spawn(): void {
        if (!IsServer()) {
            return;
        }

        this.SetLevel(1);
    }

    override OnSpellStart(): void {
        const target = this.GetCursorTarget();
        if (target == undefined) {
            return;
        }
        Timers.CreateTimer(this.GetCastPoint(), () => {
            const radius = this.GetSpecialValueFor("radius");
            const enemies = FindUnitsInRadius(
                this.caster.GetTeam(),
                target.GetAbsOrigin(),
                undefined,
                radius,
                this.GetAbilityTargetTeam(),
                this.GetAbilityTargetType(),
                this.GetAbilityTargetFlags(),
                FindOrder.ANY,
                false
            );

            enemies.forEach((target) => {
                ApplyDamage({
                    attacker: this.caster,
                    ability: this,
                    victim: target,
                    damage: this.GetSpecialValueFor("attack_damage") * (this.caster.GetSpellAmplification(false) + 1),
                    damage_type: this.GetAbilityDamageType(),
                    damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION
                });
            });

            const pfx = ParticleManager.CreateParticle(
                "particles/units/heroes/hero_primal_beast/primal_beast_trample.vpcf",
                ParticleAttachment.WORLDORIGIN,
                this.caster
            );

            ParticleManager.SetParticleControl(pfx, 0, target.GetAbsOrigin());
            ParticleManager.DestroyAndReleaseParticle(pfx);

            const pfx1 = ParticleManager.CreateParticle(
                "particles/units/heroes/hero_brewmaster/brewmaster_pulverize.vpcf",
                ParticleAttachment.WORLDORIGIN,
                this.caster
            );

            ParticleManager.SetParticleControl(pfx1, 0, target.GetAbsOrigin());
            ParticleManager.DestroyAndReleaseParticle(pfx1);
        });
    }
}
