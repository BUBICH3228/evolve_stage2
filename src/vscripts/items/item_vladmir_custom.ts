import { BaseItem, registerAbility } from "../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../libraries/dota_ts_adapter";

interface item_vladmir_custom_data {
    bonusDamage: number;
    bonusHealth: number;
    bonusMana: number;
    bonusAttackSpeed: number;
    bonusMoveSpeed: number;
    bonusArmor: number;
}

@registerAbility()
export class item_vladmir_custom extends BaseItem {
    GetIntrinsicModifierName(): string {
        return modiifer_item_vladmir_custom.name;
    }
    override OnSpellStart(): void {
        const caster = this.GetCaster();
        const target = this.GetCursorTarget();

        if (target == undefined) {
            return;
        }

        if (target.IsBoss()) {
            PlayerResource.SendCustomErrorMessageToPlayer(caster.GetPlayerOwnerID(), "failed_to_use_on_the_boss");
            this.RefundManaCost();
            this.EndCooldown();
            return;
        }

        const bonusDamage = (target.GetDamageMax() * this.GetSpecialValueFor("damage_converted_pct")) / 100;
        const bonusHealth = (target.GetMaxHealth() * this.GetSpecialValueFor("health_converted_pct")) / 100;
        const bonusMana = (target.GetMaxMana() * this.GetSpecialValueFor("mana_converted_pct")) / 100;
        const bonusAttackSpeed = (target.GetDisplayAttackSpeed() * this.GetSpecialValueFor("attack_speed_converted_pct")) / 100;
        const bonusMoveSpeed = (target.GetIdealSpeed() * this.GetSpecialValueFor("move_speed_converted_pct")) / 100;
        const bonusArmor = (target.GetPhysicalArmorValue(false) * this.GetSpecialValueFor("armor_converted_pct")) / 100;

        caster.AddNewModifier(caster, this, modiifer_item_vladmir_custom_active.name, {
            duration: this.GetDuration(),
            bonusDamage: bonusDamage,
            bonusHealth: bonusHealth,
            bonusMana: bonusMana,
            bonusAttackSpeed: bonusAttackSpeed,
            bonusMoveSpeed: bonusMoveSpeed,
            bonusArmor: bonusArmor
        });
        target.Kill(this, caster);
        EmitSoundOn("Mountainitem.Vladmir.Cast", caster);
    }
}

@registerModifier()
export class modiifer_item_vladmir_custom extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    targetFlags!: UnitTargetFlags;
    targetTeam!: UnitTargetTeam;
    targetType!: UnitTargetType;
    auraRadius!: number;

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
    RemoveOnDeath(): boolean {
        return false;
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
        return modiifer_item_vladmir_custom_aura_buff.name;
    }

    override OnCreated(): void {
        this.OnRefresh();
        this.OnRefresh();
        if (!IsServer()) {
            return;
        }
        this.targetTeam = this.ability.GetAbilityTargetTeam(1);
        this.targetType = this.ability.GetAbilityTargetType(1);
        this.targetFlags = this.ability.GetAbilityTargetFlags(1);
    }

    override OnRefresh(): void {
        this.auraRadius = this.ability.GetSpecialValueFor("aura_radius");
    }
}

