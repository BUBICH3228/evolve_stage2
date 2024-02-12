import { BaseAbility, registerAbility } from "../../../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../../../libraries/dota_ts_adapter";

@registerAbility()
export class silencer_last_word_custom extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();
    enemies: CDOTA_BaseNPC[] = [];

    GetAOERadius(): number {
        if (this.caster.HasScepter()) {
            return this.GetSpecialValueFor("scepter_radius");
        }

        return super.GetAOERadius();
    }

    GetBehavior(): AbilityBehavior | Uint64 {
        if (this.caster.HasScepter()) {
            return AbilityBehavior.AOE + AbilityBehavior.UNIT_TARGET + AbilityBehavior.POINT;
        }

        return super.GetBehavior();
    }

    override OnSpellStart(targets?: CDOTA_BaseNPC[]): void {
        let enemies: CDOTA_BaseNPC[] = [];
        const target = this.GetCursorTarget()!;
        let point = this.GetCursorPosition();
        if (target != undefined) {
            point = target.GetAbsOrigin();
        }
        if (this.caster.HasScepter()) {
            enemies = FindUnitsInRadius(
                this.caster.GetTeamNumber(),
                point,
                undefined,
                this.GetSpecialValueFor("scepter_radius"),
                this.GetAbilityTargetTeam(),
                this.GetAbilityTargetType(),
                this.GetAbilityTargetFlags(),
                FindOrder.ANY,
                false
            );
        } else {
            enemies.push(target);
        }
        if (targets != undefined) {
            enemies = targets;
        }
        enemies.forEach((target) => {
            const modifier = target.AddNewModifier(this.caster, this, modifier_silencer_last_word_custom.name, {
                duration: this.GetSpecialValueFor("debuff_duration")
            });
            if (modifier != undefined) {
                modifier.IncrementIndependentStackCount();
            }

            if (this.caster.HasTalent("talent_silencer_last_word_instant_attack")) {
                this.caster.PerformAttack(target, true, true, true, true, true, false, true);
            }

            const direction = (target.GetAbsOrigin().Normalized() - this.caster.GetAbsOrigin().Normalized()) as Vector;
            const pfx = ParticleManager.CreateParticle(
                "particles/units/heroes/hero_silencer/silencer_last_word_status_cast.vpcf",
                ParticleAttachment.ABSORIGIN_FOLLOW,
                this.caster
            );
            ParticleManager.SetParticleControlEnt(
                pfx,
                0,
                this.caster,
                ParticleAttachment.POINT_FOLLOW,
                ParticleAttachmentLocation.ATTACK1,
                Vector(0, 0, 0),
                true
            );
            ParticleManager.SetParticleControlForward(pfx, 1, direction);
            ParticleManager.DestroyAndReleaseParticle(pfx);
        });

        EmitSoundOn("Hero_Silencer.LastWord.Cast", this.caster);
    }
}

@registerModifier()
export class modifier_silencer_last_word_custom extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC_Hero = this.GetCaster()! as CDOTA_BaseNPC_Hero;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC_Hero = this.GetParent() as CDOTA_BaseNPC_Hero;
    damageTable!: ApplyDamageOptions;
    damage!: number;
    intMultiplier!: number;
    duration!: number;
    damagePct!: number;
    talentInterval!: number;

    // Modifier specials

    override IsHidden() {
        return false;
    }
    override IsDebuff() {
        return true;
    }

    GetEffectName(): string {
        return "particles/units/heroes/hero_silencer/silencer_last_word_status.vpcf";
    }

    GetEffectAttachType(): ParticleAttachment {
        return ParticleAttachment.ABSORIGIN_FOLLOW;
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.ON_ABILITY_FULLY_CAST, ModifierFunction.PROVIDES_FOW_POSITION];
    }

    GetModifierProvidesFOWVision(): 0 | 1 {
        return 1;
    }

    override OnCreated(): void {
        this.OnRefresh();
        EmitSoundOn("Hero_Silencer.LastWord.Target", this.parent);
    }

    OnRefresh(): void {
        this.damage = this.ability.GetSpecialValueFor("damage");
        this.intMultiplier = this.ability.GetSpecialValueFor("int_multiplier");
        this.duration = this.ability.GetSpecialValueFor("duration");
        this.damagePct = this.ability.GetSpecialValueFor("talent_damage_pct") / 100;
        this.talentInterval = this.ability.GetSpecialValueFor("talent_interval");
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

        Timers.CreateTimer(this.ability.GetSpecialValueFor("debuff_duration"), () => {
            this.ApplyEffect();
        });
        if (this.caster.HasTalent("talent_silencer_last_word_deals_periodic_damage")) {
            this.StartIntervalThink(this.talentInterval);
        }
    }

    OnAbilityFullyCast(kv: ModifierAbilityEvent): void {
        if (!IsServer()) {
            return;
        }

        if (kv.unit != this.parent) {
            return;
        }

        if (kv.ability.IsItem()) {
            return;
        }

        this.ApplyEffect();
    }

    ApplyEffect(): void {
        const damage = this.damage * (this.caster.GetSpellAmplification(false) + 1) + this.intMultiplier * this.caster.GetIntellect();
        this.damageTable.damage = damage;
        ApplyDamage(this.damageTable);
        const pfx = ParticleManager.CreateParticle(
            "particles/units/heroes/hero_silencer/silencer_last_word_dmg.vpcf",
            ParticleAttachment.ABSORIGIN_FOLLOW,
            this.parent
        );
        ParticleManager.DestroyAndReleaseParticle(pfx);
        EmitSoundOn("Hero_Silencer.LastWord.Damage", this.parent);
        this.parent.AddNewModifier(this.caster, this.ability, modifier_silencer_last_word_custom_debuff.name, { duration: this.duration });
    }

    OnIntervalThink(): void {
        const damage =
            (this.damage * (this.caster.GetSpellAmplification(false) + 1) + this.intMultiplier * this.caster.GetIntellect()) *
            this.GetStackCount() *
            this.damagePct;
        this.damageTable.damage = damage;
        ApplyDamage(this.damageTable);
    }
}

@registerModifier()
export class modifier_silencer_last_word_custom_debuff extends BaseModifier {
    // Modifier specials

    override IsHidden() {
        return false;
    }
    override IsDebuff() {
        return true;
    }

    CheckState(): Partial<Record<ModifierState, boolean>> {
        return {
            [ModifierState.SILENCED]: true
        };
    }
}
