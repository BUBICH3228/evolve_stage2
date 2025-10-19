import { BaseAbility, registerAbility } from "../../../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../../../libraries/dota_ts_adapter";
import { modifier_incapacitated_state } from "../../../modifiers/modifier_incapacitated_state";

@registerAbility()
export class healing_burst extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();

    Precache(context: CScriptPrecacheContext): void {
        PrecacheResource(
            PrecacheType.PARTICLE,
            "particles/econ/items/omniknight/hammer_ti6_immortal/omniknight_purification_ti6_immortal.vpcf",
            context
        );
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

        enemies.forEach((target) => {
            const heal = this.GetSpecialValueFor("heal");
            const healSelf = this.GetSpecialValueFor("heal_self");
            const healIncapped = this.GetSpecialValueFor("heal_incapped");
            if (target != this.caster) {
                if (target.FindModifierByName(modifier_incapacitated_state.name) != undefined) {
                    target.Heal(healIncapped, this);
                }
                target.Heal(heal, this);
            } else {
                target.Heal(healSelf, this);
            }

            const pfx = ParticleManager.CreateParticle(
                "particles/econ/items/omniknight/hammer_ti6_immortal/omniknight_purification_ti6_immortal.vpcf",
                ParticleAttachment.ABSORIGIN_FOLLOW,
                target
            );
            ParticleManager.SetParticleControl(pfx, 0, target.GetAbsOrigin());
        });
    }
}
