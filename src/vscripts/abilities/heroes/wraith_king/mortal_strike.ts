import { BaseAbility, registerAbility } from "../../../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../../../libraries/dota_ts_adapter";

@registerAbility()
export class wraith_king_mortal_strike_custom extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();

    GetIntrinsicModifierName(): string {
        return modofoer_wraith_king_mortal_strike_custom.name;
    }
}

@registerModifier()
export class modofoer_wraith_king_mortal_strike_custom extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    critMult!: number;
    talentChance!: number;
    talentHealthPct!: number;
    talentDuration!: number;
    criticalIncreasesPerStack!: number;
    talentModifier: CDOTA_Buff | undefined;

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
        return [ModifierFunction.PREATTACK_CRITICALSTRIKE, ModifierFunction.ON_ATTACK_LANDED];
    }

    override OnCreated(): void {
        this.OnRefresh();
    }

    override OnRefresh(): void {
        this.critMult = this.ability.GetSpecialValueFor("crit_mult");
        this.talentChance = this.ability.GetSpecialValueFor("talent_chance");
        this.talentHealthPct = this.ability.GetSpecialValueFor("talent_health_pct");
        this.talentDuration = this.ability.GetSpecialValueFor("talent_duration");
        this.criticalIncreasesPerStack = this.ability.GetSpecialValueFor("talent_critical_increases_per_stack") / 100;
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

        if (this.caster.HasTalent("talent_wraith_king_mortal_strike_custom_critical_increases")) {
            this.talentModifier = this.parent.AddNewModifier(
                this.parent,
                this.ability,
                talent_modofoer_wraith_king_mortal_strike_custom.name,
                { duration: this.talentDuration }
            );

            if (this.talentModifier) {
                this.talentModifier.IncrementIndependentStackCount();
            }
        }

        if (!this.caster.HasTalent("talent_wraith_king_mortal_strike_custom_insta_kill")) {
            this.ability.UseResources(false, false, false, true);
        }

        if (this.talentModifier) {
            return this.critMult + this.critMult * this.criticalIncreasesPerStack * this.talentModifier.GetStackCount();
        } else {
            return this.critMult;
        }
    }

    OnAttackLanded(kv: ModifierAttackEvent): void {
        if (kv.attacker != this.parent) {
            return;
        }

        if (this.parent.PassivesDisabled()) {
            return;
        }

        if (!this.ability.IsCooldownReady()) {
            return;
        }

        if (!this.caster.HasTalent("talent_wraith_king_mortal_strike_custom_insta_kill")) {
            return;
        }

        if (kv.target.GetHealthPercent() <= this.talentHealthPct && !kv.target.IsBoss()) {
            if (RollPseudoRandomPercentage(this.talentChance, this.ability) == true) {
                kv.target.Kill(this.ability, this.parent);
            }
        }

        this.ability.UseResources(false, false, false, true);
    }
}

@registerModifier()
export class talent_modofoer_wraith_king_mortal_strike_custom extends BaseModifier {
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
}
