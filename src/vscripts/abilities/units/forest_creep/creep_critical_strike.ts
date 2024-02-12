import { BaseAbility, registerAbility } from "../../../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../../../libraries/dota_ts_adapter";

@registerAbility()
export class creep_critical_strike extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();

    GetIntrinsicModifierName(): string {
        return modifier_creep_critical_strike.name;
    }
}

@registerModifier()
export class modifier_creep_critical_strike extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    criticalStrikeDamagePct!: number;

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

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.PREATTACK_CRITICALSTRIKE];
    }

    override OnCreated(): void {
        this.OnRefresh();
    }

    override OnRefresh(): void {
        this.criticalStrikeDamagePct = this.ability.GetSpecialValueFor("critical_strike_damage_pct");
    }

    GetModifierPreAttack_CriticalStrike(kv: ModifierAttackEvent): number {
        if (kv.attacker != this.parent) {
            return 0;
        }

        if (this.parent.PassivesDisabled()) {
            return 0;
        }

        if (!this.ability.IsCooldownReady()) {
            return 0;
        }

        this.ability.UseResources(false, false, false, true);

        return this.criticalStrikeDamagePct;
    }
}
