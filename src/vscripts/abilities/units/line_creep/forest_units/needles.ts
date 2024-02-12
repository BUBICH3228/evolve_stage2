import { BaseAbility, registerAbility } from "../../../../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../../../../libraries/dota_ts_adapter";

@registerAbility()
export class needles extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();

    Precache(context: CScriptPrecacheContext): void {
        PrecacheResource(PrecacheType.PARTICLE, "particles/custom/units/aoe_cast.vpcf", context);
    }

    GetChannelTime(): number {
        return this.GetSpecialValueFor("cast_time");
    }

    override OnSpellStart(): void {
        const pfx = CastAoeMovingParticle(
            this.caster,
            this.GetSpecialValueFor("cast_time"),
            this.GetCastRange(this.caster.GetAbsOrigin(), this.caster)
        );

        Timers.CreateTimer(this.GetSpecialValueFor("cast_time"), () => {
            ParticleManager.DestroyAndReleaseParticle(pfx);
            const enemies = FindUnitsInRadius(
                this.caster.GetTeamNumber(),
                this.caster.GetAbsOrigin(),
                undefined,
                this.GetCastRange(this.caster.GetAbsOrigin(), this.caster),
                this.GetAbilityTargetTeam(),
                this.GetAbilityTargetType(),
                this.GetAbilityTargetFlags(),
                FindOrder.ANY,
                false
            );

            enemies.forEach((target) => {
                const modifier = target.AddNewModifier(this.caster, this, modifier_needles.name, {
                    duration: this.GetSpecialValueFor("duration")
                });
                if (modifier != undefined) {
                    modifier.IncrementIndependentStackCount();
                    let damage =
                        this.GetSpecialValueFor("damage") * (this.caster.GetSpellAmplification(false) + 1) * modifier.GetStackCount();
                    damage = math.min(damage, this.GetSpecialValueFor("max_damage") * (this.caster.GetSpellAmplification(false) + 1));
                    ApplyDamage({
                        victim: target,
                        attacker: this.caster,
                        damage: damage,
                        ability: this,
                        damage_type: this.GetAbilityDamageType(),
                        damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION
                    });
                }
                const pfx1 = ParticleManager.CreateParticle(
                    "particles/units/heroes/hero_bristleback/bristleback_quill_spray_impact.vpcf",
                    ParticleAttachment.ABSORIGIN,
                    target
                );
                ParticleManager.DestroyAndReleaseParticle(pfx1);
                EmitSoundOn("Hero_Bristleback.QuillSpray.Target", this.caster);
            });
            const pfx1 = ParticleManager.CreateParticle(
                "particles/units/heroes/hero_bristleback/bristleback_quill_spray.vpcf",
                ParticleAttachment.ABSORIGIN,
                this.caster
            );
            ParticleManager.DestroyAndReleaseParticle(pfx1);
            EmitSoundOn("Hero_Bristleback.QuillSpray.Cast", this.caster);
        });
    }
}

@registerModifier()
export class modifier_needles extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();

    // Modifier specials

    override IsHidden() {
        return false;
    }
    override IsDebuff() {
        return true;
    }
    override IsPurgable() {
        return false;
    }
    override IsPurgeException() {
        return false;
    }
}
