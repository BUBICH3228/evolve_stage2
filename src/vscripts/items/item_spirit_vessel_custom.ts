import { BaseItem, registerAbility } from "../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../libraries/dota_ts_adapter";

@registerAbility()
export class item_spirit_vessel_custom extends BaseItem {
    GetIntrinsicModifierName(): string {
        return modifier_item_spirit_vessel_custom.name;
    }

    GetHealthCost(): number {
        const caster = this.GetCaster();
        const stacks = caster.GetModifierStackCount(modifier_item_spirit_vessel_custom.name, caster);
        return stacks;
    }
    override OnSpellStart(): void {
        const caster = this.GetCaster();
        const target = this.GetCursorTarget();

        if (target == undefined) {
            return;
        }

        if (target.GetTeamNumber() != caster.GetTeamNumber()) {
            if (target.TriggerSpellAbsorb(this)) {
                return;
            }
            target.AddNewModifier(caster, this, modifier_item_spirit_vessel_custom_damage.name, { duration: this.GetDuration() });
        } else {
            target.AddNewModifier(caster, this, modifier_item_spirit_vessel_custom_heal.name, { duration: this.GetDuration() });
        }

        EmitSoundOn("MountainItem.SpiritVessel.Cast", caster);
        this.SetCurrentCharges(this.GetCurrentAbilityCharges() - 1);
    }
}

@registerModifier()
export class modifier_item_spirit_vessel_custom extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    bonusAllStats!: number;
    bonusManaRegen!: number;
    bonusArmor!: number;
    bonusHealth!: number;
    targetTeam!: UnitTargetTeam;
    targetType!: UnitTargetType;
    targetFlags!: UnitTargetFlags;
    soulRadius!: number;
    killsForCharge!: number;
    bonusArnorPerLevel!: number;
    bonusManaRegenPerLevel!: number;

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
        return [
            ModifierFunction.STATS_AGILITY_BONUS,
            ModifierFunction.STATS_STRENGTH_BONUS,
            ModifierFunction.STATS_INTELLECT_BONUS,
            ModifierFunction.PHYSICAL_ARMOR_BONUS,
            ModifierFunction.HEALTH_BONUS,
            ModifierFunction.ON_DEATH
        ];
    }

    GetModifierBonusStats_Agility(): number {
        return this.bonusAllStats;
    }

    GetModifierBonusStats_Strength(): number {
        return this.bonusAllStats;
    }

    GetModifierBonusStats_Intellect(): number {
        return this.bonusAllStats;
    }

    GetModifierHealthBonus(): number {
        return this.bonusHealth;
    }

    GetModifierPhysicalArmorBonus(): number {
        return this.bonusArmor + (this.ability.GetLevel() - 1) * this.bonusArnorPerLevel;
    }

    GetModifierConstantManaRegen(): number {
        return this.bonusManaRegen + (this.ability.GetLevel() - 1) * this.bonusManaRegenPerLevel;
    }

    override OnCreated(): void {
        this.OnRefresh();

        if (!IsServer()) {
            return;
        }

        this.targetTeam = this.ability.GetAbilityTargetTeam(1);
        this.targetType = this.ability.GetAbilityTargetType(1);
        this.targetFlags = this.ability.GetAbilityTargetFlags(1);
    }

    override OnRefresh(): void {
        this.bonusManaRegen = this.ability.GetSpecialValueFor("bonus_mana_regen");
        this.bonusAllStats = this.ability.GetSpecialValueFor("bonus_all_stats");
        this.bonusArmor = this.ability.GetSpecialValueFor("bonus_armor");
        this.bonusHealth = this.ability.GetSpecialValueFor("bonus_health");
        this.soulRadius = this.ability.GetSpecialValueFor("soul_radius");
        this.killsForCharge = this.ability.GetSpecialValueFor("kills_for_charge");

        this.bonusArnorPerLevel = this.ability.GetSpecialValueFor("bonus_arnor_per_level");
        this.bonusManaRegenPerLevel = this.ability.GetSpecialValueFor("bonus_mana_regen_per_level");
    }

    OnDeath(kv: ModifierInstanceEvent): void {
        if (this.parent == kv.unit) {
            return;
        }

        if (CalculateDistance(kv.unit, this.parent) > this.soulRadius) {
            return;
        }

        if (
            UnitFilter(
                kv.unit,
                UnitTargetTeam.ENEMY,
                UnitTargetType.HERO + UnitTargetType.BASIC,
                UnitTargetFlags.DEAD,
                this.parent.GetTeamNumber()
            ) != UnitFilterResult.SUCCESS
        ) {
            return;
        }

        const enemies = FindUnitsInRadius(
            this.parent.GetTeamNumber(),
            kv.unit.GetAbsOrigin(),
            undefined,
            CalculateDistance(kv.unit, this.parent),
            this.targetTeam,
            this.targetType,
            this.targetFlags,
            FindOrder.ANY,
            false
        );

        if (enemies.length != 0) {
            enemies.forEach((target) => {
                if (target.FindItemInInventory("item_spirit_vessel_custom") != undefined && target != this.parent) {
                    return;
                }
            });
        }

        this.IncrementStackCount();

        if (this.GetStackCount() == this.killsForCharge) {
            (this.ability as BaseItem).SetCurrentCharges(this.ability.GetCurrentAbilityCharges() + 1);
            this.SetStackCount(0);
        }
    }
}

