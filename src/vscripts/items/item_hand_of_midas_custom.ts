import { HeroStatsTable, HeroStatsTableDisplay } from "../common/data/hero_stats";
import { BaseItem, registerAbility } from "../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../libraries/dota_ts_adapter";

@registerAbility()
export class item_hand_of_midas_custom extends BaseItem {
    GetIntrinsicModifierName(): string {
        return modifier_item_hand_of_midas_custom.name;
    }

    override OnSpellStart(): void {
        const caster = this.GetCaster() as CDOTA_BaseNPC_Hero;
        const target = this.GetCursorTarget() as CDOTA_BaseNPC_Hero;

        if (target == undefined) {
            return;
        }

        if (target.IsBoss()) {
            PlayerResource.SendCustomErrorMessageToPlayer(caster.GetPlayerOwnerID(), "failed_to_use_on_the_boss");
            this.SetCurrentCharges(this.GetCurrentAbilityCharges() + 1);
            return;
        }

        if (caster.GetLevel() + this.GetSpecialValueFor("max_level_gap") < target.GetLevel()) {
            PlayerResource.SendCustomErrorMessageToPlayer(caster.GetPlayerOwnerID(), "failed_big_level_gap");
            this.SetCurrentCharges(this.GetCurrentAbilityCharges() + 1);
            return;
        }
        const goldBountyPct = this.GetSpecialValueFor("gold_bounty_pct") / 100;
        const XPBountyPct = this.GetSpecialValueFor("XP_bounty_pct") / 100;

        const bountyGold = target.GetMaximumGoldBounty() + (this.GetLevel() - 1) * this.GetSpecialValueFor("XP_and_gold_bounty_per_level");
        const bountyXP = target.GetDeathXP() + (this.GetLevel() - 1) * this.GetSpecialValueFor("XP_and_gold_bounty_per_level");
        const totalGoldBounty = bountyGold * goldBountyPct + this.GetSpecialValueFor("gold_bounty");
        const totalXPBounty = bountyXP * XPBountyPct + this.GetSpecialValueFor("XP_bounty");
        target.Kill(this, caster);

        const player = PlayerResource.GetPlayer(caster.GetPlayerOwnerID());

        caster.ModifyGold(totalGoldBounty, true, ModifyGoldReason.UNSPECIFIED);
        SendOverheadEventMessage(player, OverheadAlert.GOLD, caster, totalGoldBounty, undefined);
        caster.AddExperience(totalXPBounty, ModifyXpReason.UNSPECIFIED, false, true);
        EmitSoundOn("ItemGlovesOfGold.Use", caster);

        this.SetCurrentCharges(this.GetCurrentAbilityCharges());
    }
}

@registerModifier()
export class modifier_item_hand_of_midas_custom extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    maxBonusGold!: number;
    bonusAttackSpeed!: number;
    maxBonusExp!: number;
    bonusAttackSpeedPerLevel!: number;
    IsBuffActive = false;
    activationLevelMaxBonusGoldXP!: number;

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
        return true;
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.ATTACKSPEED_BONUS_CONSTANT, ModifierFunction.ON_ORDER];
    }

    GetModifierAttackSpeedBonus_Constant(): number {
        return this.bonusAttackSpeed + (this.ability.GetLevel() - 1) * this.bonusAttackSpeedPerLevel;
    }

    override OnCreated(): void {
        this.OnRefresh();
        if (!IsServer()) {
            return;
        }
        this.StartIntervalThink(0.1);
    }

    override OnRefresh(): void {
        this.bonusAttackSpeed = this.ability.GetSpecialValueFor("bonus_attack_speed");
        this.maxBonusGold = this.ability.GetSpecialValueFor("max_bonus_gold");
        this.maxBonusExp = this.ability.GetSpecialValueFor("max_bonus_exp");
        this.activationLevelMaxBonusGoldXP = this.ability.GetSpecialValueFor("activation_level_max_bonus_gold_XP");

        this.bonusAttackSpeedPerLevel = this.ability.GetSpecialValueFor("bonus_attack_speed_per_level");
    }

    OnIntervalThink(): void {
        if (this.ability.GetLevel() >= this.activationLevelMaxBonusGoldXP && this.IsBuffActive == false) {
            this.IsBuffActive = true;
            HeroStatsTableDisplay.OtherStats[1]["StatLimit"]! += this.maxBonusGold;
            HeroStatsTableDisplay.OtherStats[2]["StatLimit"]! += this.maxBonusExp;
            HeroStatsTable[this.parent.GetPlayerOwnerID()].bonus_gold.StatCount += this.maxBonusGold;
            HeroStatsTable[this.parent.GetPlayerOwnerID()].bonus_exp.StatCount += this.maxBonusExp;
        }
    }

    OnDestroy(): void {
        if (!IsServer()) {
            return;
        }

        if (this.ability.GetLevel() >= 20) {
            HeroStatsTableDisplay.OtherStats[1]["StatLimit"]! -= this.maxBonusGold;
            HeroStatsTableDisplay.OtherStats[2]["StatLimit"]! -= this.maxBonusExp;
            HeroStatsTable[this.parent.GetPlayerOwnerID()].bonus_gold.StatCount -= this.maxBonusGold;
            HeroStatsTable[this.parent.GetPlayerOwnerID()].bonus_exp.StatCount -= this.maxBonusExp;
        }
    }

    OnOrder(kv: ModifierOrderEvent): void {
        if (kv.order_type == UnitOrder.PURCHASE_ITEM) {
            Timers.CreateTimer(0.05, () => {
                for (let indexSlot = 0; indexSlot <= 15; indexSlot++) {
                    const item = this.parent.GetItemInSlot(indexSlot);
                    if (item != undefined && item.GetName() == this.ability.GetName()) {
                        item.SetCurrentCharges(this.ability.GetCurrentAbilityCharges());
                    }
                }
            });
        }
        if (kv.order_type == UnitOrder.CAST_TARGET) {
            Timers.CreateTimer(0.05, () => {
                for (let indexSlot = 0; indexSlot <= 15; indexSlot++) {
                    const item = this.parent.GetItemInSlot(indexSlot);
                    if (item != undefined && item.GetName() == kv.ability!.GetName()) {
                        if (item.GetCurrentAbilityCharges() > 0) {
                            item.SetCurrentCharges(kv.ability!.GetCurrentAbilityCharges());
                        } else {
                            item.StartCooldown(item.GetAbilityChargeRestoreTime(1));
                        }
                    }
                }
            });
        }
    }
}
