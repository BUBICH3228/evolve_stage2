import { BaseItem, registerAbility } from "../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../libraries/dota_ts_adapter";

@registerAbility()
export class item_khanda_custom extends BaseItem {
    GetIntrinsicModifierName(): string {
        return modifier_item_khanda_custom.name;
    }

    GetCooldown(level: number): number {
        return math.max(
            super.GetCooldown(level) - (this.GetLevel() - 1) * this.GetSpecialValueFor("ability_duration_per_level"),
            this.GetSpecialValueFor("ability_duration_min")
        );
    }
}

@registerModifier()
export class modifier_item_khanda_custom extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    bonusDamage!: number;
    bonusMana!: number;
    bonusAllStats!: number;
    bonusHealth!: number;
    critMultiplier!: number;
    critChance!: number;
    spellCritMultiplier!: number;
    spellCritFlat!: number;
    slowDuration!: number;
    targetType!: UnitTargetType;
    targetTeam!: UnitTargetTeam;
    targetFlags!: UnitTargetFlags;
    damageTable!: ApplyDamageOptions;
    bonusAllStatsPerLevel!: number;

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
            ModifierFunction.PREATTACK_BONUS_DAMAGE,
            ModifierFunction.MANA_BONUS,
            ModifierFunction.HEALTH_BONUS,
            ModifierFunction.STATS_AGILITY_BONUS,
            ModifierFunction.STATS_STRENGTH_BONUS,
            ModifierFunction.STATS_INTELLECT_BONUS,
            ModifierFunction.PREATTACK_CRITICALSTRIKE,
            ModifierFunction.ON_TAKEDAMAGE
        ];
    }

    GetModifierPreAttack_BonusDamage(): number {
        return this.bonusDamage;
    }

    GetModifierBonusStats_Agility(): number {
        return this.bonusAllStats + (this.ability.GetLevel() - 1) * this.bonusAllStatsPerLevel;
    }

    GetModifierBonusStats_Strength(): number {
        return this.bonusAllStats + (this.ability.GetLevel() - 1) * this.bonusAllStatsPerLevel;
    }

    GetModifierBonusStats_Intellect(): number {
        return this.bonusAllStats + (this.ability.GetLevel() - 1) * this.bonusAllStatsPerLevel;
    }

    GetModifierHealthBonus(): number {
        return this.bonusHealth;
    }

    GetModifierManaBonus(): number {
        return this.bonusMana;
    }

    override OnCreated(): void {
        this.OnRefresh();
        if (!IsServer()) {
            return;
        }

        this.targetTeam = this.ability.GetAbilityTargetTeam();
        this.targetType = this.ability.GetAbilityTargetType();
        this.targetFlags = this.ability.GetAbilityTargetFlags();

        this.damageTable = {
            victim: undefined,
            attacker: this.caster,
            damage: 0,
            ability: this.ability,
            damage_type: this.ability.GetAbilityDamageType(),
            damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION
        };
    }

    override OnRefresh(): void {
        this.bonusDamage = this.ability.GetSpecialValueFor("bonus_damage");
        this.bonusMana = this.ability.GetSpecialValueFor("bonus_mana");
        this.bonusAllStats = this.ability.GetSpecialValueFor("bonus_all_stats");
        this.bonusHealth = this.ability.GetSpecialValueFor("bonus_health");
        this.critMultiplier = this.ability.GetSpecialValueFor("crit_multiplier");
        this.critChance = this.ability.GetSpecialValueFor("crit_chance");
        this.spellCritMultiplier = this.ability.GetSpecialValueFor("spell_crit_multiplier") / 100;
        this.spellCritFlat = this.ability.GetSpecialValueFor("spell_crit_flat");
        this.slowDuration = this.ability.GetSpecialValueFor("slow_duration");

        this.bonusAllStatsPerLevel = this.ability.GetSpecialValueFor("bonus_all_stats_per_level");
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

        return this.critMultiplier;
    }

    OnTakeDamage(kv: ModifierInstanceEvent): void {
        if (kv.inflictor?.IsItem()) {
            return;
        }

        if (this.ability.IsCooldownReady() == false) {
            return;
        }

        if (this.parent == kv.unit) {
            return;
        }

        if (this.parent != kv.attacker) {
            return;
        }

        if (kv.damage_category != DamageCategory.SPELL) {
            return;
        }

        if (
            UnitFilter(kv.unit, this.targetTeam, this.targetType, this.targetFlags, this.parent.GetTeamNumber()) != UnitFilterResult.SUCCESS
        ) {
            return;
        }

        const pfx = ParticleManager.CreateParticle("particles/items_fx/phylactery.vpcf", ParticleAttachment.ABSORIGIN, this.parent);
        ParticleManager.SetParticleControlEnt(
            pfx,
            0,
            this.parent,
            ParticleAttachment.POINT_FOLLOW,
            ParticleAttachmentLocation.ATTACK1,
            this.parent.GetAbsOrigin(),
            false
        );
        ParticleManager.SetParticleControlEnt(
            pfx,
            1,
            kv.unit!,
            ParticleAttachment.POINT_FOLLOW,
            ParticleAttachmentLocation.HITLOC,
            kv.unit!.GetAbsOrigin(),
            false
        );

        this.parent.EmitSound("MountainItem.Khanda.Proc");

        kv.unit.AddNewModifier(this.parent, this.ability, modifier_item_khanda_custom_debuff.name, {
            duration: this.slowDuration * (1 - kv.unit.GetStatusResistance())
        });
        this.damageTable.damage =
            this.spellCritFlat * (this.parent.GetSpellAmplification(false) + 1) + this.parent.GetMaxHealth() * this.spellCritMultiplier;
        this.damageTable.victim = kv.unit;
        ApplyDamage(this.damageTable);

        this.ability.UseResources(false, false, false, true);
    }
}

@registerModifier()
export class modifier_item_khanda_custom_debuff extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    slow!: number;

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
        return [ModifierFunction.MOVESPEED_BONUS_PERCENTAGE];
    }

    GetModifierMoveSpeedBonus_Percentage(): number {
        return this.slow;
    }

    override OnCreated(): void {
        this.OnRefresh();
    }

    override OnRefresh(): void {
        this.slow = -1 * this.ability.GetSpecialValueFor("slow");
    }
}
