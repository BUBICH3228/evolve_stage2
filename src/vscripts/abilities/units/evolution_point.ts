import { BaseAbility, registerAbility } from "../../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../../libraries/dota_ts_adapter";

@registerAbility()
export class evolution_point extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();

    Spawn(): void {
        if (IsClient()) {
            return;
        }
        this.SetLevel(1);
    }

    GetIntrinsicModifierName(): string {
        return modifier_evolution_point.name;
    }
}

@registerModifier()
export class modifier_evolution_point extends BaseModifier {
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
            ModifierFunction.ON_TAKEDAMAGE
        ];
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
        if (kv.attacker == this.parent || kv.unit != this.parent || kv.attacker.GetTeam() != DotaTeam.BADGUYS) {
            return;
        }

        if (kv.damage_category != DamageCategory.ATTACK) {
            return;
        }

        kv.attacker.SetMana(kv.attacker.GetMana() + 500);
        this.parent.SetHealth(this.parent.GetHealth() - 1);
    }
}
