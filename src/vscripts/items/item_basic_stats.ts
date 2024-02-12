import { BaseItem, registerAbility } from "../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../libraries/dota_ts_adapter";

@registerAbility()
export class item_basic_stat_custom extends BaseItem {
    GetIntrinsicModifierName(): string {
        return modifier_item_basic_stat_custom.name;
    }
}

@registerModifier()
export class modifier_item_basic_stat_custom extends BaseModifier {
    // Modifier properties
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    statStr = 0;
    statInt = 0;
    statAgi = 0;
    statDamage = 0;
    statArmor = 0;
    statMana = 0;
    statHealth = 0;
    statAttack = 0;
    statHpRegen = 0;
    statLifesteal = 0;
    statManaRegen = 0;
    statSpellAmp = 0;
    statMoveSpeed = 0;
    statEvasion = 0;
    statSpellLifesteal = 0;
    statAttackRange = 0;
    statAttackRangeMelee = 0;
    statStatusResist = 0;
    statCooldownReduction = 0;

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
        return [
            ModifierFunction.STATS_STRENGTH_BONUS,
            ModifierFunction.STATS_INTELLECT_BONUS,
            ModifierFunction.STATS_AGILITY_BONUS,
            ModifierFunction.PREATTACK_BONUS_DAMAGE,
            ModifierFunction.PHYSICAL_ARMOR_BONUS,
            ModifierFunction.MANA_BONUS,
            ModifierFunction.HEALTH_BONUS,
            ModifierFunction.ATTACKSPEED_BONUS_CONSTANT,
            ModifierFunction.HEALTH_REGEN_CONSTANT,
            ModifierFunction.MOUNTAIN_LIFESTEAL,
            ModifierFunction.MANA_REGEN_CONSTANT,
            ModifierFunction.SPELL_AMPLIFY_PERCENTAGE,
            ModifierFunction.MOVESPEED_BONUS_CONSTANT,
            ModifierFunction.EVASION_CONSTANT,
            ModifierFunction.MOUNTAIN_SPELL_LIFESTEAL,
            ModifierFunction.ATTACK_RANGE_BONUS,
            ModifierFunction.STATUS_RESISTANCE,
            ModifierFunction.COOLDOWN_PERCENTAGE
        ];
    }

    GetModifierBonusStats_Strength(): number {
        return this.statStr;
    }

    GetModifierBonusStats_Intellect(): number {
        return this.statInt;
    }

    GetModifierBonusStats_Agility(): number {
        return this.statAgi;
    }

    GetModifierPreAttack_BonusDamage(): number {
        return this.statDamage;
    }

    GetModifierPhysicalArmorBonus(): number {
        return this.statArmor;
    }

    GetModifierManaBonus(): number {
        return this.statMana;
    }

    GetModifierHealthBonus(): number {
        return this.statHealth;
    }

    GetModifierAttackSpeedBonus_Constant(): number {
        return this.statAttack;
    }

    GetModifierConstantHealthRegen(): number {
        return this.statHpRegen;
    }

    GetModifierLifesteal(kv: ModifierAttackEvent): number {
        if (kv.attacker != this.parent) {
            return 0;
        }

        return this.statLifesteal;
    }

    GetModifierConstantManaRegen(): number {
        return this.statManaRegen;
    }

    GetModifierSpellAmplify_Percentage(): number {
        return this.statSpellAmp;
    }

    GetModifierMoveSpeedBonus_Constant(): number {
        return this.statMoveSpeed;
    }

    GetModifierEvasion_Constant(): number {
        return this.statEvasion;
    }

    GetModifierSpellLifesteal(): number {
        return this.statSpellLifesteal;
    }

    GetModifierAttackRangeBonus(): number {
        if (this.parent.IsRangedAttacker()) {
            return this.statAttackRange;
        } else {
            return this.statAttackRangeMelee;
        }
    }

    GetModifierStatusResistance(): number {
        return this.statStatusResist;
    }

    GetModifierPercentageCooldown(): number {
        return this.statCooldownReduction;
    }

    GetAttributes(): ModifierAttribute {
        return ModifierAttribute.MULTIPLE;
    }

    override OnCreated(): void {
        this.OnRefresh();
    }

    override OnRefresh(): void {
        this.statStr = this.ability.GetSpecialValueFor("stat_str");
        this.statInt = this.ability.GetSpecialValueFor("stat_int");
        this.statAgi = this.ability.GetSpecialValueFor("stat_agi");
        this.statDamage = this.ability.GetSpecialValueFor("stat_damage");
        this.statArmor = this.ability.GetSpecialValueFor("stat_armor");
        this.statMana = this.ability.GetSpecialValueFor("stat_mana");
        this.statHealth = this.ability.GetSpecialValueFor("stat_health");
        this.statAttack = this.ability.GetSpecialValueFor("stat_attack");
        this.statHpRegen = this.ability.GetSpecialValueFor("stat_hp_regen");
        this.statLifesteal = this.ability.GetSpecialValueFor("stat_lifesteal");
        this.statManaRegen = this.ability.GetSpecialValueFor("stat_mana_regen");
        this.statSpellAmp = this.ability.GetSpecialValueFor("stat_spell_amp");
        this.statMoveSpeed = this.ability.GetSpecialValueFor("stat_move_speed");
        this.statEvasion = this.ability.GetSpecialValueFor("stat_evasion");
        this.statSpellLifesteal = this.ability.GetSpecialValueFor("stat_spell_lifesteal");
        this.statAttackRange = this.ability.GetSpecialValueFor("stat_attack_range");
        this.statAttackRangeMelee = this.ability.GetSpecialValueFor("stat_attack_range_melee");
        this.statStatusResist = this.ability.GetSpecialValueFor("stat_status_resist");
        this.statCooldownReduction = this.ability.GetSpecialValueFor("stat_cooldown_reduction");
    }
}

