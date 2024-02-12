import { BaseItem, registerAbility } from "../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../libraries/dota_ts_adapter";

@registerAbility()
export class item_assault_cuirass_custom extends BaseItem {
    GetIntrinsicModifierName(): string {
        return modifier_item_assault_cuirass_custom.name;
    }
}

@registerModifier()
export class modifier_item_assault_cuirass_custom extends BaseModifier {
    // Modifier properties
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    bonusArmor!: number;
    bonusAttackSpeed!: number;

    // Modifier specials

    override IsHidden() {
        return true;
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
    RemoveOnDeath(): boolean {
        return false;
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.ATTACKSPEED_BONUS_CONSTANT, ModifierFunction.PHYSICAL_ARMOR_BONUS];
    }

    GetModifierAttackSpeedBonus_Constant(): number {
        return this.bonusAttackSpeed;
    }

    GetModifierPhysicalArmorBonus(): number {
        return this.bonusArmor;
    }

    override OnCreated(): void {
        this.OnRefresh();
    }

    OnRefresh(): void {
        this.bonusArmor = this.ability.GetSpecialValueFor("bonus_armor");
        this.bonusAttackSpeed = this.ability.GetSpecialValueFor("bonus_attack_speed");
        if (!IsServer()) {
            return;
        }
        this.parent.AddNewModifier(this.parent, this.ability, modifier_item_assault_cuirass_custom_aura.name, { duration: -1 });
        this.parent.AddNewModifier(this.parent, this.ability, modifier_item_assault_cuirass_custom_aura_enemy.name, { duration: -1 });
    }

    OnDestroy(): void {
        if (!IsServer()) {
            return;
        }

        if (this.parent.HasModifier(this.GetName())) {
            return;
        }

        this.parent.RemoveModifierByName(modifier_item_assault_cuirass_custom_aura.name);
        this.parent.RemoveModifierByName(modifier_item_assault_cuirass_custom_aura_enemy.name);
    }
}

@registerModifier()
export class modifier_item_assault_cuirass_custom_aura extends BaseModifier {
    // Modifier properties
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    targetTeam!: UnitTargetTeam;
    targetType!: UnitTargetType;
    targetFlags!: UnitTargetFlags;
    auraRadius!: number;
    parentModifierName!: string;

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

    override IsAura(): boolean {
        return true;
    }

    GetAuraSearchFlags(): UnitTargetFlags {
        return this.targetFlags;
    }

    GetAuraSearchTeam(): UnitTargetTeam {
        return this.targetTeam;
    }

    GetAuraSearchType(): UnitTargetType {
        return this.targetType;
    }

    GetAuraRadius(): number {
        return this.auraRadius;
    }

    GetModifierAura(): string {
        return modifier_item_assault_cuirass_custom_aura_buff.name;
    }

    override OnCreated(): void {
        this.OnRefresh();
        if (!IsServer()) {
            return;
        }
        this.targetTeam = this.ability.GetAbilityTargetTeam();
        this.targetType = this.ability.GetAbilityTargetType();
        this.targetFlags = this.ability.GetAbilityTargetFlags();

        this.parentModifierName = this.ability.GetIntrinsicModifierName();
        this.StartIntervalThink(0.25);
    }

    OnRefresh(): void {
        this.auraRadius = this.ability.GetCastRange(this.parent.GetAbsOrigin(), this.parent);
    }

    OnIntervalThink(): void {
        if (this.parent.HasModifier(this.parentModifierName)) {
            return;
        }

        this.OnDestroy();
    }
}

@registerModifier()
export class modifier_item_assault_cuirass_custom_aura_buff extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    bonusAttackSpeed!: number;
    bonusArmor!: number;
    bonusArmorPerLevel!: number;

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
        return [ModifierFunction.ATTACKSPEED_BONUS_CONSTANT, ModifierFunction.PHYSICAL_ARMOR_BONUS];
    }

    GetModifierAttackSpeedBonus_Constant(): number {
        return this.bonusAttackSpeed;
    }

    GetModifierPhysicalArmorBonus(): number {
        return this.bonusArmor + (this.ability.GetLevel() - 1) * this.bonusArmorPerLevel;
    }

    override OnCreated(): void {
        this.OnRefresh();

        if (!IsServer()) {
            return;
        }
        this.StartIntervalThink(0.25);
    }

    OnRefresh(): void {
        this.bonusArmor = this.ability.GetSpecialValueFor("aura_positive_armor");
        this.bonusAttackSpeed = this.ability.GetSpecialValueFor("aura_attack_speed");

        this.bonusArmorPerLevel = this.ability.GetSpecialValueFor("bunus_armor_per_level");
    }

    OnIntervalThink(): void {
        this.OnRefresh();
    }
}

@registerModifier()
export class modifier_item_assault_cuirass_custom_aura_enemy extends BaseModifier {
    // Modifier properties
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    targetTeam!: UnitTargetTeam;
    targetType!: UnitTargetType;
    targetFlags!: UnitTargetFlags;
    auraRadius!: number;
    parentModifierName!: string;

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

    override IsAura(): boolean {
        return true;
    }

    GetAuraSearchFlags(): UnitTargetFlags {
        return this.targetFlags;
    }

    GetAuraSearchTeam(): UnitTargetTeam {
        return this.targetTeam;
    }

    GetAuraSearchType(): UnitTargetType {
        return this.targetType;
    }

    GetAuraRadius(): number {
        return this.auraRadius;
    }

    GetModifierAura(): string {
        return modifier_item_assault_cuirass_custom_aura_enemy_debuff.name;
    }

    override OnCreated(): void {
        this.OnRefresh();
        if (!IsServer()) {
            return;
        }
        this.targetTeam = this.ability.GetAbilityTargetTeam(1);
        this.targetType = this.ability.GetAbilityTargetType(1);
        this.targetFlags = this.ability.GetAbilityTargetFlags(1);

        this.parentModifierName = this.ability.GetIntrinsicModifierName();
        this.StartIntervalThink(0.25);
    }

    OnRefresh(): void {
        this.auraRadius = this.ability.GetCastRange(this.parent.GetAbsOrigin(), this.parent);
    }

    OnIntervalThink(): void {
        if (this.parent.HasModifier(this.parentModifierName)) {
            return;
        }

        this.OnDestroy();
    }
}

@registerModifier()
export class modifier_item_assault_cuirass_custom_aura_enemy_debuff extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    debuffArmor!: number;
    debuffArmorPerLevel!: number;

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

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.PHYSICAL_ARMOR_BONUS];
    }

    GetModifierPhysicalArmorBonus(): number {
        return this.debuffArmor + (this.ability.GetLevel() - 1) * this.debuffArmorPerLevel;
    }

    override OnCreated(): void {
        this.OnRefresh();

        if (!IsServer()) {
            return;
        }
        this.StartIntervalThink(0.25);
    }

    OnRefresh(): void {
        this.debuffArmor = -1 * this.ability.GetSpecialValueFor("aura_negative_armor");

        this.debuffArmorPerLevel = -1 * this.ability.GetSpecialValueFor("aura_negative_armor_per_level");
    }

    OnIntervalThink(): void {
        this.OnRefresh();
    }
}
