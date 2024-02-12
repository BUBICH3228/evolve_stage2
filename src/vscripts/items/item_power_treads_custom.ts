import { BaseItem, registerAbility } from "../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../libraries/dota_ts_adapter";

@registerAbility()
export class item_power_treads_custom extends BaseItem {
    GetIntrinsicModifierName(): string {
        return modifier_item_power_treads_custom.name;
    }

    ProcsMagicStick(): boolean {
        return false;
    }

    override OnSpellStart(): void {
        if (!IsServer()) {
            return;
        }
        const stacks = this.GetIntrinsicModifier()!.GetStackCount();
        if (stacks == 0) {
            this.GetIntrinsicModifier()!.SetStackCount(1);
        } else if (stacks == 1) {
            this.GetIntrinsicModifier()!.SetStackCount(2);
        } else if (stacks == 2) {
            this.GetIntrinsicModifier()!.SetStackCount(0);
        }
        const caster = this.GetCaster() as CDOTA_BaseNPC_Hero;
        caster.CalculateStatBonus(true);
    }

    GetAbilityTextureName(): string {
        const caster = this.GetCaster();
        const stacks = caster.GetModifierStackCount(modifier_item_power_treads_custom.name, caster);
        if (stacks == 0) {
            return "power_treads_str";
        } else if (stacks == 1) {
            return "power_treads_agi";
        } else {
            return "power_treads_int";
        }
    }
}

@registerModifier()
export class modifier_item_power_treads_custom extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC_Hero = this.GetParent() as CDOTA_BaseNPC_Hero;
    bonusStat!: number;
    bonusDamagePerAgi!: number;
    bonusAttackSpeed!: number;
    bonusMovementSpeed!: number;
    bonusHealthPerStr!: number;
    bonusSpellAmpPerInt!: number;

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
    override RemoveOnDeath(): boolean {
        return false;
    }

    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.STATS_STRENGTH_BONUS,
            ModifierFunction.STATS_AGILITY_BONUS,
            ModifierFunction.STATS_INTELLECT_BONUS,
            ModifierFunction.HEALTH_BONUS,
            ModifierFunction.PREATTACK_BONUS_DAMAGE,
            ModifierFunction.SPELL_AMPLIFY_PERCENTAGE,
            ModifierFunction.ATTACKSPEED_BONUS_CONSTANT,
            ModifierFunction.MOVESPEED_BONUS_CONSTANT
        ];
    }

    GetModifierBonusStats_Strength(): number {
        if (this.GetStackCount() == 0) {
            return this.bonusStat;
        }
        return 0;
    }

    GetModifierBonusStats_Agility(): number {
        if (this.GetStackCount() == 1) {
            return this.bonusStat;
        }
        return 0;
    }

    GetModifierBonusStats_Intellect(): number {
        if (this.GetStackCount() == 2) {
            return this.bonusStat;
        }
        return 0;
    }

    GetModifierHealthBonus(): number {
        if (this.GetStackCount() == 0) {
            return this.bonusHealthPerStr * this.parent.GetStrength();
        }
        return 0;
    }

    GetModifierPreAttack_BonusDamage(): number {
        if (this.GetStackCount() == 1) {
            return this.bonusDamagePerAgi * this.parent.GetAgility();
        }
        return 0;
    }

    GetModifierSpellAmplify_Percentage(): number {
        if (this.GetStackCount() == 2) {
            return this.bonusSpellAmpPerInt * this.parent.GetIntellect();
        }
        return 0;
    }

    GetModifierAttackSpeedBonus_Constant(): number {
        return this.bonusAttackSpeed;
    }

    GetModifierMoveSpeedBonus_Constant(): number {
        return this.bonusMovementSpeed;
    }

    OnCreated(): void {
        this.OnRefresh();
    }

    OnRefresh(): void {
        this.bonusMovementSpeed = this.ability.GetSpecialValueFor("bonus_movement_speed");
        this.bonusAttackSpeed = this.ability.GetSpecialValueFor("bonus_attack_speed");
        this.bonusStat = this.ability.GetSpecialValueFor("bonus_stat");
        this.bonusHealthPerStr = this.ability.GetSpecialValueFor("bonus_health_per_str");
        this.bonusDamagePerAgi = this.ability.GetSpecialValueFor("bonus_damage_per_agi");
        this.bonusSpellAmpPerInt = this.ability.GetSpecialValueFor("bonus_spell_amp_per_int");
    }
}
