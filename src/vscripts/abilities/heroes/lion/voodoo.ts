import { BaseAbility, registerAbility } from "../../../libraries/dota_ts_adapter";
import { BaseModifier, registerModifier } from "../../../libraries/dota_ts_adapter";

@registerAbility()
export class lion_voodoo_custom extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();

    GetBehavior(): AbilityBehavior | Uint64 {
        let behavior = AbilityBehavior.UNIT_TARGET;
        if (this.caster.HasTalent("talent_lion_voodoo_custom_aoe")) {
            behavior = behavior + AbilityBehavior.POINT + AbilityBehavior.AOE;
        }
        if (this.caster.HasTalent("talent_lion_voodoo_custom_autocast")) {
            behavior = behavior + AbilityBehavior.AUTOCAST;
        }
        return behavior;
    }

    GetAOERadius(): number {
        return this.GetSpecialValueFor("talent_aoe_radius");
    }

    GetCooldown(level: number): number {
        if (!IsServer()) {
            return super.GetCooldown(level);
        }
        if (this.GetAutoCastState()) {
            return super.GetCooldown(level) - this.GetSpecialValueFor("talent_autocast_cooldown");
        }
        return super.GetCooldown(level);
    }

    override OnSpellStart(): void {
        const target = this.GetCursorTarget()!;

        if (target.TriggerSpellAbsorb(this) && !this.caster.HasTalent("talent_lion_voodoo_custom_aoe")) {
            return;
        }

        if (this.caster.HasTalent("talent_lion_voodoo_custom_aoe")) {
            const enemies = FindUnitsInRadius(
                this.caster.GetTeamNumber(),
                this.GetCursorPosition(),
                undefined,
                this.GetSpecialValueFor("talent_aoe_radius"),
                this.GetAbilityTargetTeam(),
                this.GetAbilityTargetType(),
                this.GetAbilityTargetFlags(),
                FindOrder.ANY,
                false
            );

            for (const enemy of enemies) {
                enemy.AddNewModifier(this.caster, this, modifier_lion_voodoo_custom_debuff.name, <LionVoodooCustomDebuffData>{
                    duration: this.GetSpecialValueFor("duration"),
                    isAutoCast: this.GetAutoCastState()
                });
            }
        } else {
            target.AddNewModifier(this.caster, this, modifier_lion_voodoo_custom_debuff.name, <LionVoodooCustomDebuffData>{
                duration: this.GetSpecialValueFor("duration"),
                isAutoCast: this.GetAutoCastState()
            });
        }
    }
}

interface LionVoodooCustomDebuffData {
    isAutoCast: number | boolean;
}

@registerModifier()
export class modifier_lion_voodoo_custom_debuff extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC_Hero = this.GetCaster()! as CDOTA_BaseNPC_Hero;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    damageTable!: ApplyDamageOptions;
    dmgPerSec!: number;
    intToDmgPerSecPct!: number;
    interval!: number;
    movespeed!: number;
    talentAutocastDmgIncreasePct!: number;
    isAutoCast!: boolean;

    // Modifier specials

    override IsHidden() {
        return false;
    }
    override IsDebuff() {
        return true;
    }
    CheckState(): Partial<Record<ModifierState, boolean>> {
        return {
            [ModifierState.HEXED]: !this.isAutoCast,
            [ModifierState.DISARMED]: !this.isAutoCast,
            [ModifierState.SILENCED]: !this.isAutoCast,
            [ModifierState.MUTED]: !this.isAutoCast
        };
    }
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.MOVESPEED_ABSOLUTE, ModifierFunction.MODEL_CHANGE];
    }

    GetModifierMoveSpeed_Absolute(): number {
        if (this.isAutoCast) {
            return this.parent.GetBaseMoveSpeed();
        }
        return this.movespeed;
    }

    GetModifierModelChange(): string {
        if (this.isAutoCast) {
            return this.parent.GetModelName();
        }
        return "models/props_gameplay/frog.vmdl";
    }

    override OnCreated(kv: LionVoodooCustomDebuffData): void {
        if (this.parent.IsIllusion()) {
            this.parent.Kill(this.ability, this.caster);
        }
        EmitSoundOn("Hero_Lion.Voodoo", this.caster);
        this.OnRefresh();
        this.isAutoCast = kv.isAutoCast == 1;
        if (!IsServer()) {
            return;
        }
        this.damageTable = {
            attacker: this.caster,
            damage: 0,
            damage_type: this.ability.GetAbilityDamageType(),
            ability: this.ability,
            damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION,
            victim: this.parent
        };
        this.StartIntervalThink(this.interval);
    }

    OnRefresh(): void {
        this.dmgPerSec = this.ability.GetSpecialValueFor("dmg_per_sec");
        this.intToDmgPerSecPct = this.ability.GetSpecialValueFor("int_to_dmg_per_sec_pct");
        this.interval = this.ability.GetSpecialValueFor("interval");
        this.movespeed = this.ability.GetSpecialValueFor("movespeed");
        this.talentAutocastDmgIncreasePct = this.ability.GetSpecialValueFor("talent_autocast_dmg_increase_pct");
    }

    OnIntervalThink(): void {
        let damage = this.dmgPerSec;
        damage = damage * (this.caster.GetSpellAmplification(false) + 1);
        damage = damage + (this.caster.GetIntellect() / 100) * this.intToDmgPerSecPct;
        if (this.isAutoCast) {
            damage = damage + (damage / 100) * this.talentAutocastDmgIncreasePct;
        }
        damage = damage * this.interval;
        this.damageTable.damage = damage;
        ApplyDamage(this.damageTable);
    }
}
