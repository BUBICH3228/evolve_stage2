import { HeroStatsTable } from "../common/data/hero_stats";
import { BaseItem, registerAbility } from "../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../libraries/dota_ts_adapter";
import { modifier_hero_stats } from "../modifiers/modifier_hero_stats";

@registerAbility()
export class item_travel_boots_custom extends BaseItem {
    GetIntrinsicModifierName(): string {
        return modifier_item_travel_boots_custom.name;
    }
}

@registerModifier()
export class modifier_item_travel_boots_custom extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    bonusMovementSpeed!: number;
    bonusMovementSpeedLimit!: number;

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
        return [ModifierFunction.MOVESPEED_BONUS_CONSTANT];
    }

    GetModifierMoveSpeedBonus_Constant(): number {
        return this.bonusMovementSpeed;
    }

    override OnCreated(): void {
        this.OnRefresh();
        if (!IsServer()) {
            return;
        }

        HeroStatsTable[this.parent.GetPlayerOwnerID()]["max_movespeed"]["StatCount"] += this.bonusMovementSpeedLimit;
        (this.parent.FindModifierByName(modifier_hero_stats.name)! as BaseModifier).OnRefresh({});
    }

    override OnRefresh(): void {
        this.bonusMovementSpeed = this.ability.GetSpecialValueFor("bonus_movement_speed");
        this.bonusMovementSpeedLimit = this.ability.GetSpecialValueFor("bonus_movement_speed_limit");
    }

    OnDestroy(): void {
        if (!IsServer()) {
            return;
        }

        HeroStatsTable[this.parent.GetPlayerOwnerID()]["max_movespeed"]["StatCount"] -= this.bonusMovementSpeedLimit;
        (this.parent.FindModifierByName(modifier_hero_stats.name)! as BaseModifier).OnRefresh({});
    }
}
