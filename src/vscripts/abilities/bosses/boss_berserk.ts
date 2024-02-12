import { BossData } from "../../common/data/creep_spawner";
import { BaseAbility, registerAbility } from "../../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../../libraries/dota_ts_adapter";

@registerAbility()
export class boss_berserk extends BaseAbility {
    // Ability properties
    GetIntrinsicModifierName(): string {
        return modifier_boss_berserk.name;
    }
}

@registerModifier()
export class modifier_boss_berserk extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    healthPctToActivate!: number;
    bonusHealthPctToActivatePerDeath!: number;

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

    override OnCreated(): void {
        this.OnRefresh();

        if (!IsServer()) {
            return;
        }

        this.StartIntervalThink(FrameTime());
    }

    override OnRefresh(): void {
        this.healthPctToActivate = this.ability.GetSpecialValueFor("health_pct_to_activate");
        this.bonusHealthPctToActivatePerDeath = this.ability.GetSpecialValueFor("bonus_health_pct_to_activate_per_death");
    }

    OnIntervalThink(): void {
        if (
            this.parent.GetHealthPercent() <=
            this.healthPctToActivate + this.bonusHealthPctToActivatePerDeath * BossData.Targets[this.parent.GetUnitName()].Death
        ) {
            this.parent.AddNewModifier(this.caster, this.ability, modifier_boss_berserk_buff.name, { duration: -1 });
        }
    }
}

@registerModifier()
export class modifier_boss_berserk_buff extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    bonusMovementSpeed!: number;
    bonusAttackSpeed!: number;
    purgeInterval!: number;
    bonusModelScale!: number;

    // Modifier specials

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
        return "particles/econ/items/ogre_magi/ogre_ti8_immortal_weapon/ogre_ti8_immortal_bloodlust_buff.vpcf";
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.ATTACKSPEED_BONUS_CONSTANT, ModifierFunction.MOVESPEED_BONUS_CONSTANT, ModifierFunction.MODEL_SCALE];
    }

    GetModifierAttackSpeedBonus_Constant(): number {
        return this.bonusAttackSpeed;
    }

    GetModifierMoveSpeedBonus_Constant(): number {
        return this.bonusMovementSpeed;
    }

    GetModifierModelScale(): number {
        return this.bonusModelScale;
    }

    override OnCreated(): void {
        this.OnRefresh();

        if (!IsServer()) {
            return;
        }

        this.StartIntervalThink(this.purgeInterval);
    }

    override OnRefresh(): void {
        this.bonusMovementSpeed = this.ability.GetSpecialValueFor("bonus_movement_speed");
        this.bonusAttackSpeed = this.ability.GetSpecialValueFor("bonus_attack_speed");
        this.purgeInterval = this.ability.GetSpecialValueFor("purge_interval");
        this.bonusModelScale = this.ability.GetSpecialValueFor("bonus_model_scale");
    }

    OnIntervalThink(): void {
        this.parent.Purge(false, true, false, true, true);
    }
}
