import { BaseItem, registerAbility } from "../libraries/dota_ts_adapter";
import { modifier_creep_stats_amplification } from "../modifiers/modifier_creep_stats_amplification";
import { registerModifier, BaseModifier } from "../libraries/dota_ts_adapter";

@registerAbility()
export class item_helm_of_the_overlord_custom extends BaseItem {
    creepData: CDOTA_BaseNPC | undefined;

    GetIntrinsicModifierName(): string {
        return modifier_item_helm_of_the_overlord_custom.name;
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

        if (this.creepData != undefined && !this.creepData.IsNull()) {
            this.creepData.Kill(this, caster);
            this.creepData = undefined;
        }

        this.creepData = target;
        target.SetTeam(caster.GetTeamNumber());
        target.SetOwner(caster);
        target.SetControllableByPlayer(caster.GetPlayerOwnerID(), false);
        target.AddNewModifier(caster, this, modifier_creep_stats_amplification.name, { duration: this.GetDuration() });
    }
}

@registerModifier()
export class modifier_item_helm_of_the_overlord_custom extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    bonusAllStats!: number;
    bonusAllStatsPerLevel!: number;
    bonusArmor!: number;
    bonusRegen!: number;
    bonusRegenPerLevel!: number;

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
            ModifierFunction.HEALTH_REGEN_CONSTANT
        ];
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

    GetModifierConstantHealthRegen(): number {
        return this.bonusRegen + (this.ability.GetLevel() - 1) * this.bonusRegenPerLevel;
    }

    GetModifierPhysicalArmorBonus(): number {
        return this.bonusArmor;
    }

    override OnCreated(): void {
        this.OnRefresh();
    }

    override OnRefresh(): void {
        this.bonusAllStats = this.ability.GetSpecialValueFor("bonus_all_stats");
        this.bonusArmor = this.ability.GetSpecialValueFor("bonus_armor");
        this.bonusRegen = this.ability.GetSpecialValueFor("bonus_regen");

        this.bonusAllStatsPerLevel = this.ability.GetSpecialValueFor("bonus_all_stats_per_level");
        this.bonusRegenPerLevel = this.ability.GetSpecialValueFor("bonus_regen_per_level");
    }
}
