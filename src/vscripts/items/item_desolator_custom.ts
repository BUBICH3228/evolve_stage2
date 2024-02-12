import { BaseItem, registerAbility } from "../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../libraries/dota_ts_adapter";

@registerAbility()
export class item_desolator_custom extends BaseItem {
    GetIntrinsicModifierName(): string {
        return modifier_item_desolator_custom.name;
    }
}

@registerModifier()
export class modifier_item_desolator_custom extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    bonusDamage!: number;
    corruptionDuration!: number;
    bonusDamagePerLevel!: number;
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
    override RemoveOnDeath() {
        return false;
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.PREATTACK_BONUS_DAMAGE, ModifierFunction.ON_ATTACK_LANDED];
    }

    GetModifierPreAttack_BonusDamage(): number {
        return this.bonusDamage + (this.ability.GetLevel() - 1) * this.bonusDamagePerLevel;
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

    override OnRefresh(): void {
        this.bonusDamage = this.ability.GetSpecialValueFor("bonus_damage");
        this.corruptionDuration = this.ability.GetSpecialValueFor("corruption_duration");

        this.bonusDamagePerLevel = this.ability.GetSpecialValueFor("bonus_damage_per_level");
    }

    OnAttackLanded(kv: ModifierAttackEvent): void {
        if (kv.attacker != this.parent) {
            return;
        }

        if (
            UnitFilter(kv.target, this.targetTeam, this.targetType, this.targetFlags, this.parent.GetTeamNumber()) !=
            UnitFilterResult.SUCCESS
        ) {
            return;
        }

        kv.target.AddNewModifier(this.parent, this.ability, modifier_item_desolator_custom_debuff.name, {
            duration: this.corruptionDuration * (1 - kv.target.GetStatusResistance())
        });
    }
}

@registerModifier()
export class modifier_item_desolator_custom_debuff extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    corruptionArmor!: number;
    corruptionArmorPerLevel!: number;

    // Modifier specials

    override IsHidden() {
        return false;
    }
    override IsDebuff() {
        return true;
    }
    override IsPurgable() {
        return true;
    }
    override IsPurgeException() {
        return true;
    }
    override RemoveOnDeath() {
        return true;
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.PHYSICAL_ARMOR_BONUS];
    }

    GetModifierPhysicalArmorBonus(): number {
        return this.corruptionArmor - (this.ability.GetLevel() - 1) * this.corruptionArmorPerLevel;
    }

    override OnCreated(): void {
        this.OnRefresh();
    }

    override OnRefresh(): void {
        this.corruptionArmor = -1 * this.ability.GetSpecialValueFor("corruption_armor");

        this.corruptionArmorPerLevel = this.ability.GetSpecialValueFor("corruption_armor_per_level");
    }
}
