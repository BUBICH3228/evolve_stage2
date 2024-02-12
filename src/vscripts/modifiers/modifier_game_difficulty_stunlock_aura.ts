import { registerModifier, BaseModifier } from "../libraries/dota_ts_adapter";

@registerModifier()
export class modifier_game_difficulty_stunlock_aura extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();

    // Modifier specials

    override IsHidden() {
        return true;
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

    IsAura(): boolean {
        return true;
    }

    GetAuraRadius(): number {
        return FIND_UNITS_EVERYWHERE;
    }

    GetAuraSearchTeam(): UnitTargetTeam {
        return UnitTargetTeam.FRIENDLY;
    }

    GetAuraSearchType(): UnitTargetType {
        return UnitTargetType.ALL;
    }

    GetAuraSearchFlags(): UnitTargetFlags {
        return UnitTargetFlags.MAGIC_IMMUNE_ENEMIES;
    }

    GetAuraDuration(): number {
        return 0;
    }
    GetAttributes(): ModifierAttribute {
        return ModifierAttribute.IGNORE_INVULNERABLE;
    }

    GetModifierAura(): string {
        return modifier_game_difficulty_stunlock_aura_debuff.name;
    }
}

@registerModifier()
export class modifier_game_difficulty_stunlock_aura_debuff extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();

    // Modifier specials

    override IsHidden() {
        return true;
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
    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.MIN_HEALTH,
            ModifierFunction.ABSOLUTE_NO_DAMAGE_PHYSICAL,
            ModifierFunction.ABSOLUTE_NO_DAMAGE_MAGICAL,
            ModifierFunction.ABSOLUTE_NO_DAMAGE_PURE
        ];
    }

    CheckState(): Partial<Record<ModifierState, boolean>> {
        return {
            [ModifierState.STUNNED]: true,
            [ModifierState.COMMAND_RESTRICTED]: true
        };
    }

    GetMinHealth(): number {
        return 1;
    }

    GetAbsoluteNoDamagePhysical(): 0 | 1 {
        return 1;
    }

    GetAbsoluteNoDamageMagical(): 0 | 1 {
        return 1;
    }

    GetAbsoluteNoDamagePure(): 0 | 1 {
        return 1;
    }
}
