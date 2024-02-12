import { BaseModifier, registerModifier } from "../../libraries/dota_ts_adapter";
import { modifier_invulnerable_custom } from "../../modifiers/modifier_invulnerable_custom";
import { BaseAbility, registerAbility } from "../../libraries/dota_ts_adapter";

@registerAbility()
export class tower_protection extends BaseAbility {
    GetIntrinsicModifierName() {
        return modifier_tower_protection.name;
    }
}

@registerModifier()
export class modifier_tower_protection extends BaseModifier {
    // Modifier properties
    caster: CDOTA_BaseNPC = this.GetCaster()!;
    ability: CDOTABaseAbility = this.GetAbility()!;
    parent: CDOTA_BaseNPC = this.GetParent();
    targetFlags!: UnitTargetFlags;
    targetType!: UnitTargetType;
    targetTeam!: UnitTargetTeam;
    bool = true;
    isTower = false;

    // Modifier specials

    IsHidden() {
        return true;
    }
    IsDebuff() {
        return false;
    }
    IsPurgable() {
        return false;
    }
    IsPurgeException() {
        return false;
    }

    CheckState(): Partial<Record<ModifierState, boolean>> {
        return {
            [ModifierState.NO_HEALTH_BAR]: this.bool
        };
    }

    OnCreated(): void {
        if (!IsServer()) {
            return;
        }
        this.caster.AddNewModifier(this.caster, this.ability, modifier_invulnerable_custom.name, { duration: -1 });
        this.targetTeam = this.ability.GetAbilityTargetTeam();
        this.targetType = this.ability.GetAbilityTargetType();
        this.targetFlags = this.ability.GetAbilityTargetFlags();
        this.StartIntervalThink(0.25);
    }

    OnIntervalThink(): void {
        const enemies = FindUnitsInRadius(
            this.caster.GetTeamNumber(),
            this.caster.GetAbsOrigin(),
            undefined,
            FIND_UNITS_EVERYWHERE,
            this.targetTeam,
            this.targetType,
            this.targetFlags,
            FindOrder.ANY,
            false
        );

        if (enemies.length > 0 && this.isTower == false) {
            this.isTower = true;
        }

        if (enemies.length == 0 && this.isTower) {
            this.bool = false;
            this.caster.RemoveModifierByName(modifier_invulnerable_custom.name);
        }
    }
}
