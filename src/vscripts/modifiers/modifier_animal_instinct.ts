import { registerModifier, BaseModifier } from "../libraries/dota_ts_adapter";

@registerModifier()
export class modifier_animal_instinct extends BaseModifier {
    // Modifier properties
    private parent: CDOTA_BaseNPC = this.GetParent();
    IsKill = false;
    timer: string | undefined;

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

    DeclareFunctions(): modifierfunction[] {
        return [ModifierFunction.ON_DEATH];
    }

    OnCreated(): void {
        if (this.parent.GetTeamNumber() == DotaTeam.GOODGUYS) this.Destroy();

        if (IsClient()) {
            return;
        }

        this.StartIntervalThink(1);
    }

    OnIntervalThink(): void {
        if (this.IsKill == false) {
            return;
        }
        if (this.timer == undefined) {
            this.timer = Timers.CreateTimer(10, () => {
                this.IsKill = false;
            });
        }

        const pfx = ParticleManager.CreateParticle(
            "particles/econ/items/bloodseeker/bloodseeker_crownfall_immortal/bloodseeker_crownfall_immortal_ruptureg.vpcf",
            ParticleAttachment.WORLDORIGIN,
            this.parent
        );

        ParticleManager.SetParticleControl(pfx, 0, this.parent.GetAbsOrigin());

        ParticleManager.DestroyAndReleaseParticle(pfx, 10, false);
    }

    OnDeath(kv: ModifierInstanceEvent): void {
        if (kv.attacker != this.parent) {
            return;
        }

        if (kv.unit.GetTeam() == DotaTeam.NEUTRALS) {
            if (this.timer != undefined) {
                Timers.RemoveTimer(this.timer);
                this.timer = undefined;
            }

            this.IsKill = true;
            Timers.CreateTimer(0.01, () => {
                const pfx = ParticleManager.CreateParticle(
                    "particles/econ/items/bloodseeker/bloodseeker_ti7/bloodseeker_ti7_thirst_owner_ground.vpcf",
                    ParticleAttachment.WORLDORIGIN,
                    this.parent
                );

                ParticleManager.SetParticleControl(pfx, 0, kv.unit.GetAbsOrigin());

                ParticleManager.DestroyAndReleaseParticle(pfx, 25, false);
            });
        }
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
