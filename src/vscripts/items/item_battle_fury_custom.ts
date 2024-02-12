import { BaseItem, registerAbility } from "../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../libraries/dota_ts_adapter";

@registerAbility()
export class item_battle_fury_custom extends BaseItem {
    GetIntrinsicModifierName(): string {
        return modifier_item_battle_fury_custom.name;
    }

    override OnSpellStart(): void {
        const target = this.GetCursorTarget()!;
        const spawnPoint = target.GetAbsOrigin();

        const newItem = CreateItem(GameSettings.GetSettingValueAsString("item_drop_tree"), undefined, undefined)!;
        CreateItemOnPositionForLaunch(spawnPoint, newItem);
        newItem.LaunchLootInitialHeight(false, 0, 150, 0.5, (spawnPoint + RandomVector(RandomFloat(50, 100))) as Vector);
        GridNav.DestroyTreesAroundPoint(spawnPoint, 1, false);
    }
}

@registerModifier()
export class modifier_item_battle_fury_custom extends BaseModifier {
    // Modifier properties
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    bonusHealthRegen!: number;
    bonusDamage!: number;
    bonusManaRegen!: number;
    quellingBonus!: number;
    cleaveDamagePercentCreep!: number;
    cleaveStartingWidth!: number;
    cleaveEndingwidth!: number;
    cleaveDistance!: number;
    targetTeam!: UnitTargetTeam;
    targetType!: UnitTargetType;
    targetFlags!: UnitTargetFlags;
    cleaveDamagePercentCreepPerLevel!: number;
    bonusDamagePerLevel!: number;
    bonusAttackRangeMelee!: number;

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
            ModifierFunction.HEALTH_REGEN_CONSTANT,
            ModifierFunction.MANA_REGEN_CONSTANT,
            ModifierFunction.ON_TAKEDAMAGE,
            ModifierFunction.PROCATTACK_BONUS_DAMAGE_PHYSICAL,
            ModifierFunction.ATTACK_RANGE_BONUS
        ];
    }

    GetModifierPreAttack_BonusDamage(): number {
        return this.bonusDamage + (this.ability.GetLevel() - 1) * this.bonusDamagePerLevel;
    }

    GetModifierConstantHealthRegen(): number {
        return this.bonusHealthRegen;
    }

    GetModifierConstantManaRegen(): number {
        return this.bonusManaRegen;
    }

    GetModifierAttackRangeBonus(): number {
        if (this.parent.IsRangedAttacker()) {
            return 0;
        } else {
            return this.bonusAttackRangeMelee;
        }
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
        this.bonusHealthRegen = this.ability.GetSpecialValueFor("bonus_health_regen");
        this.bonusDamage = this.ability.GetSpecialValueFor("bonus_damage");
        this.bonusManaRegen = this.ability.GetSpecialValueFor("bonus_mana_regen");
        this.quellingBonus = this.ability.GetSpecialValueFor("quelling_bonus");
        this.cleaveDamagePercentCreep = this.ability.GetSpecialValueFor("cleave_damage_percent_creep") / 100;
        this.cleaveStartingWidth = this.ability.GetSpecialValueFor("cleave_starting_width");
        this.cleaveEndingwidth = this.ability.GetSpecialValueFor("cleave_ending_width");
        this.cleaveDistance = this.ability.GetSpecialValueFor("cleave_distance");
        this.bonusAttackRangeMelee = this.ability.GetSpecialValueFor("bonus_attack_range_melee");

        this.bonusDamagePerLevel = this.ability.GetSpecialValueFor("bonus_damage_per_level");
        this.cleaveDamagePercentCreepPerLevel = this.ability.GetSpecialValueFor("cleave_damage_percent_creep_per_level") / 100;
    }

    GetModifierProcAttack_BonusDamage_Physical(kv: ModifierAttackEvent): number {
        if (kv.attacker != this.parent) {
            return 0;
        }

        if (
            UnitFilter(kv.target, this.targetTeam, this.targetType, this.targetFlags, this.parent.GetTeamNumber()) !=
            UnitFilterResult.SUCCESS
        ) {
            return 0;
        }

        return this.quellingBonus;
    }

    OnTakeDamage(kv: ModifierInstanceEvent): void {
        if (kv.attacker != this.parent || kv.attacker.IsIllusion()) {
            return;
        }

        if (kv.damage_category != DamageCategory.ATTACK) {
            return;
        }

        if (kv.no_attack_cooldown) {
            return;
        }

        if (
            UnitFilter(kv.unit, this.targetTeam, this.targetType, this.targetFlags, this.parent.GetTeamNumber()) != UnitFilterResult.SUCCESS
        ) {
            return;
        }

        if (kv.attacker.GetAttackCapability() != UnitAttackCapability.MELEE_ATTACK) {
            return;
        }

        DoCleaveAttack(
            this.parent,
            kv.unit,
            this.ability,
            kv.damage * (this.cleaveDamagePercentCreep + (this.ability.GetLevel() - 1) * this.cleaveDamagePercentCreepPerLevel),
            this.cleaveStartingWidth,
            this.cleaveEndingwidth,
            this.cleaveDistance,
            "particles/items_fx/battlefury_cleave.vpcf"
        );
    }
}
