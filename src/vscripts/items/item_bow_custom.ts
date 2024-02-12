import { BaseItem, registerAbility } from "../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../libraries/dota_ts_adapter";

@registerAbility()
export class item_bow_custom extends BaseItem {
    GetIntrinsicModifierName(): string {
        return modifier_item_bow_custom.name;
    }

    OnProjectileHit(target: CDOTA_BaseNPC | undefined): boolean | void {
        if (target == undefined) {
            return;
        }

        const caster = this.GetCaster();

        ApplyDamage({
            victim: target,
            attacker: caster,
            damage: (caster.GetAverageTrueAttackDamage(target) * this.GetSpecialValueFor("damage_percent")) / 100,
            damage_type: this.GetAbilityDamageType(),
            damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION,
            ability: this
        });
    }
}

@registerModifier()
export class modifier_item_bow_custom extends BaseModifier {
    // Modifier properties
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    bonusDamage!: number;
    bonusAll!: number;
    bonusAttackRange!: number;
    radius!: number;
    bonusDamagePerLevel!: number;
    bonusAllPerLevel!: number;
    targetTeam!: UnitTargetTeam;
    targetType!: UnitTargetType;
    targetFlags!: UnitTargetFlags;
    projectile!: CreateTrackingProjectileOptions;

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
            ModifierFunction.ON_ATTACK,
            ModifierFunction.ATTACK_RANGE_BONUS,
            ModifierFunction.STATS_STRENGTH_BONUS,
            ModifierFunction.STATS_AGILITY_BONUS,
            ModifierFunction.STATS_INTELLECT_BONUS
        ];
    }

    GetModifierPreAttack_BonusDamage(): number {
        return this.bonusDamage + (this.ability.GetLevel() - 1) * this.bonusDamagePerLevel;
    }

    GetModifierBonusStats_Strength(): number {
        return this.bonusAll + (this.ability.GetLevel() - 1) * this.bonusAllPerLevel;
    }

    GetModifierBonusStats_Agility(): number {
        return this.bonusAll + (this.ability.GetLevel() - 1) * this.bonusAllPerLevel;
    }

    GetModifierBonusStats_Intellect(): number {
        return this.bonusAll + (this.ability.GetLevel() - 1) * this.bonusAllPerLevel;
    }

    GetModifierAttackRangeBonus(): number {
        if (this.parent.IsRangedAttacker()) {
            return this.bonusAttackRange;
        }
        return 0;
    }

    override OnCreated(): void {
        this.OnRefresh();

        if (!IsServer()) {
            return;
        }

        this.targetTeam = this.ability.GetAbilityTargetTeam();
        this.targetType = this.ability.GetAbilityTargetType();
        this.targetFlags = this.ability.GetAbilityTargetFlags();

        this.projectile = {
            EffectName: undefined,
            Ability: this.ability,
            iMoveSpeed: undefined,
            Source: this.parent,
            Target: undefined,
            iSourceAttachment: ProjectileAttachment.HITLOCATION
        };
    }

    override OnRefresh(): void {
        this.bonusAll = this.ability.GetSpecialValueFor("bonus_all");
        this.bonusDamage = this.ability.GetSpecialValueFor("bonus_damage");
        this.bonusAttackRange = this.ability.GetSpecialValueFor("bonus_attack_range");
        this.radius = this.ability.GetSpecialValueFor("radius");

        this.bonusDamagePerLevel = this.ability.GetSpecialValueFor("bonus_damage_per_level");
        this.bonusAllPerLevel = this.ability.GetSpecialValueFor("bonus_all_per_level");
    }

    OnAttack(kv: ModifierAttackEvent): void {
        if (kv.attacker != this.parent || kv.attacker.IsIllusion()) {
            return;
        }

        if (kv.target.HasModifier("modifier_physical_resistance")) {
            return;
        }

        if (kv.no_attack_cooldown) {
            return;
        }

        if (
            UnitFilter(kv.target, this.targetTeam, this.targetType, this.targetFlags, this.parent.GetTeamNumber()) !=
            UnitFilterResult.SUCCESS
        ) {
            return;
        }

        if (kv.attacker.GetAttackCapability() != UnitAttackCapability.RANGED_ATTACK) {
            return;
        }

        const enemies = FindUnitsInRadius(
            this.parent.GetTeamNumber(),
            kv.target.GetAbsOrigin(),
            undefined,
            this.radius,
            this.targetTeam,
            this.targetType,
            this.targetFlags,
            FindOrder.ANY,
            false
        );

        this.projectile.iMoveSpeed = this.parent.GetProjectileSpeed();
        this.projectile.EffectName = this.parent.GetRangedProjectileName();
        this.projectile.Source = kv.attacker;

        enemies.forEach((target) => {
            if (target != kv.target) {
                this.projectile.Target = target;
                ProjectileManager.CreateTrackingProjectile(this.projectile);
            }
        });
    }
}
