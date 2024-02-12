import { BaseItem, registerAbility, registerModifier, BaseModifier } from "../libraries/dota_ts_adapter";

@registerAbility()
export class item_echo_sabre_custom extends BaseItem {
    GetIntrinsicModifierName(): string {
        return modifier_item_echo_sabre_custom.name;
    }
}

@registerModifier()
export class modifier_item_echo_sabre_custom extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    bonusAttackSpeedperLevel!: number;
    bonusDamage!: number;
    bonusStrength!: number;
    bonusIntellect!: number;
    bonusAttackSpeed!: number;
    bonusManaRegen!: number;
    isProcDisabled!: boolean;

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
            ModifierFunction.STATS_STRENGTH_BONUS,
            ModifierFunction.STATS_INTELLECT_BONUS,
            ModifierFunction.ATTACKSPEED_BONUS_CONSTANT,
            ModifierFunction.MANA_REGEN_CONSTANT,
            ModifierFunction.ON_ATTACK_LANDED
        ];
    }

    GetModifierPreAttack_BonusDamage(): number {
        return this.bonusDamage;
    }

    GetModifierBonusStats_Strength(): number {
        return this.bonusStrength;
    }

    GetModifierBonusStats_Intellect(): number {
        return this.bonusIntellect;
    }

    GetModifierAttackSpeedBonus_Constant(): number {
        return this.bonusAttackSpeed + (this.ability.GetLevel() - 1) * this.bonusAttackSpeedperLevel;
    }
    override OnCreated(): void {
        this.OnRefresh();
    }

    override OnRefresh(): void {
        this.bonusDamage = this.ability.GetSpecialValueFor("bonus_damage");
        this.bonusStrength = this.ability.GetSpecialValueFor("bonus_strength");
        this.bonusIntellect = this.ability.GetSpecialValueFor("bonus_intellect");
        this.bonusAttackSpeed = this.ability.GetSpecialValueFor("bonus_attack_speed");
        this.bonusManaRegen = this.ability.GetSpecialValueFor("bonus_mana_regen");

        this.bonusAttackSpeedperLevel = this.ability.GetSpecialValueFor("bonus_attack_speed_per_level");
    }

    OnAttackLanded(kv: ModifierAttackEvent): void {
        if (kv.target == this.parent) {
            return;
        }

        if (kv.attacker != this.parent) {
            return;
        }

        if (this.ability.IsCooldownReady() == false) {
            return;
        }

        if (this.parent.GetAttackCapability() != UnitAttackCapability.MELEE_ATTACK) {
            return;
        }

        this.parent.AddNewModifier(this.parent, this.ability, modifier_item_echo_sabre_custom_buff.name, {
            duration: this.ability.GetDuration()
        });
        this.ability.UseResources(true, false, true, true);
    }
}

@registerModifier()
export class modifier_item_echo_sabre_custom_buff extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    additionalAttacks!: number;
    additionalAttacksPerLevel!: number;
    currentProc = 0;

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

    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.ATTACKSPEED_BONUS_CONSTANT,
            ModifierFunction.MOUNTAIN_BASE_ATTACK_TIME_CONSTANT,
            ModifierFunction.ON_ATTACK_LANDED
        ];
    }

    GetModifierBaseAttackTimeConstant(): number {
        return 0.01;
    }

    GetModifierAttackSpeedBonus_Constant(): number {
        return 99999;
    }

    override OnCreated(): void {
        this.OnRefresh();
    }

    override OnRefresh(): void {
        this.additionalAttacks = this.ability.GetSpecialValueFor("additional_attacks");

        this.additionalAttacksPerLevel = this.ability.GetSpecialValueFor("additional_attacks_per_level");
    }

    OnAttackLanded(kv: ModifierAttackEvent): void {
        if (kv.target == this.parent) {
            return;
        }
        if (this.currentProc >= math.floor(this.additionalAttacks + (this.ability.GetLevel() - 1) * this.additionalAttacksPerLevel) - 1) {
            this.Destroy();
        } else {
            this.currentProc++;
        }
    }
}
