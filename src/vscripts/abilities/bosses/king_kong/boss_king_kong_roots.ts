import { BaseAbility, registerAbility } from "../../../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../../../libraries/dota_ts_adapter";

@registerAbility()
export class boss_king_kong_roots extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();

    override OnSpellStart(): void {
        const target = this.GetCursorTarget();

        if (target == undefined) {
            return;
        }

        target.AddNewModifier(this.caster, this, modifier_boss_king_kong_roots_debuff.name, {
            duration: this.GetDuration() * (1 - target.GetStatusResistance())
        });
    }
}

@registerModifier()
export class modifier_boss_king_kong_roots_debuff extends BaseModifier {
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
        return true;
    }
    override IsPurgeException() {
        return true;
    }
    override RemoveOnDeath() {
        return true;
    }

    GetEffectName(): string {
        return "particles/units/heroes/hero_lone_druid/lone_druid_bear_entangle.vpcf";
    }

    CheckState(): Partial<Record<ModifierState, boolean>> {
        return { [ModifierState.ROOTED]: true };
    }

    override OnCreated(): void {
        this.OnRefresh();
    }

    override OnRefresh(): void {}
}
