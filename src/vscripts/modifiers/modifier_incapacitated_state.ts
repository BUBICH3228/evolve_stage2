import { registerModifier, BaseModifier } from "../libraries/dota_ts_adapter";

@registerModifier()
export class modifier_incapacitated_state extends BaseModifier {
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
    override RemoveOnDeath() {
        return false;
    }

    CheckState(): Partial<Record<ModifierState, boolean>> {
        return {
            [ModifierState.STUNNED]: true
        };
    }

    GetEffectAttachType(): ParticleAttachment {
        return ParticleAttachment.OVERHEAD_FOLLOW;
    }

    GetOverrideAnimation(): GameActivity {
        return GameActivity.DOTA_STUN_STATUE;
    }

    GetEffectName(): string {
        return "particles/generic_gameplay/generic_bashed_d.vpcf";
    }

    override OnCreated(): void {
        if (IsClient()) {
            return;
        }

        CustomEvents.RegisterEventHandler(CustomEvent.CUSTOM_EVENT_ON_ORDER, (data) => this.OnCustomOrder(data as ExecuteOrderFilterEvent));

        this.StartIntervalThink(1);
    }

    private OnCustomOrder(kv: ExecuteOrderFilterEvent) {
        if (kv.order_type == undefined) {
            return;
        }

        if (kv.order_type == UnitOrder.ATTACK_TARGET) {
            const attacker = PlayerResource.GetSelectedHeroEntity(kv.issuer_player_id_const);
            const target = PlayerResource.GetSelectedHeroEntity(
                (EntIndexToHScript(kv.entindex_target) as CDOTA_BaseNPC).GetPlayerOwnerID()
            );
            if (attacker == undefined || target == undefined) {
                return;
            }
            if (attacker.GetTeamNumber() != target.GetTeamNumber()) {
                return;
            }

            if (target.FindModifierByName(this.GetName()) == undefined) {
                return;
            }

            const ability = attacker.FindAbilityByName("resurrection_custom") as CDOTABaseAbilityResurection;
            if (ability != undefined) {
                ability.StartResurrection(target);
            }
        }

        return;
    }

    OnIntervalThink(): void {
        if (this.parent.GetHealth() == this.parent.GetMaxHealth()) {
            this.Destroy();
        }

        ApplyDamage({
            attacker: this.caster,
            victim: this.parent,
            damage_type: DamageTypes.PURE,
            damage_flags: DamageFlag.NONE,
            damage: 35
        });
    }
}

interface CDOTABaseAbilityResurection extends CDOTABaseAbility {
    StartResurrection: (target: CDOTA_BaseNPC_Hero) => void;
}
