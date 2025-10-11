import { BaseAbility, registerAbility } from "../../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../../libraries/dota_ts_adapter";

@registerAbility()
export class telecommunication_crystal extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();

    Spawn(): void {
        if (IsClient()) {
            return;
        }
        this.SetLevel(1);
    }

    GetIntrinsicModifierName(): string {
        return modifier_telecommunication_crystal.name;
    }
}

@registerModifier()
export class modifier_telecommunication_crystal extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    powerTelecommunicationCrystalCount = 0;
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

    DeclareFunctions(): modifierfunction[] {
        return [
            ModifierFunction.HEALTHBAR_PIPS,
            ModifierFunction.ABSOLUTE_NO_DAMAGE_PURE,
            ModifierFunction.ABSOLUTE_NO_DAMAGE_MAGICAL,
            ModifierFunction.ABSOLUTE_NO_DAMAGE_PHYSICAL,
            ModifierFunction.ON_TAKEDAMAGE,
            ModifierFunction.ON_DEATH,
            ModifierFunction.PROVIDES_FOW_POSITION
        ];
    }

    CheckState(): Partial<Record<modifierstate, boolean>> {
        return {
            [ModifierState.INVULNERABLE]: this.powerTelecommunicationCrystalCount > 0,
            [ModifierState.NO_HEALTH_BAR]: this.powerTelecommunicationCrystalCount > 0
        };
    }

    GetModifierProvidesFOWVision(): 0 | 1 {
        return 1;
    }

    GetAbsoluteNoDamageMagical(): 0 | 1 {
        return 1;
    }

    GetAbsoluteNoDamagePhysical(): 0 | 1 {
        return 1;
    }

    GetAbsoluteNoDamagePure(): 0 | 1 {
        return 1;
    }

    GetModifierHealthBarPips(): number {
        return this.parent.GetMaxHealth();
    }

    OnDeath(kv: ModifierInstanceEvent): void {
        if (kv.unit.GetUnitName() == "npc_dota_power_telecommunication_crystal_custom") {
            this.powerTelecommunicationCrystalCount--;
        }
    }

    OnTakeDamage(kv: ModifierInstanceEvent): void {
        if (kv.attacker == this.parent || kv.unit != this.parent) {
            return;
        }

        if (kv.damage_category != DamageCategory.ATTACK) {
            return;
        }

        this.parent.SetHealth(this.parent.GetHealth() - (kv.attacker.GetLevel() - 1));
        if (this.parent.GetHealth() <= 0) {
            this.parent.Kill(this.ability, this.parent);
        }
    }

    override OnCreated(): void {
        if (IsClient()) {
            return;
        }
        Timers.CreateTimer(1, () => {
            const units = FindUnitsInRadius(
                this.parent.GetTeamNumber(),
                this.parent.GetAbsOrigin(),
                undefined,
                1000,
                UnitTargetTeam.FRIENDLY,
                UnitTargetType.ALL,
                UnitTargetFlags.NONE,
                FindOrder.ANY,
                false
            );

            units.forEach((unit) => {
                if (unit.GetUnitName() == "npc_dota_power_telecommunication_crystal_custom") {
                    unit.AddNewModifier(this.parent, this.ability, modifier_power_telecommunication_crystal.name, { duration: -1 });
                    this.powerTelecommunicationCrystalCount++;
                }
            });
            AddFOWViewer(DotaTeam.GOODGUYS, this.parent.GetAbsOrigin(), 500, 99999999999, false);
            AddFOWViewer(DotaTeam.BADGUYS, this.parent.GetAbsOrigin(), 500, 99999999999, false);
        });
    }
}

@registerModifier()
export class modifier_power_telecommunication_crystal extends BaseModifier {
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

    DeclareFunctions(): modifierfunction[] {
        return [
            ModifierFunction.HEALTHBAR_PIPS,
            ModifierFunction.ABSOLUTE_NO_DAMAGE_PURE,
            ModifierFunction.ABSOLUTE_NO_DAMAGE_MAGICAL,
            ModifierFunction.ABSOLUTE_NO_DAMAGE_PHYSICAL,
            ModifierFunction.ON_TAKEDAMAGE,
            ModifierFunction.PROVIDES_FOW_POSITION
        ];
    }

    GetModifierProvidesFOWVision(): 0 | 1 {
        return 1;
    }

    GetAbsoluteNoDamageMagical(): 0 | 1 {
        return 1;
    }

    GetAbsoluteNoDamagePhysical(): 0 | 1 {
        return 1;
    }

    GetAbsoluteNoDamagePure(): 0 | 1 {
        return 1;
    }

    GetModifierHealthBarPips(): number {
        return this.parent.GetMaxHealth();
    }

    OnTakeDamage(kv: ModifierInstanceEvent): void {
        if (kv.attacker == this.parent || kv.unit != this.parent) {
            return;
        }

        if (kv.damage_category != DamageCategory.ATTACK) {
            return;
        }
        print(this.parent.GetHealth() - (kv.attacker.GetLevel() - 1));

        this.parent.SetHealth(this.parent.GetHealth() - (kv.attacker.GetLevel() - 1));
        if (this.parent.GetHealth() <= 0) {
            this.parent.Kill(this.ability, this.parent);
        }
    }

    override OnCreated(): void {
        if (!IsClient()) {
            return;
        }
        const pfx = ParticleManager.CreateParticle(
            "particles/custom/units/electrical_bundle.vpcf",
            ParticleAttachment.ABSORIGIN,
            this.parent
        );
        ParticleManager.SetParticleControl(pfx, 0, this.parent.GetAbsOrigin());
        ParticleManager.SetParticleControl(pfx, 1, this.caster.GetAbsOrigin());
    }
}
