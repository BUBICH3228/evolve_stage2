import { BaseAbility, registerAbility } from "../../../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../../../libraries/dota_ts_adapter";

@registerAbility()
export class creep_curse_of_the_dead_reduced_mana extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();

    GetIntrinsicModifierName(): string {
        return modifier_creep_curse_of_the_dead_reduced_mana.name;
    }
}

@registerModifier()
export class modifier_creep_curse_of_the_dead_reduced_mana extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    duration!: number;
    targetTeam!: UnitTargetTeam;
    targetType!: UnitTargetType;
    targetFlags!: UnitTargetFlags;

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
        return [ModifierFunction.ON_DEATH];
    }

    override OnCreated(): void {
        this.OnRefresh();

        if (!IsServer()) {
            return;
        }
        this.targetTeam = this.ability.GetAbilityTargetTeam();
        this.targetType = this.ability.GetAbilityTargetType();
        this.targetFlags = this.ability.GetAbilityTargetFlags();
    }

    override OnRefresh(): void {
        this.duration = this.ability.GetSpecialValueFor("duration");
    }

    OnDeath(kv: ModifierInstanceEvent): void {
        if (kv.unit != this.parent) {
            return;
        }

        if (
            UnitFilter(kv.attacker, this.targetTeam, this.targetType, this.targetFlags, this.caster.GetTeamNumber()) !=
            UnitFilterResult.SUCCESS
        ) {
            return;
        }

        const modifier = kv.attacker.AddNewModifier(this.caster, this.ability, modifier_creep_curse_of_the_dead_reduced_mana_debuff.name, {
            duration: this.duration * (1 - kv.attacker.GetStatusResistance())
        });
        if (modifier != undefined) {
            modifier.IncrementIndependentStackCount();
        }
    }
}

@registerModifier()
export class modifier_creep_curse_of_the_dead_reduced_mana_debuff extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC_Hero = this.GetParent() as CDOTA_BaseNPC_Hero;
    reducedManaPerStack!: number;

    // Modifier specials

    override IsHidden() {
        return false;
    }
    override IsDebuff() {
        return true;
    }
    override IsPurgable() {
        return true;
    }
    override IsPurgeException() {
        return true;
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.EXTRA_MANA_PERCENTAGE];
    }

    GetModifierExtraManaPercentage(): number {
        if (this.reducedManaPerStack * this.GetStackCount() < -100) {
            return this.reducedManaPerStack * (this.GetStackCount() - 1);
        }
        return this.reducedManaPerStack * this.GetStackCount();
    }

    override OnCreated(): void {
        this.OnRefresh();
    }

    override OnRefresh(): void {
        this.ability = this.GetAbility()!;
        if (this.ability == undefined) {
            return;
        }
        this.reducedManaPerStack = -1 * this.ability.GetSpecialValueFor("reduced_mana_pct_per_stack");
        this.parent = this.GetParent() as CDOTA_BaseNPC_Hero;
        if (this.parent == undefined) {
            return;
        }
        if (!IsServer()) {
            return;
        }
        this.parent.CalculateStatBonus(false);
    }
}
