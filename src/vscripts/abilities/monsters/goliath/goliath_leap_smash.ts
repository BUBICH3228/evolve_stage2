import { BaseAbility, registerAbility } from "../../../libraries/dota_ts_adapter";

@registerAbility()
export class goliath_leap_smash extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();

    override OnSpellStart(): void {
        let distance = CalculateDistance(this.caster.GetAbsOrigin(), this.GetCursorPosition());

        const maxDistance = this.GetSpecialValueFor("max_distance");
        const speed = this.GetSpecialValueFor("speed");
        const radius = this.GetSpecialValueFor("radius");

        if (distance > maxDistance) {
            distance = maxDistance;
        }

        const damage = (this.GetSpecialValueFor("damage_per_distance") * distance) / 100;

        this.caster.AddNewModifier(this.caster, this, "modifier_generic_arc", {
            distance: distance,
            speed: distance * 2,
            height: 200,
            fix_end: false,
            isForward: true
        });

        this.caster.StartGesture(GameActivity.DOTA_FLAIL);
        Timers.CreateTimer(distance / (distance * 2) - 0.2, () => {
            this.caster.RemoveGesture(GameActivity.DOTA_FLAIL);
            this.caster.StartGesture(GameActivity.DOTA_FORCESTAFF_END);
        });
        Timers.CreateTimer(distance / (distance * 2), () => {
            let pfx = ParticleManager.CreateParticle(
                "particles/units/heroes/hero_primal_beast/primal_beast_trample.vpcf",
                ParticleAttachment.WORLDORIGIN,
                this.caster
            );

            ParticleManager.SetParticleControl(pfx, 0, this.caster.GetAbsOrigin());
            ParticleManager.DestroyAndReleaseParticle(pfx);

            pfx = ParticleManager.CreateParticle(
                "particles/units/heroes/hero_brewmaster/brewmaster_pulverize.vpcf",
                ParticleAttachment.WORLDORIGIN,
                this.caster
            );

            ParticleManager.SetParticleControl(pfx, 0, this.caster.GetAbsOrigin());
            ParticleManager.DestroyAndReleaseParticle(pfx);

            const enemies = FindUnitsInRadius(
                this.caster.GetTeam(),
                this.caster.GetAbsOrigin(),
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
                    damage: damage * (this.caster.GetSpellAmplification(false) + 1),
                    damage_type: this.GetAbilityDamageType(),
                    damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION
                });
            });
            //EmitSoundOn("Hero_Primal_Beast.Trample.Cast", this.caster);
            this.caster.RemoveGesture(GameActivity.DOTA_FORCESTAFF_END);
        });
    }
}
