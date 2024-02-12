import { registerModifier, BaseModifier } from "../libraries/dota_ts_adapter";

@registerModifier()
export class modifier_creep_stats_amplification extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC_Hero = this.GetCaster()! as CDOTA_BaseNPC_Hero;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();

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
        return false;
    }

    CheckState(): Partial<Record<ModifierState, boolean>> {
        return { [ModifierState.DOMINATED]: true };
    }

    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.PHYSICAL_ARMOR_BONUS,
            ModifierFunction.ATTACKSPEED_BONUS_CONSTANT,
            ModifierFunction.BASEATTACK_BONUSDAMAGE,
            ModifierFunction.MODEL_SCALE
        ];
    }

    GetModifierPhysicalArmorBonus(): number {
        return this.caster.GetStrength() * 1.2;
    }

    GetModifierAttackSpeedBonus_Constant(): number {
        return this.caster.GetAgility() * 1.2;
    }

    GetModifierBaseAttack_BonusDamage(): number {
        return this.caster.GetIntellect() * 2;
    }

    GetModifierModelScale(): number {
        return 20;
    }

    OnDestroy(): void {
        if (!IsServer()) {
            return;
        }

        if (this.parent == undefined || !this.parent.IsNull()) {
            return;
        }

        this.parent.Kill(this.ability, this.caster);
    }
}
