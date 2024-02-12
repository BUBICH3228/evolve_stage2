import { BaseAbility, registerAbility } from "../../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../../libraries/dota_ts_adapter";

@registerAbility()
export class fortification extends BaseAbility {
    GetIntrinsicModifierName(): string {
        return modifier_fortification.name;
    }
}

@registerModifier()
export class modifier_fortification extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    durationOfInvulnerability!: number;
    coldownAnoncer = true;

    // Modifier specials

    override IsHidden() {
        return true;
    }
    override IsPurgable() {
        return false;
    }
    override IsPurgeException() {
        return false;
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.ON_ATTACK_LANDED];
    }

    override OnCreated(): void {
        this.OnRefresh();
        if (!IsServer()) {
            return;
        }
        this.parent.SetMaterialGroup("radiant_level2");
        this.parent.StartGesture(GameActivity.DOTA_CAPTURE);
        this.parent.AddActivityModifier("level3");
    }

    OnRefresh(): void {
        this.durationOfInvulnerability = this.ability.GetSpecialValueFor("duration_of_invulnerability");
    }

    OnAttackLanded(kv: ModifierAttackEvent): void {
        if (kv.target != this.parent) {
            return;
        }

        if (this.coldownAnoncer) {
            GameRules.ExecuteTeamPing(DotaTeam.GOODGUYS, this.parent.GetAbsOrigin().x, this.parent.GetAbsOrigin().y, this.parent, 0);
            //EmitAnnouncerSound("announcer_ann_custom_generic_alert_01");
            this.coldownAnoncer = false;
            Timers.CreateTimer(3, () => {
                this.coldownAnoncer = true;
            });
        }

        if (!this.ability.IsCooldownReady()) {
            return;
        }

        this.parent.AddNewModifier(this.caster, this.ability, modifier_fortification_buff.name, {
            duration: this.durationOfInvulnerability
        });
        this.ability.UseResources(false, false, false, true);
    }
}

@registerModifier()
export class modifier_fortification_buff extends BaseModifier {
    override IsHidden() {
        return false;
    }
    override IsPurgable() {
        return false;
    }
    override IsPurgeException() {
        return false;
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.INCOMING_DAMAGE_PERCENTAGE];
    }

    GetModifierIncomingDamage_Percentage(): number {
        return -100;
    }
}
