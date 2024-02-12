import { BaseItem, registerAbility } from "../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../libraries/dota_ts_adapter";

@registerAbility()
export class item_parasma_custom extends BaseItem {
    GetIntrinsicModifierName(): string {
        return modifier_item_parasma_custom.name;
    }
}

@registerModifier()
export class modifier_item_parasma_custom extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    bonusIntellect!: number;
    bonusAttackSpeed!: number;
    bonusArmor!: number;
    bonusManaRegen!: number;
    bonusProjectileSpeed!: number;
    procs: boolean[] | undefined[] = [];
    isProc!: boolean;
    targetTeam!: UnitTargetTeam;
    targetType!: UnitTargetType;
    targetFlags!: UnitTargetFlags;
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
    override RemoveOnDeath() {
        return false;
    }

    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.STATS_INTELLECT_BONUS,
            ModifierFunction.ATTACKSPEED_BONUS_CONSTANT,
            ModifierFunction.PHYSICAL_ARMOR_BONUS,
            ModifierFunction.MANA_REGEN_CONSTANT,
            ModifierFunction.PROJECTILE_SPEED_BONUS,
            ModifierFunction.ON_ATTACK_RECORD,
            ModifierFunction.ON_ATTACK_RECORD_DESTROY,
            ModifierFunction.ON_ATTACK_LANDED
        ];
    }

    CheckState(): Partial<Record<ModifierState, boolean>> {
        return {
            [ModifierState.CANNOT_MISS]: this.IsProc()
        };
    }

    GetModifierBonusStats_Intellect(): number {
        return this.bonusIntellect;
    }

    GetModifierAttackSpeedBonus_Constant(): number {
        return this.bonusAttackSpeed;
    }

    GetModifierPhysicalArmorBonus(): number {
        return this.bonusArmor + (this.ability.GetLevel() - 1) * this.bonusArmorPerLevel;
    }

    GetModifierConstantManaRegen(): number {
        return this.bonusManaRegen;
    }

    GetModifierProjectileSpeedBonus(): number {
        return this.bonusProjectileSpeed;
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
        this.bonusIntellect = this.ability.GetSpecialValueFor("bonus_intellect");
        this.bonusAttackSpeed = this.ability.GetSpecialValueFor("bonus_attack_speed");
        this.bonusArmor = this.ability.GetSpecialValueFor("bonus_armor");
        this.bonusManaRegen = this.ability.GetSpecialValueFor("bonus_mana_regen");
        this.bonusProjectileSpeed = this.ability.GetSpecialValueFor("bonus_projectile_speed");

        this.bonusArmorPerLevel = this.ability.GetSpecialValueFor("bonus_armor_per_level");
    }

    OnAttackRecord(kv: ModifierAttackEvent): void {
        if (kv.attacker != this.parent) {
            return;
        }

        this.SetIsProc(false);

        if (!this.ability.IsCooldownReady()) {
            return;
        }

        this.SetIsProc(true);

        this.procs[kv.record] = true;
    }

    OnAttackRecordDestroy(kv: ModifierAttackEvent): void {
        if (this.procs[kv.record] == undefined) {
            return;
        }

        this.procs[kv.record] = undefined;
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

        kv.target.AddNewModifier(this.parent, this.ability, modifier_item_parasma_custom_magic_corruption_debuff.name, {
            duration: this.ability.GetDuration() * (1 - kv.target.GetStatusResistance())
        });

        if (this.procs[kv.record] == undefined) {
            return;
        }

        kv.target.AddNewModifier(this.parent, this.ability, modifier_item_parasma_custom_witch_blade_debuff.name, {
            duration: this.ability.GetDuration() * (1 - kv.target.GetStatusResistance())
        });

        this.ability.UseResources(false, false, false, true);
    }

    SetIsProc(value: boolean) {
        this.isProc = value;
    }

    IsProc(): boolean {
        return this.isProc || false;
    }
}

@registerModifier()
export class modifier_item_parasma_custom_witch_blade_debuff extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC_Hero = this.GetCaster()! as CDOTA_BaseNPC_Hero;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();

    damageTable!: ApplyDamageOptions;
    intDamagePct!: number;
    slow!: number;
    flatDamage!: number;
    flatDamagePerLevel!: number;

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

    GetEffectName(): string {
        return "particles/items3_fx/witch_blade_debuff.vpcf";
    }

    GetEffectAttachType(): ParticleAttachment {
        return ParticleAttachment.ABSORIGIN;
    }

    override OnCreated(): void {
        this.OnRefresh();

        if (!IsServer()) {
            return;
        }

        this.damageTable = {
            victim: this.parent,
            attacker: this.caster,
            damage: 0,
            ability: this.ability,
            damage_type: this.ability.GetAbilityDamageType(),
            damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION
        };
        this.parent.EmitSound("MountainItem.Parasma.Proc");
        this.StartIntervalThink(1);
    }

    override OnRefresh(): void {
        this.flatDamage = this.ability.GetSpecialValueFor("flat_damage");
        this.intDamagePct = this.ability.GetSpecialValueFor("int_damage_pct") / 100;
        this.slow = -1 * this.ability.GetSpecialValueFor("slow");

        this.flatDamagePerLevel = this.ability.GetSpecialValueFor("flat_damage_per_level");
    }

    OnIntervalThink(): void {
        this.damageTable.damage =
            this.caster.GetIntellect() * this.intDamagePct + this.flatDamage + (this.ability.GetLevel() - 1) * this.flatDamagePerLevel;
        ApplyDamage(this.damageTable);

        SendOverheadEventMessage(undefined, OverheadAlert.BONUS_POISON_DAMAGE, this.parent, this.damageTable.damage, undefined);
    }
}

@registerModifier()
export class modifier_item_parasma_custom_magic_corruption_debuff extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    activeMresReduction!: number;

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
        return [ModifierFunction.MAGICAL_RESISTANCE_BONUS];
    }

    GetModifierMagicalResistanceBonus(): number {
        return this.activeMresReduction;
    }

    override OnCreated(): void {
        this.OnRefresh();
    }

    override OnRefresh(): void {
        this.ability = this.GetAbility()!;
        this.activeMresReduction = -1 * this.ability.GetSpecialValueFor("active_mres_reduction");
    }
}
