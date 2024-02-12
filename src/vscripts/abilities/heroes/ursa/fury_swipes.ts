import { BaseAbility, registerAbility } from "../../../libraries/dota_ts_adapter";
import { BaseModifier, registerModifier } from "../../../libraries/dota_ts_adapter";
import { modifier_bashed } from "../../../modifiers/modifier_bashed";

@registerAbility()
export class ursa_fury_swipes_custom extends BaseAbility {
    Precache(context: CScriptPrecacheContext) {
        PrecacheResource(PrecacheType.PARTICLE, "particles/units/heroes/hero_ursa/ursa_fury_swipes_debuff.vpcf", context);
    }

    GetIntrinsicModifierName() {
        return modifier_ursa_fury_swipes_custom.name;
    }
}

@registerModifier()
export class modifier_ursa_fury_swipes_custom extends BaseModifier {
    // Modifier properties
    caster: CDOTA_BaseNPC = this.GetCaster()!;
    ability: CDOTABaseAbility = this.GetAbility()!;
    parent: CDOTA_BaseNPC = this.GetParent() as CDOTA_BaseNPC_Hero;
    targetTeam!: number;
    targetType!: number;
    targetFlags!: number;
    duration!: number;
    damagePerStack!: number;
    stunDuration!: number;
    stackForStun!: number;
    damageTable!: {
        victim: CDOTA_BaseNPC;
        attacker: CDOTA_BaseNPC;
        damage: number;
        ability: CDOTABaseAbility;
        damage_type: DamageTypes;
        damage_flags: DamageFlag;
    };
    // Modifier specials

    IsHidden() {
        return true;
    }
    IsDebuff() {
        return false;
    }
    RemoveOnDeath() {
        return true;
    }
    IsPurgable() {
        return false;
    }
    IsPurgeException() {
        return false;
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.PROCATTACK_BONUS_DAMAGE_PHYSICAL, ModifierFunction.ON_ATTACK_LANDED];
    }

    OnCreated(): void {
        // Modifier specials
        this.OnRefresh();
        if (!IsServer()) {
            return;
        }
        this.targetTeam = this.ability.GetAbilityTargetTeam();
        this.targetType = this.ability.GetAbilityTargetType();
        this.targetFlags = this.ability.GetAbilityTargetFlags();
    }

    OnRefresh(): void {
        this.duration = this.ability.GetSpecialValueFor("duration");
        this.damagePerStack = this.ability.GetSpecialValueFor("damage_per_stack");
        this.stackForStun = this.ability.GetSpecialValueFor("talent_stack_for_stun");
        this.stunDuration = this.ability.GetSpecialValueFor("talent_stun_duration");
        if (!IsServer()) {
            return;
        }

        this.damageTable = {
            victim: this.parent,
            attacker: this.caster,
            damage: 0,
            ability: this.ability,
            damage_type: this.ability.GetAbilityDamageType(),
            damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION
        };
    }

    OnAttackLanded(kv: ModifierAttackEvent): void {
        if (!IsServer()) {
            return;
        }
        if (this.caster != kv.attacker || this.caster.IsIllusion()) {
            return;
        }
        if (
            UnitFilter(kv.target, this.targetTeam, this.targetType, this.targetFlags, this.caster.GetTeamNumber()) !=
            UnitFilterResult.SUCCESS
        ) {
            return;
        }
        if (!this.caster.HasShard()) {
            return;
        }

        const enemies = FindUnitsInRadius(
            this.caster.GetTeamNumber(),
            kv.target.GetAbsOrigin(),
            undefined,
            this.ability.GetSpecialValueFor("radius"),
            this.targetTeam,
            this.targetType,
            this.targetFlags,
            FindOrder.ANY,
            false
        );

        enemies.forEach((target) => {
            if (kv.target != target) {
                kv.target = target;

                this.GetModifierProcAttack_BonusDamage_Physical(kv);
                this.damageTable.victim = target;
                this.damageTable.damage =
                    target.GetModifierStackCount(modifier_ursa_fury_swipes_custom_debuff.name, this.caster) * this.damagePerStack;
                ApplyDamage(this.damageTable);
            }
        });
    }

    GetModifierProcAttack_BonusDamage_Physical(kv: ModifierAttackEvent): number {
        if (!IsServer()) {
            return 0;
        }
        if (this.caster != kv.attacker || this.caster.IsIllusion()) {
            return 0;
        }
        if (
            UnitFilter(kv.target, this.targetTeam, this.targetType, this.targetFlags, this.caster.GetTeamNumber()) !=
            UnitFilterResult.SUCCESS
        ) {
            return 0;
        }
        const modifier = kv.target.AddNewModifier(this.caster, this.ability, modifier_ursa_fury_swipes_custom_debuff.name, {
            duration: this.duration
        });
        if (modifier != undefined) {
            modifier.IncrementStackCount();
            if (this.caster.HasTalent("talent_ursa_fury_swipes_stun_per_stack")) {
                if (modifier.GetStackCount() % this.stackForStun == 0) {
                    kv.target.AddNewModifier(this.caster, this.ability, modifier_bashed.name, { duration: this.stunDuration });
                }
            }
        }
        return kv.target.GetModifierStackCount(modifier_ursa_fury_swipes_custom_debuff.name, this.caster) * this.damagePerStack;
    }
}

