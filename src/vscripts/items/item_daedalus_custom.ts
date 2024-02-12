import { BaseAbility, registerAbility } from "../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../libraries/dota_ts_adapter";

@registerAbility()
export class item_daedalus_custom extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();

    GetIntrinsicModifierName(): string {
        return modifier_item_daedalus_custom.name;
    }
}

@registerModifier()
export class modifier_item_daedalus_custom extends BaseModifier {
    // Modifier properties
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    bonusDamage!: number;
    critChance!: number;
    critMultiplier!: number;
    bonusDamagePerLevel!: number;
    bonusAttackSpeedPerLevel!: number;
    critMultiplierPerLevel!: number;
    targetTeam!: UnitTargetTeam;
    targetType!: UnitTargetType;
    targetFlags!: UnitTargetFlags;

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
    RemoveOnDeath(): boolean {
        return false;
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.PREATTACK_BONUS_DAMAGE, ModifierFunction.PREATTACK_CRITICALSTRIKE];
    }

    GetModifierPreAttack_BonusDamage(): number {
        return this.bonusDamage + (this.ability.GetLevel() - 1) * this.bonusDamagePerLevel;
    }

    GetAttributes(): ModifierAttribute {
        return ModifierAttribute.MULTIPLE;
    }

    override OnCreated(): void {
        this.OnRefresh();
        if (!IsServer()) {
            return;
        }

        this.targetTeam = this.ability.GetAbilityTargetTeam();
        this.targetType = this.ability.GetAbilityTargetType();
        this.targetFlags = this.ability.GetAbilityTargetFlags();
    }

    OnRefresh(): void {
        this.bonusDamage = this.ability.GetSpecialValueFor("bonus_damage");
        this.critChance = this.ability.GetSpecialValueFor("crit_chance");
        this.critMultiplier = this.ability.GetSpecialValueFor("crit_multiplier");

        this.bonusDamagePerLevel = this.ability.GetSpecialValueFor("bonus_damage_per_level");
        this.critMultiplierPerLevel = this.ability.GetSpecialValueFor("crit_multiplier_per_level");
    }

    GetModifierPreAttack_CriticalStrike(kv: ModifierAttackEvent): number {
        if (this.parent == kv.target) {
            return 0;
        }

        if (
            UnitFilter(kv.target, this.targetTeam, this.targetType, this.targetFlags, this.parent.GetTeamNumber()) !=
            UnitFilterResult.SUCCESS
        ) {
            return 0;
        }

        if (RollPseudoRandomPercentage(this.critChance, this.ability) == false) {
            return 0;
        }

        return this.critMultiplier + this.critMultiplierPerLevel * (this.ability.GetLevel() - 1);
    }
}
