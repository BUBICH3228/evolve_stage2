import { BaseAbility, registerAbility } from "../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../libraries/dota_ts_adapter";

@registerAbility()
export class item_monkey_king_bar_custom extends BaseAbility {
    // Ability properties
    GetIntrinsicModifierName(): string {
        return modifier_item_monkey_king_bar_custom.name;
    }
}

@registerModifier()
export class modifier_item_monkey_king_bar_custom extends BaseModifier {
    // Modifier properties
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    bonusDamage!: number;
    bonusDamagePerLevel!: number;
    bonusAttackSpeed!: number;
    bonusChance!: number;
    bonusChanceDamage!: number;
    bonusChanceDamagePerLevel!: number;
    targetTeam!: UnitTargetTeam;
    targetType!: UnitTargetType;
    targetFlags!: UnitTargetFlags;
    procs: boolean[] | undefined[] = [];
    isProc!: boolean;

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
            ModifierFunction.PROCATTACK_BONUS_DAMAGE_PURE,
            ModifierFunction.ON_ATTACK_RECORD,
            ModifierFunction.ON_ATTACK_RECORD_DESTROY
        ];
    }

    CheckState(): Partial<Record<ModifierState, boolean>> {
        return {
            [ModifierState.CANNOT_MISS]: this.IsProc()
        };
    }

    GetModifierPreAttack_BonusDamage(): number {
        return this.bonusDamage + (this.ability.GetLevel() - 1) * this.bonusDamagePerLevel;
    }

    GetModifierAttackSpeedBonus_Constant(): number {
        return this.bonusAttackSpeed;
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

    OnRefresh(): void {
        this.bonusDamage = this.ability.GetSpecialValueFor("bonus_damage");
        this.bonusAttackSpeed = this.ability.GetSpecialValueFor("bonus_attack_speed");
        this.bonusChance = this.ability.GetSpecialValueFor("bonus_chance");
        this.bonusChanceDamage = this.ability.GetSpecialValueFor("bonus_chance_damage");

        this.bonusDamagePerLevel = this.ability.GetSpecialValueFor("bonus_damage_per_level");
        this.bonusChanceDamagePerLevel = this.ability.GetSpecialValueFor("bonus_chance_damage_per_level");
    }

    OnAttackRecord(kv: ModifierAttackEvent): void {
        if (kv.attacker != this.parent) {
            return;
        }

        this.SetIsProc(false);

        if (
            UnitFilter(kv.target, this.targetTeam, this.targetType, this.targetFlags, this.parent.GetTeamNumber()) !=
            UnitFilterResult.SUCCESS
        ) {
            return;
        }

        if (RollPseudoRandomPercentage(this.bonusChance, this.ability) == false) {
            return;
        }

        this.SetIsProc(true);

        this.procs[kv.record] = true;
    }

    OnAttackRecordDestroy(kv: ModifierAttackEvent): void {
        if (kv.attacker != this.parent) {
            return;
        }

        this.procs[kv.record] = undefined;
    }

    GetModifierProcAttack_BonusDamage_Pure(kv: ModifierAttackEvent): number {
        if (this.procs[kv.record] == undefined) {
            return 0;
        }
        this.parent.EmitSound("MountainItem.MonkeyKingBar.Proc");
        SendOverheadEventMessage(
            undefined,
            OverheadAlert.BONUS_SPELL_DAMAGE,
            kv.target,
            this.bonusChanceDamage + (this.ability.GetLevel() - 1) * this.bonusChanceDamagePerLevel,
            undefined
        );
        return this.bonusChanceDamage + (this.ability.GetLevel() - 1) * this.bonusChanceDamagePerLevel;
    }

    SetIsProc(value: boolean) {
        this.isProc = value;
    }

    IsProc(): boolean {
        return this.isProc || false;
    }
}
