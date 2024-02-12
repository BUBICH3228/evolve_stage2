import { BaseItem, registerAbility } from "../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../libraries/dota_ts_adapter";

@registerAbility()
export class item_blade_mail_custom extends BaseItem {
    GetIntrinsicModifierName(): string {
        return modifier_item_blade_mail_custom.name;
    }
    override OnSpellStart(): void {
        const caster = this.GetParent() as CDOTA_BaseNPC_Hero;
        caster.AddNewModifier(caster, this, modifier_item_blade_mail_custom_reflect.name, { duration: this.GetDuration() });
        EmitSoundOn("DOTA_Item.BladeMail.Activate", caster);
    }
}

@registerModifier()
export class modifier_item_blade_mail_custom extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    bonusDamage!: number;
    bonusDamagePerLevel!: number;
    bonusArmor!: number;
    targetTeam!: UnitTargetTeam;
    targetType!: UnitTargetType;
    targetFlags!: UnitTargetFlags;
    damageTable!: ApplyDamageOptions;
    passiveReflectionConstant!: number;
    passiveReflectionPct!: number;
    activeReflectionPct!: number;
    passiveReflectionConstantPerLevel!: number;

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
        return [ModifierFunction.PREATTACK_BONUS_DAMAGE, ModifierFunction.PHYSICAL_ARMOR_BONUS, ModifierFunction.ON_TAKEDAMAGE];
    }

    GetModifierPreAttack_BonusDamage(): number {
        return this.bonusDamage + (this.ability.GetLevel() - 1) * this.bonusDamagePerLevel;
    }

    GetModifierPhysicalArmorBonus(): number {
        return this.bonusArmor;
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
            attacker: this.parent,
            damage: 0,
            ability: this.ability,
            damage_type: DamageTypes.NONE,
            damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION + DamageFlag.REFLECTION + DamageFlag.NO_SPELL_LIFESTEAL
        };
    }

    override OnRefresh(): void {
        this.bonusDamage = this.ability.GetSpecialValueFor("bonus_damage");
        this.bonusArmor = this.ability.GetSpecialValueFor("bonus_armor");
        this.passiveReflectionConstant = this.ability.GetSpecialValueFor("passive_reflection_constant");
        this.passiveReflectionPct = this.ability.GetSpecialValueFor("passive_reflection_pct") / 100;
        this.activeReflectionPct = this.ability.GetSpecialValueFor("active_reflection_pct") / 100;

        this.bonusDamagePerLevel = this.ability.GetSpecialValueFor("bonus_damage_per_level");
        this.passiveReflectionConstantPerLevel = this.ability.GetSpecialValueFor("passive_reflection_constant_per_level");
    }

    OnTakeDamage(kv: ModifierInstanceEvent): void {
        if (kv.attacker == this.parent) {
            return;
        }

        if (
            UnitFilter(kv.attacker, this.targetTeam, this.targetType, this.targetFlags, this.caster.GetTeamNumber()) !=
            UnitFilterResult.SUCCESS
        ) {
            return;
        }
        let reflectionPct = this.passiveReflectionPct;
        if (this.parent.HasModifier(modifier_item_blade_mail_custom_reflect.name)) {
            reflectionPct += this.activeReflectionPct;
        }
        this.damageTable.victim = kv.attacker;
        this.damageTable.damage_type = kv.damage_type;
        this.damageTable.damage =
            this.passiveReflectionConstant +
            (this.ability.GetLevel() - 1) * this.passiveReflectionConstantPerLevel +
            reflectionPct * kv.original_damage;
        ApplyDamage(this.damageTable);
    }
}

@registerModifier()
export class modifier_item_blade_mail_custom_reflect extends BaseModifier {
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

    GetEffectName(): string {
        return "particles/items_fx/blademail.vpcf";
    }
}