@registerModifier()
export class modifier_item_spirit_vessel_custom_damage extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    soulDamageAmount!: number;
    hpRegenReductionEnemy!: number;
    enemyHpDrain!: number;
    damageTable!: ApplyDamageOptions;

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
    override RemoveOnDeath() {
        return true;
    }

    GetEffectName(): string {
        return "particles/items4_fx/spirit_vessel_damage.vpcf";
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.HP_REGEN_AMPLIFY_PERCENTAGE, ModifierFunction.TOOLTIP, ModifierFunction.TOOLTIP2];
    }

    GetModifierHPRegenAmplify_Percentage(): number {
        return this.hpRegenReductionEnemy;
    }

    OnTooltip(): number {
        return this.soulDamageAmount;
    }

    OnTooltip2(): number {
        return this.enemyHpDrain * 100;
    }

    override OnCreated(): void {
        this.OnRefresh();

        if (!IsServer()) {
            return;
        }

        EmitSoundOn("MountainItem.SpiritVessel.CastEnemy", this.parent);

        this.damageTable = {
            victim: this.parent,
            attacker: this.caster,
            damage: 0,
            ability: this.ability,
            damage_type: this.ability.GetAbilityDamageType(),
            damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION
        };

        this.StartIntervalThink(1);
    }

    override OnRefresh(): void {
        this.soulDamageAmount = this.ability.GetSpecialValueFor("soul_damage_amount");
        this.hpRegenReductionEnemy = -1 * this.ability.GetSpecialValueFor("hp_regen_reduction_enemy");
        this.enemyHpDrain = this.ability.GetSpecialValueFor("enemy_hp_drain") / 100;
    }

    OnIntervalThink(): void {
        this.damageTable.damage =
            this.soulDamageAmount * (this.caster.GetSpellAmplification(false) + 1) + this.parent.GetHealth() * this.enemyHpDrain;
        ApplyDamage(this.damageTable);
    }
}

@registerModifier()
export class modifier_item_spirit_vessel_custom_heal extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    soulHealAmount!: number;
    manaRegenMultiplier!: number;

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

    GetEffectName(): string {
        return "particles/items4_fx/spirit_vessel_heal.vpcf";
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.HEALTH_REGEN_CONSTANT, ModifierFunction.MANA_REGEN_TOTAL_PERCENTAGE];
    }

    GetModifierConstantHealthRegen(): number {
        return this.soulHealAmount;
    }

    override OnCreated(): void {
        this.OnRefresh();
        EmitSoundOn("MountainItem.SpiritVessel.CastAlly", this.parent);
    }

    GetModifierTotalPercentageManaRegen(): number {
        return this.manaRegenMultiplier;
    }

    override OnRefresh(): void {
        this.soulHealAmount = this.ability.GetSpecialValueFor("soul_heal_amount");
        this.manaRegenMultiplier = this.ability.GetSpecialValueFor("mana_regen_multiplier") / 100;
    }
}
