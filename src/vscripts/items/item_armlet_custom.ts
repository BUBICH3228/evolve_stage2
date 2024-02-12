import { BaseItem, registerAbility } from "../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../libraries/dota_ts_adapter";

@registerAbility()
export class item_armlet_custom extends BaseItem {
    GetIntrinsicModifierName(): string {
        return modifier_item_armlet_custom.name;
    }

    GetCooldown(): number {
        return this.GetSpecialValueFor("toggle_cooldown");
    }

    override OnToggle(): void {
        if (!IsServer()) {
            return;
        }

        this.UseResources(false, false, false, true);

        const caster = this.GetParent() as CDOTA_BaseNPC_Hero;

        if (this.GetToggleState()) {
            caster.AddNewModifier(caster, this, modifier_item_armlet_custom_unholy_strength.name, { duration: -1 });
        } else {
            caster.RemoveModifierByName(modifier_item_armlet_custom_unholy_strength.name);
        }
    }

    GetAbilityTextureName(): string {
        const textureName = GetAbilityTextureNameForAbility(item_armlet_custom.name);
        if (!this.GetToggleState()) {
            return textureName;
        } else {
            return "item_armlet_active";
        }
    }
}

@registerModifier()
export class modifier_item_armlet_custom extends BaseModifier {
    // Modifier properties
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    bonusDamage!: number;
    bonusAttackSpeed!: number;
    bonusArmor!: number;
    bonusHealthRegen!: number;
    bonusArmorPerLevel!: number;

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
            ModifierFunction.PREATTACK_BONUS_DAMAGE,
            ModifierFunction.ATTACKSPEED_BONUS_CONSTANT,
            ModifierFunction.PHYSICAL_ARMOR_BONUS,
            ModifierFunction.HEALTH_REGEN_CONSTANT
        ];
    }

    GetModifierPreAttack_BonusDamage(): number {
        return this.bonusDamage;
    }

    GetModifierAttackSpeedBonus_Constant(): number {
        return this.bonusAttackSpeed;
    }

    GetModifierPhysicalArmorBonus(): number {
        return this.bonusArmor + (this.ability.GetLevel() - 1) * this.bonusArmorPerLevel;
    }

    GetModifierConstantHealthRegen(): number {
        return this.bonusHealthRegen;
    }

    override OnCreated(): void {
        this.OnRefresh();
    }

    override OnRefresh(): void {
        this.bonusDamage = this.ability.GetSpecialValueFor("bonus_damage");
        this.bonusAttackSpeed = this.ability.GetSpecialValueFor("bonus_attack_speed");
        this.bonusArmor = this.ability.GetSpecialValueFor("bonus_armor");
        this.bonusHealthRegen = this.ability.GetSpecialValueFor("bonus_health_regen");

        this.bonusArmorPerLevel = this.ability.GetSpecialValueFor("bonus_armor_per_level");
    }

    OnDestroy(): void {
        if (!IsServer()) {
            return;
        }
        this.parent.RemoveModifierByName(modifier_item_armlet_custom_unholy_strength.name);
    }
}

@registerModifier()
export class modifier_item_armlet_custom_unholy_strength extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    unholybonusDamage!: number;
    unholyBonusStrength!: number;
    unholybonusArmor!: number;
    unholyBonusSlowResistance!: number;
    unholyBonusStrengthPerLevel!: number;
    damageTable!: ApplyDamageOptions;
    unholyHealthDrainPerSecond!: number;
    interval = 0.25;

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

    GetEffectName(): string {
        return "particles/items_fx/armlet.vpcf";
    }

    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.PREATTACK_BONUS_DAMAGE,
            ModifierFunction.STATS_STRENGTH_BONUS,
            ModifierFunction.PHYSICAL_ARMOR_BONUS,
            ModifierFunction.SLOW_RESISTANCE,
            ModifierFunction.TOOLTIP
        ];
    }

    OnTooltip(): number {
        return this.unholyHealthDrainPerSecond;
    }

    GetModifierPreAttack_BonusDamage(): number {
        return this.unholybonusDamage;
    }

    GetModifierBonusStats_Strength(): number {
        return this.unholyBonusStrength + (this.ability.GetLevel() - 1) * this.unholyBonusStrengthPerLevel;
    }

    GetModifierPhysicalArmorBonus(): number {
        return this.unholybonusArmor;
    }

    GetModifierSlowResistance(): number {
        return this.unholyBonusSlowResistance;
    }

    override OnCreated(): void {
        this.OnRefresh();
    }

    override OnRefresh(): void {
        this.unholybonusDamage = this.ability.GetSpecialValueFor("unholy_bonus_damage");
        this.unholyBonusStrength = this.ability.GetSpecialValueFor("unholy_bonus_strength");
        this.unholybonusArmor = this.ability.GetSpecialValueFor("unholy_bonus_armor");
        this.unholyBonusSlowResistance = this.ability.GetSpecialValueFor("unholy_bonus_slow_resistance");
        this.unholyHealthDrainPerSecond = this.ability.GetSpecialValueFor("unholy_health_drain_per_second");

        this.unholyBonusStrengthPerLevel = this.ability.GetSpecialValueFor("unholy_bonus_strength_per_level");

        if (!IsServer()) {
            return;
        }

        this.damageTable = {
            victim: this.parent,
            attacker: this.parent,
            damage: this.unholyHealthDrainPerSecond * this.interval,
            ability: this.ability,
            damage_type: DamageTypes.PURE,
            damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION + DamageFlag.NON_LETHAL + DamageFlag.HPLOSS
        };
        this.parent.CalculateGenericBonuses();
        this.StartIntervalThink(this.interval);
    }

    OnIntervalThink(): void {
        if (this.parent.IsIllusion()) {
            return;
        }

        ApplyDamage(this.damageTable);
    }
}