@registerModifier()
export class modiifer_item_vladmir_custom_aura_buff extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    armorAura!: number;
    manaRegenAura!: number;
    lifestealAura!: number;
    damageAura!: number;
    bonusDamage = 0;
    damageAuraPct!: number;
    damageAuraPerLevel!: number;
    manaRegenAuraPerLevel!: number;

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
    override RemoveOnDeath() {
        return true;
    }

    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.PHYSICAL_ARMOR_BONUS,
            ModifierFunction.MANA_REGEN_CONSTANT,
            ModifierFunction.PREATTACK_BONUS_DAMAGE,
            ModifierFunction.MOUNTAIN_LIFESTEAL,
            ModifierFunction.TOOLTIP
        ];
    }

    GetModifierPhysicalArmorBonus(): number {
        return this.armorAura;
    }

    GetModifierConstantManaRegen(): number {
        return this.manaRegenAura + (this.ability.GetLevel() - 1) * this.manaRegenAura;
    }

    GetModifierPreAttack_BonusDamage(): number {
        return this.bonusDamage;
    }

    GetModifierLifesteal(kv: ModifierAttackEvent): number {
        if (kv.attacker != this.parent) {
            return 0;
        }

        return this.lifestealAura;
    }

    OnTooltip(): number {
        return this.lifestealAura;
    }

    override OnCreated(): void {
        this.OnRefresh();

        if (!IsServer()) {
            return;
        }
        this.SetHasCustomTransmitterData(true);
        this.StartIntervalThink(FrameTime());
    }

    override OnRefresh(): void {
        this.armorAura = this.ability.GetSpecialValueFor("armor_aura");
        this.manaRegenAura = this.ability.GetSpecialValueFor("mana_regen_aura");
        this.lifestealAura = this.ability.GetSpecialValueFor("lifesteal_aura");
        this.damageAura = this.ability.GetSpecialValueFor("damage_aura");
        this.damageAuraPct = this.ability.GetSpecialValueFor("damage_aura_pct") / 100;

        this.damageAuraPerLevel = this.ability.GetSpecialValueFor("damage_aura_per_level");
        this.manaRegenAuraPerLevel = this.ability.GetSpecialValueFor("mana_regen_aura_per_level");
    }

    OnIntervalThink(): void {
        this.bonusDamage =
            this.damageAura + (this.ability.GetLevel() - 1) * this.damageAuraPerLevel + this.damageAuraPct * this.parent.GetBaseDamageMax();
        this.SendBuffRefreshToClients();
    }

    AddCustomTransmitterData() {
        return {
            bonusDamage: this.bonusDamage
        };
    }

    HandleCustomTransmitterData(data: ReturnType<this["AddCustomTransmitterData"]>): void {
        this.bonusDamage = data.bonusDamage;
    }
}

@registerModifier()
export class modiifer_item_vladmir_custom_active extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    bonusDamage = 0;
    bonusHealth = 0;
    bonusMana = 0;
    bonusAttackSpeed = 0;
    bonusMoveSpeed = 0;
    bonusArmor = 0;

    // Modifier specials

    override IsHidden() {
        return false;
    }
    override IsDebuff() {
        return false;
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
        return [
            ModifierFunction.MANA_BONUS,
            ModifierFunction.HEALTH_BONUS,
            ModifierFunction.PREATTACK_BONUS_DAMAGE,
            ModifierFunction.PHYSICAL_ARMOR_BONUS,
            ModifierFunction.MOVESPEED_BONUS_CONSTANT,
            ModifierFunction.ATTACKSPEED_BONUS_CONSTANT
        ];
    }

    GetModifierPhysicalArmorBonus(): number {
        return this.bonusArmor;
    }

    GetModifierPreAttack_BonusDamage(): number {
        return this.bonusDamage;
    }

    GetModifierManaBonus(): number {
        return this.bonusMana;
    }

    GetModifierHealthBonus(): number {
        return this.bonusHealth;
    }

    GetModifierMoveSpeedBonus_Constant(): number {
        return this.bonusMoveSpeed;
    }

    GetModifierAttackSpeedBonus_Constant(): number {
        return this.bonusAttackSpeed;
    }

    override OnCreated(kv: item_vladmir_custom_data): void {
        this.OnRefresh(kv);
        if (!IsServer()) {
            return;
        }
        this.SetHasCustomTransmitterData(true);
        this.StartIntervalThink(FrameTime());
    }

    override OnRefresh(kv: item_vladmir_custom_data): void {
        if (!IsServer()) {
            return;
        }

        this.bonusDamage = kv.bonusDamage;
        this.bonusHealth = kv.bonusHealth;
        this.bonusMana = kv.bonusMana;
        this.bonusAttackSpeed = kv.bonusAttackSpeed;
        this.bonusMoveSpeed = kv.bonusMoveSpeed;
        this.bonusArmor = kv.bonusArmor;
    }

    OnIntervalThink(): void {
        this.bonusArmor += 0.01;
        this.SendBuffRefreshToClients();
        this.parent.CalculateGenericBonuses();
        this.bonusArmor -= 0.01;
    }

    AddCustomTransmitterData() {
        return {
            bonusDamage: this.bonusDamage,
            bonusHealth: this.bonusHealth,
            bonusMana: this.bonusMana,
            bonusAttackSpeed: this.bonusAttackSpeed,
            bonusMoveSpeed: this.bonusMoveSpeed,
            bonusArmor: this.bonusArmor
        };
    }

    HandleCustomTransmitterData(data: ReturnType<this["AddCustomTransmitterData"]>): void {
        this.bonusDamage = data.bonusDamage;
        this.bonusHealth = data.bonusHealth;
        this.bonusMana = data.bonusMana;
        this.bonusAttackSpeed = data.bonusAttackSpeed;
        this.bonusMoveSpeed = data.bonusMoveSpeed;
        this.bonusArmor = data.bonusArmor;
    }
}