@registerModifier()
export class modifier_ursa_fury_swipes_custom_debuff extends BaseModifier {
    // Modifier properties
    caster: CDOTA_BaseNPC = this.GetCaster()!;
    ability: CDOTABaseAbility = this.GetAbility()!;
    parent: CDOTA_BaseNPC = this.GetParent();
    intervalThink!: number;
    particle_fury_swipes = "particles/units/heroes/hero_ursa/ursa_fury_swipes_debuff.vpcf";
    particle_fury_swipes_fx?: ParticleID;
    damageTable!: ApplyDamageOptions;
    damagePerLostHealth!: number;

    // Modifier specials

    IsHidden() {
        return false;
    }
    IsDebuff() {
        return true;
    }
    IsPurgable() {
        return false;
    }
    IsPurgeException() {
        return false;
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.TOOLTIP];
    }

    OnTooltip(): number {
        return this.GetStackCount() * this.ability.GetSpecialValueFor("damage_per_stack");
    }

    OnCreated(): void {
        this.OnRefresh();
        this.particle_fury_swipes_fx = ParticleManager.CreateParticle(
            this.particle_fury_swipes,
            ParticleAttachment.OVERHEAD_FOLLOW,
            this.parent
        );
        ParticleManager.SetParticleControlEnt(
            this.particle_fury_swipes_fx,
            1,
            this.parent,
            ParticleAttachment.ABSORIGIN_FOLLOW,
            ParticleAttachmentLocation.HITLOC,
            this.parent.GetAbsOrigin(),
            true
        );
        this.AddParticle(this.particle_fury_swipes_fx, false, false, -1, false, true);
    }

    OnRefresh(): void {
        if (!IsServer()) {
            return;
        }
        if (!this.parent.IsAlive()) {
            return;
        }
        if (this.caster.HasTalent("talent_ursa_fury_swipes_bleeding")) {
            this.intervalThink = this.ability.GetSpecialValueFor("talent_tick_interval");
            this.damagePerLostHealth = this.ability.GetSpecialValueFor("talent_damage_per_lost_healt_pct") / 100;
            this.damageTable = {
                attacker: this.caster,
                damage: 0,
                damage_type: DamageTypes.PURE,
                ability: this.ability,
                damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION,
                victim: this.parent
            };
            this.StartIntervalThink(this.intervalThink);
        }
    }

    OnIntervalThink(): void {
        this.damageTable.damage = (this.parent.GetMaxHealth() - this.parent.GetHealth()) * this.damagePerLostHealth * this.intervalThink;
        ApplyDamage(this.damageTable);
    }
}
