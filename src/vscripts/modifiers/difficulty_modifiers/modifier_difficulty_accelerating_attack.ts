import { registerModifier, BaseModifier } from "../../libraries/dota_ts_adapter";

@registerModifier()
export class modifier_difficulty_accelerating_attack extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();

    // Modifier specials

    override IsHidden() {
        return false;
    }
    override IsDebuff() {
        return true;
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

    GetAuraRadius(): number {
        return 550;
    }

    GetAuraSearchTeam(): UnitTargetTeam {
        return UnitTargetTeam.ENEMY;
    }

    GetAuraSearchType(): UnitTargetType {
        return UnitTargetType.BASIC + UnitTargetType.BUILDING;
    }

    GetAuraSearchFlags(): UnitTargetFlags {
        return UnitTargetFlags.NONE;
    }

    IsAura(): boolean {
        return true;
    }

    GetModifierAura(): string {
        return modifier_difficulty_accelerating_attack_buff.name;
    }

    GetTexture(): string {
        return "difficulty_modifiers/accelerating_attack";
    }
}

@registerModifier()
export class modifier_difficulty_accelerating_attack_buff extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
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

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.ATTACKSPEED_BONUS_CONSTANT];
    }

    GetModifierAttackSpeedBonus_Constant(): number {
        return 45;
    }
}
