import { BaseAbility, registerAbility } from "../../../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../../../libraries/dota_ts_adapter";

@registerAbility()
export class griffin_sound_spikes extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();
    public unitData: CDOTA_BaseNPC[] = [];
    position!: Vector;

    Spawn(): void {
        if (!IsServer()) {
            return;
        }
        this.SetLevel(1);
    }

    override OnSpellStart(): void {
        this.position = this.GetCursorPosition();
    }

    OnChannelFinish(interrupted: boolean): void {
        if (interrupted == true) {
            return;
        }
        if (this.unitData.length >= this.GetSpecialValueFor("max_spikes")) {
            this.unitData[0].Kill(undefined, this.caster);
            this.unitData = this.unitData.filter((unit) => unit.IsAlive());
        }

        const unit = CreateUnitByName("npc_dota_rattletrap_cog", this.position, true, this.caster, this.caster, this.caster.GetTeam());
        unit.AddNewModifier(this.caster, this, modifier_griffin_sound_spikes.name, { duration: -1 });
        this.unitData.push(unit);
    }
}

@registerModifier()
export class modifier_griffin_sound_spikes extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: griffin_sound_spikes = this.GetAbility()! as griffin_sound_spikes;
    private parent: CDOTA_BaseNPC = this.GetParent();

    IsInvisible = true;
    targetFlags!: UnitTargetFlags;
    targetType!: UnitTargetType;
    targetTeam!: UnitTargetTeam;
    radius!: number;
    timer!: string;
    timeActivation!: number;
    damage!: number;
    damgeTable!: ApplyDamageOptions;
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

    CheckState(): Partial<Record<modifierstate, boolean>> {
        return {
            [ModifierState.INVISIBLE]: this.IsInvisible
        };
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
        this.radius = this.ability.GetSpecialValueFor("radius");
        this.timeActivation = this.ability.GetSpecialValueFor("time_activation");
        this.damage = this.ability.GetSpecialValueFor("damage");
        if (!IsServer()) {
            return;
        }
        this.damgeTable = {
            victim: undefined,
            attacker: this.caster,
            damage: 0,
            ability: this.ability,
            damage_type: this.ability.GetAbilityDamageType(),
            damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION
        };
        this.StartIntervalThink(FrameTime());
    }

    OnIntervalThink(): void {
        const enemies = FindUnitsInRadius(
            this.parent.GetTeamNumber(),
            this.parent.GetAbsOrigin(),
            undefined,
            this.radius,
            this.targetTeam,
            this.targetType,
            this.targetFlags,
            FindOrder.ANY,
            false
        );

        if (enemies.length > 0) {
            if (this.IsInvisible == true) {
                this.IsInvisible = false;
                this.timer = Timers.CreateTimer(this.timeActivation, () => {
                    GameRules.ExecuteTeamPing(
                        this.parent.GetTeam(),
                        this.parent.GetAbsOrigin().x,
                        this.parent.GetAbsOrigin().y,
                        this.caster,
                        0
                    );
                    AddFOWViewer(this.parent.GetTeam(), this.parent.GetAbsOrigin(), this.radius, 3, false);
                    this.damgeTable.damage = this.damage * (1 + this.caster.GetSpellAmplification(false));
                    for (const target of enemies) {
                        this.damgeTable.victim = target;
                        ApplyDamage(this.damgeTable);
                    }
                    this.parent.Kill(undefined, this.parent);
                    this.ability.unitData = this.ability.unitData.filter((unit) => unit.IsAlive());
                });
            }
        } else {
            this.IsInvisible = true;
            if (this.timer != undefined) {
                Timers.RemoveTimer(this.timer);
            }
        }
    }

    OnDestroy(): void {
        if (this.timer != undefined) {
            Timers.RemoveTimer(this.timer);
        }
    }
}
