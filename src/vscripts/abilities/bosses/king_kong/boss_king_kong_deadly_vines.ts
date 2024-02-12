import { BossData } from "../../../common/data/creep_spawner";
import { BaseAbility, registerAbility } from "../../../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../../../libraries/dota_ts_adapter";

@registerAbility()
export class boss_king_kong_deadly_vines extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();

    override OnSpellStart(): void {
        const maxCastRadius = this.GetSpecialValueFor("max_cast_radius");
        const minCastRadius = this.GetSpecialValueFor("min_cast_radius");
        const countVines = this.GetSpecialValueFor("count_vines");
        const radius = this.GetSpecialValueFor("radius");
        const delay = this.GetSpecialValueFor("delay");
        for (let currentSpawn = 0; currentSpawn < countVines; currentSpawn++) {
            const point = (this.caster.GetAbsOrigin() + RandomVector(RandomInt(minCastRadius, maxCastRadius))) as Vector;
            const pfx = CastAoeStaticParticle(this.caster, point, delay, radius);

            Timers.CreateTimer(delay, () => {
                ParticleManager.DestroyAndReleaseParticle(pfx);
                CreateModifierThinker(
                    this.caster,
                    this,
                    ModifierThinker_boss_king_kong_deadly_vines.name,
                    { duration: this.GetDuration() },
                    point,
                    this.caster.GetTeamNumber(),
                    false
                );
            });
        }
    }
}

@registerModifier()
export class ModifierThinker_boss_king_kong_deadly_vines extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    targetFlags!: UnitTargetFlags;
    targetTeam!: UnitTargetTeam;
    targetType!: UnitTargetType;
    auraRadius!: number;
    radius!: number;
    debuffDuration!: number;

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

    override IsAura(): boolean {
        return true;
    }

    GetAuraSearchFlags(): UnitTargetFlags {
        return this.targetFlags;
    }

    GetAuraSearchTeam(): UnitTargetTeam {
        return this.targetTeam;
    }

    GetAuraSearchType(): UnitTargetType {
        return this.targetType;
    }

    GetAuraRadius(): number {
        return this.radius;
    }

    GetAuraDuration(): number {
        return this.debuffDuration;
    }

    GetModifierAura(): string {
        return modifier_boss_king_kong_deadly_vines_debuff.name;
    }

    GetEffectName(): string {
        return "particles/units/heroes/hero_treant/treant_bramble_root.vpcf";
    }

    GetEffectAttachType(): ParticleAttachment {
        return ParticleAttachment.ABSORIGIN_FOLLOW;
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
        this.debuffDuration = this.ability.GetSpecialValueFor("debuff_duration");
    }
}

@registerModifier()
export class modifier_boss_king_kong_deadly_vines_debuff extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    damageTable!: ApplyDamageOptions;
    slowPct!: number;
    missPct!: number;
    damageInterval!: number;
    damage!: number;
    increaseDamagePctPerDeath!: number;

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

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.MOVESPEED_BONUS_PERCENTAGE, ModifierFunction.MISS_PERCENTAGE];
    }

    GetModifierMoveSpeedBonus_Percentage(): number {
        return this.slowPct;
    }

    GetModifierMiss_Percentage(): number {
        return this.missPct;
    }

    override OnCreated(): void {
        this.OnRefresh();

        if (!IsServer()) {
            return;
        }
        this.damageTable = {
            victim: this.parent,
            attacker: this.caster,
            damage:
                (this.damage + this.damage * this.increaseDamagePctPerDeath * BossData.Targets[this.caster.GetUnitName()].Death) *
                (this.caster.GetSpellAmplification(false) + 1),
            ability: this.ability,
            damage_type: this.ability.GetAbilityDamageType(),
            damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION
        };
        this.StartIntervalThink(this.damageInterval);
    }

    override OnRefresh(): void {
        this.slowPct = -1 * this.ability.GetSpecialValueFor("slow_pct");
        this.missPct = this.ability.GetSpecialValueFor("miss_pct");
        this.damage = this.ability.GetSpecialValueFor("damage");
        this.increaseDamagePctPerDeath = 1 + this.ability.GetSpecialValueFor("increase_damage_pct_per_death") / 100;
        this.damageInterval = this.ability.GetSpecialValueFor("damage_interval");
    }

    OnIntervalThink(): void {
        ApplyDamage(this.damageTable);
    }
}
