import { registerModifier, BaseModifier } from "../libraries/dota_ts_adapter";

@registerModifier()
export class modifier_animal_instinct extends BaseModifier {
    // Modifier properties
    private parent: CDOTA_BaseNPC = this.GetParent();

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

    IsAura(): boolean {
        return true;
    }

    GetAuraSearchFlags(): UnitTargetFlags {
        return UnitTargetFlags.NONE;
    }

    GetAuraSearchTeam(): UnitTargetTeam {
        return UnitTargetTeam.ENEMY;
    }

    GetAuraSearchType(): UnitTargetType {
        return UnitTargetType.HERO;
    }

    GetAuraRadius(): number {
        return 1500;
    }

    GetModifierAura(): string {
        return modifier_animal_instinct_vision.name;
    }

    GetAuraDuration(): number {
        return FrameTime();
    }

    OnCreated(params: object): void {
        if (this.parent.GetTeam() == DotaTeam.GOODGUYS) this.Destroy();
    }
}

@registerModifier()
export class modifier_animal_instinct_vision extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();

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
        return [ModifierFunction.PROVIDES_FOW_POSITION];
    }

    GetModifierProvidesFOWVision(): 0 | 1 {
        return 1;
    }
}
