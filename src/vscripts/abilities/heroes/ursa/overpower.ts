import { AbilityTargetsIndex } from "../../../libraries/ability_targets";
import { BaseAbility, registerAbility } from "../../../libraries/dota_ts_adapter";
import { BaseModifier, registerModifier } from "../../../libraries/dota_ts_adapter";

@registerAbility()
export class ursa_overpower_custom extends BaseAbility {
    // Ability properties
    caster: CDOTA_BaseNPC = this.GetCaster();

    Precache(context: CScriptPrecacheContext) {
        PrecacheResource(PrecacheType.PARTICLE, "particles/units/heroes/hero_ursa/ursa_overpower_buff.vpcf", context);
        PrecacheResource(PrecacheType.PARTICLE, "particles/status_fx/status_effect_overpower.vpcf", context);
    }

    GetAbilityTargetTeam(index?: AbilityTargetsIndex): UnitTargetTeam {
        if (this.caster.HasTalent("talent_ursa_overpower_instant_kill")) {
            return UnitTargetTeam.ENEMY;
        } else {
            return super.GetAbilityTargetTeam(index);
        }
    }

    GetAbilityTargetType(index?: AbilityTargetsIndex): UnitTargetType {
        if (this.caster.HasTalent("talent_ursa_overpower_instant_kill")) {
            return UnitTargetType.BASIC + UnitTargetType.HERO;
        } else {
            return super.GetAbilityTargetType(index);
        }
    }

    OnSpellStart(): void {
        if (this.caster.HasTalent("talent_ursa_overpower_stacks_in_duration")) {
            if (this.caster.HasModifier(modifier_ursa_overpower_custom.name)) {
                this.caster.RemoveModifierByName(modifier_ursa_overpower_custom.name);
            }
            this.caster.AddNewModifier(this.caster, this, modifier_ursa_overpower_custom.name, {
                duration: this.GetSpecialValueFor("attack_count") * (this.GetSpecialValueFor("talent_stacks_in_duration_pct") / 100)
            });
        } else {
            const modifier = this.caster.AddNewModifier(this.caster, this, modifier_ursa_overpower_custom.name, { duration: -1 });
            modifier?.SetStackCount(this.GetSpecialValueFor("attack_count"));
        }
        EmitSoundOn("Hero_Ursa.Overpower", this.caster);
    }
}

@registerModifier()
export class modifier_ursa_overpower_custom extends BaseModifier {
    // Modifier properties
    caster: CDOTA_BaseNPC = this.GetCaster()!;
    ability: CDOTABaseAbility = this.GetAbility()!;
    parent: CDOTA_BaseNPC = this.GetParent();
    bonusAttackSpeedPct!: number;
    chance!: number;
    damagePctPerMaxHealthBoss!: number;
    damageTable!: ApplyDamageOptions;
    targetTeam!: UnitTargetTeam;
    targetType!: UnitTargetType;
    targetFlags!: UnitTargetFlags;
    attackCount!: number;

    // Modifier specials

    IsHidden() {
        return false;
    }
    IsDebuff() {
        return false;
    }
    IsPurgable() {
        return false;
    }
    IsPurgeException() {
        return false;
    }

    GetStatusEffectName(): string {
        return "particles/status_fx/status_effect_overpower.vpcf";
    }

    StatusEffectPriority(): ModifierPriority {
        return ModifierPriority.NORMAL;
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.ATTACKSPEED_PERCENTAGE, ModifierFunction.ON_ATTACK_LANDED];
    }

    GetModifierAttackSpeedPercentage(): number {
        return this.bonusAttackSpeedPct;
    }

    OnCreated(): void {
        this.OnRefresh();
        if (!IsServer()) {
            return;
        }
        this.targetTeam = this.ability.GetAbilityTargetTeam();
        this.targetType = this.ability.GetAbilityTargetType();
        this.targetFlags = this.ability.GetAbilityTargetFlags();

        this.damageTable = {
            attacker: this.caster,
            victim: this.caster,
            damage: 0,
            damage_type: DamageTypes.PURE,
            ability: this.ability,
            damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION
        };

        const particle_earthshock = "particles/units/heroes/hero_ursa/ursa_overpower_buff.vpcf";
        const particle_earthshock_fx = ParticleManager.CreateParticle(particle_earthshock, ParticleAttachment.ABSORIGIN, this.caster);
        this.AddParticle(particle_earthshock_fx, false, false, -1, true, false);
    }

    OnRefresh(): void {
        this.bonusAttackSpeedPct = this.ability.GetSpecialValueFor("bonus_attack_speed_pct");
        this.attackCount = this.ability.GetSpecialValueFor("attack_count");
        this.chance = this.ability.GetSpecialValueFor("talent_chance");
        this.damagePctPerMaxHealthBoss = this.ability.GetSpecialValueFor("talent_damage_pct_per_max_health_boss") / 100;
    }

    OnAttackLanded(kv: ModifierAttackEvent): void {
        if (this.parent != kv.attacker) {
            return;
        }

        if (!this.parent.HasTalent("talent_ursa_overpower_stacks_in_duration")) {
            const stack = this.GetStackCount();
            this.SetStackCount(stack - 1);
            if (stack == 0) {
                this.parent.RemoveModifierByName(modifier_ursa_overpower_custom.name);
            }
        } else {
            if (this.GetStackCount() != 0) {
                this.parent.RemoveModifierByName(modifier_ursa_overpower_custom.name);
            }
        }
        if (!this.parent.HasTalent("talent_ursa_overpower_instant_kill")) {
            return;
        }
        if (this.parent.IsIllusion()) {
            return;
        }
        if (
            UnitFilter(kv.target, this.targetTeam, this.targetType, this.targetFlags, this.parent.GetTeamNumber()) !=
            UnitFilterResult.SUCCESS
        ) {
            return;
        }
        if (RollPseudoRandomPercentage(this.chance, this.ability) == false) {
            return;
        }
        if (kv.target.IsBoss()) {
            const damage = kv.target.GetMaxHealth() * this.damagePctPerMaxHealthBoss;
            this.damageTable.damage = damage;
            this.damageTable.victim = kv.target;
            ApplyDamage(this.damageTable);
        } else {
            kv.target.Kill(this.ability, this.parent);
        }
    }
}
