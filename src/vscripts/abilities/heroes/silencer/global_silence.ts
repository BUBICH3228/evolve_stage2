import { BaseAbility, registerAbility } from "../../../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../../../libraries/dota_ts_adapter";
import { silencer_curse_of_the_silent_custom } from "./curse_of_the_silent";
import { silencer_last_word_custom } from "./last_word";

@registerAbility()
export class silencer_global_silence_custom extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();

    GetCastRange(): number {
        return this.GetSpecialValueFor("radius");
    }

    override OnSpellStart(): void {
        const enemies = FindUnitsInRadius(
            this.caster.GetTeamNumber(),
            this.caster.GetAbsOrigin(),
            undefined,
            this.GetSpecialValueFor("radius"),
            this.GetAbilityTargetTeam(),
            this.GetAbilityTargetType(),
            this.GetAbilityTargetFlags(),
            FindOrder.ANY,
            false
        );

        const ability = this.caster.FindAbilityByName("silencer_curse_of_the_silent_custom") as silencer_curse_of_the_silent_custom;
        if (ability != undefined) {
            ability.OnSpellStart(enemies, this.GetSpecialValueFor("multiplier"));
        }

        if (this.caster.HasTalent("talent_silencer_global_silence_cast_last_word")) {
            const ability = this.caster.FindAbilityByName("silencer_last_word_custom") as silencer_last_word_custom;
            if (ability != undefined) {
                ability.OnSpellStart(enemies);
            }
        }

        enemies.forEach((target) => {
            target.AddNewModifier(this.caster, this, modifier_silencer_global_silence_custom.name, {
                duration: this.GetDuration()
            });
            if (this.caster.HasTalent("talent_silencer_global_silence_give_spell_amplification")) {
                const modifier = this.caster.AddNewModifier(this.caster, this, talent_modifier_silencer_global_silence_custom.name, {
                    duration: this.GetSpecialValueFor("talent_duration_spell_amp")
                });
                if (modifier != undefined) {
                    modifier.IncrementIndependentStackCount();
                }
            }
        });

        const pfx = ParticleManager.CreateParticle(
            "particles/units/heroes/hero_silencer/silencer_global_silence.vpcf",
            ParticleAttachment.ABSORIGIN_FOLLOW,
            this.caster
        );
        ParticleManager.SetParticleControlForward(pfx, 0, this.caster.GetForwardVector());
        ParticleManager.SetParticleControlEnt(
            pfx,
            1,
            this.caster,
            ParticleAttachment.POINT_FOLLOW,
            ParticleAttachmentLocation.ATTACK1,
            Vector(0, 0, 0),
            true
        );
        ParticleManager.DestroyAndReleaseParticle(pfx);
        EmitGlobalSound("Hero_Silencer.GlobalSilence.Cast");
    }
}

@registerModifier()
export class modifier_silencer_global_silence_custom extends BaseModifier {
    // Modifier properties
    private parent: CDOTA_BaseNPC = this.GetParent();

    // Modifier specials

    override IsHidden() {
        return false;
    }
    override IsDebuff() {
        return true;
    }

    CheckState(): Partial<Record<ModifierState, boolean>> {
        return {
            [ModifierState.SILENCED]: true
        };
    }

    OnCreated(): void {
        const pfx = ParticleManager.CreateParticle(
            "particles/units/heroes/hero_silencer/silencer_global_silence_hero.vpcf",
            ParticleAttachment.ABSORIGIN_FOLLOW,
            this.parent
        );
        ParticleManager.SetParticleControlEnt(
            pfx,
            1,
            this.parent,
            ParticleAttachment.ABSORIGIN_FOLLOW,
            ParticleAttachmentLocation.ATTACK1,
            Vector(0, 0, 0),
            true
        );
        this.AddParticle(pfx, false, false, -1, false, false);
        EmitSoundOnClient("Hero_Silencer.GlobalSilence.Effect", this.parent);
    }
}

@registerModifier()
export class talent_modifier_silencer_global_silence_custom extends BaseModifier {
    // Modifier properties
    private ability: CDOTABaseAbility = this.GetAbility()!;
    talentSpellAmpPerUnit!: number;

    // Modifier specials

    override IsHidden() {
        return false;
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

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.SPELL_AMPLIFY_PERCENTAGE];
    }

    GetModifierSpellAmplify_Percentage(): number {
        return this.talentSpellAmpPerUnit * this.GetStackCount();
    }

    override OnCreated(): void {
        this.OnRefresh();
    }
    OnRefresh(): void {
        this.talentSpellAmpPerUnit = this.ability.GetSpecialValueFor("talent_spell_amp_per_unit");
    }
}