@registerAbility()
export class item_basic_stat_str_custom extends item_basic_stat_custom {}
@registerAbility()
export class item_basic_stat_int_custom extends item_basic_stat_custom {}
@registerAbility()
export class item_basic_stat_agi_custom extends item_basic_stat_custom {}
@registerAbility()
export class item_basic_stat_damage_custom extends item_basic_stat_custom {}
@registerAbility()
export class item_basic_stat_armor_custom extends item_basic_stat_custom {}
@registerAbility()
export class item_basic_stat_mana_custom extends item_basic_stat_custom {}
@registerAbility()
export class item_basic_stat_health_custom extends item_basic_stat_custom {}
@registerAbility()
export class item_basic_stat_attack_custom extends item_basic_stat_custom {}
@registerAbility()
export class item_basic_stat_hp_regen_custom extends item_basic_stat_custom {}
@registerAbility()
export class item_basic_stat_lifesteal_custom extends item_basic_stat_custom {}
@registerAbility()
export class item_basic_stat_mana_regen_custom extends item_basic_stat_custom {}
@registerAbility()
export class item_basic_stat_spell_amp_custom extends item_basic_stat_custom {}
@registerAbility()
export class item_basic_stat_move_speed_custom extends item_basic_stat_custom {}
@registerAbility()
export class item_basic_stat_evasion_custom extends item_basic_stat_custom {}
@registerAbility()
export class item_basic_stat_spell_lifesteal_custom extends item_basic_stat_custom {}
@registerAbility()
export class item_basic_stat_attack_range_custom extends item_basic_stat_custom {}
@registerAbility()
export class item_basic_stat_attack_range_melee_custom extends item_basic_stat_custom {}
@registerAbility()
export class item_basic_stat_status_resist_custom extends item_basic_stat_custom {}
@registerAbility()
export class item_basic_stat_cooldown_reduction_custom extends item_basic_stat_custom {}
