import { BaseAbility, registerAbility } from "../../../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../../../libraries/dota_ts_adapter";

@registerAbility()
export class ancient_apparition_ice_blast_custom extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();
    Precache(context: CScriptPrecacheContext): void {
        PrecacheResource(PrecacheType.PARTICLE, "particles/units/heroes/hero_crystalmaiden/maiden_crystal_nova.vpcf", context);
        PrecacheResource(PrecacheType.PARTICLE, "particles/status_fx/status_effect_frost.vpcf", context);
        PrecacheResource(
            PrecacheType.PARTICLE,
            "particles/units/heroes/hero_ancient_apparition/ancient_apparition_ice_blast_death.vpcf",
            context
        );
        PrecacheResource(
            PrecacheType.PARTICLE,
            "particles/units/heroes/hero_ancient_apparition/ancient_apparition_ice_blast_debuff.vpcf",
            context
        );
        PrecacheResource(
            PrecacheType.PARTICLE,
            "particles/units/heroes/hero_ancient_apparition/ancient_apparition_ice_blast_final.vpcf",
            context
        );
    }

    GetAOERadius(): number {
        return this.GetSpecialValueFor("radius");
    }

    override OnSpellStart(): void {
        EmitSoundOn("Hero_Ancient_Apparition.IceBlastRelease.Cast", this.caster);
        const point = this.GetCursorPosition();
        const vector = (point - this.caster.GetAbsOrigin()) as Vector;
        const velocity = (vector.Normalized() * math.max(vector.Length2D() / this.GetSpecialValueFor("delay_effect"), 750)) as Vector;
        const pfx = ParticleManager.CreateParticle(
            "particles/units/heroes/hero_ancient_apparition/ancient_apparition_ice_blast_final.vpcf",
            ParticleAttachment.WORLDORIGIN,
            this.caster
        );
        ParticleManager.SetParticleControl(pfx, 0, this.caster.GetAbsOrigin());
        ParticleManager.SetParticleControl(pfx, 1, velocity);
        ParticleManager.SetParticleControl(pfx, 5, Vector(vector.Length2D(), 0, 0));

        const delay =
            CalculateDistance(point, this.caster.GetAbsOrigin()) /
            math.max(vector.Length2D() / this.GetSpecialValueFor("delay_effect"), 750);
        Timers.CreateTimer(delay, () => {
            ParticleManager.DestroyAndReleaseParticle(pfx);
            CreateModifierThinker(
                this.caster,
                this,
                modifierThinker_ancient_apparition_ice_blast_custom.name,
                { duration: this.GetSpecialValueFor("duration") },
                point,
                this.caster.GetTeamNumber(),
                false
            );
        });
    }
}

@registerModifier()
export class modifierThinker_ancient_apparition_ice_blast_custom extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    radius!: number;
    visionAoe!: number;
    iceBlastDuration!: number;
    targetFlags!: UnitTargetFlags;
    targetTeam!: UnitTargetTeam;
    targetType!: UnitTargetType;

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

    GetModifierAura(): string {
        return modifier_ancient_apparition_ice_blast_custom.name;
    }

    override OnCreated(): void {
        this.OnRefresh();
        if (!IsServer()) {
            return;
        }
        this.targetTeam = this.ability.GetAbilityTargetTeam();
        this.targetType = this.ability.GetAbilityTargetType();
        this.targetFlags = this.ability.GetAbilityTargetFlags();
        EmitSoundOn("Hero_Ancient_Apparition.IceBlast.Target", this.parent);
        const pfx = ParticleManager.CreateParticle(
            "particles/units/heroes/hero_crystalmaiden/maiden_crystal_nova.vpcf",
            ParticleAttachment.WORLDORIGIN,
            this.parent
        );
        ParticleManager.SetParticleControl(pfx, 0, this.parent.GetAbsOrigin());
        ParticleManager.SetParticleControl(pfx, 1, Vector(this.radius, this.iceBlastDuration, this.radius));
        ParticleManager.DestroyAndReleaseParticle(pfx);

        AddFOWViewer(this.caster.GetTeamNumber(), this.parent.GetAbsOrigin(), this.visionAoe, this.iceBlastDuration, false);
    }

    OnRefresh(): void {
        this.radius = this.ability.GetSpecialValueFor("radius");
        this.visionAoe = this.ability.GetSpecialValueFor("vision_aoe");
        this.iceBlastDuration = this.ability.GetSpecialValueFor("duration");
    }

    OnDestroy(): void {
        if (!IsServer()) {
            return;
        }

        this.parent.RemoveSelf;
    }
}

@registerModifier()
export class modifier_ancient_apparition_ice_blast_custom extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    interval!: number;
    damage!: number;
    movementSpeedPct!: number;
    damageTable!: ApplyDamageOptions;
    giveMana!: number;
    killPct!: number;
    stunDuration!: number;
    stunInterval!: number;
    timer!: number;
    chance!: number;

    // Modifier specials

    override IsHidden() {
        if (this.parent.GetTeamNumber() == this.caster.GetTeamNumber()) {
            return true;
        }
        return false;
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

    override GetEffectName(): string {
        if (this.parent.GetTeamNumber() != this.caster.GetTeamNumber()) {
            return "particles/units/heroes/hero_ancient_apparition/ancient_apparition_ice_blast_debuff.vpcf";
        }
        return "";
    }

    override GetStatusEffectName(): string {
        if (this.parent.GetTeamNumber() != this.caster.GetTeamNumber()) {
            return "particles/status_fx/status_effect_frost.vpcf";
        }
        return "";
    }

    GetAttributes(): ModifierAttribute {
        return ModifierAttribute.MULTIPLE;
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.MOVESPEED_BONUS_PERCENTAGE, ModifierFunction.DISABLE_HEALING, ModifierFunction.ON_TAKEDAMAGE_KILLCREDIT];
    }

    GetModifierMoveSpeedBonus_Percentage(): number {
        if (this.parent.GetTeamNumber() != this.caster.GetTeamNumber()) {
            return this.movementSpeedPct;
        }
        return 0;
    }

    GetDisableHealing(): 0 | 1 {
        if (this.parent.GetTeamNumber() != this.caster.GetTeamNumber()) {
            return 1;
        }
        return 0;
    }

    override OnCreated(): void {
        this.OnRefresh();
    }

    OnRefresh(): void {
        this.interval = this.ability.GetSpecialValueFor("interval");
        this.damage = this.ability.GetSpecialValueFor("damage");
        this.movementSpeedPct = -1 * this.ability.GetSpecialValueFor("movement_speed_pct");
        this.giveMana = this.ability.GetSpecialValueFor("give_mana");
        this.killPct = this.ability.GetSpecialValueFor("kill_pct") / 100;
        this.stunDuration = this.ability.GetSpecialValueFor("talent_stun_duration");
        this.stunInterval = this.ability.GetSpecialValueFor("talent_stun_interval");
        this.chance = this.ability.GetSpecialValueFor("talent_instant_kill_chance");
        this.timer = 0;
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

        this.StartIntervalThink(this.interval);
    }

    OnIntervalThink(): void {
        if (!this.parent.HasModifier(modifier_ancient_apparition_ice_blast_custom_stun.name)) {
            this.timer += this.interval;
        }
        if (this.parent.GetTeamNumber() != this.caster.GetTeamNumber()) {
            EmitSoundOn("Hero_Ancient_Apparition.IceBlastRelease.Tick", this.parent);
            const damage = this.damage * (this.caster.GetSpellAmplification(false) + 1);
            this.damageTable.damage = damage * this.interval;
            ApplyDamage(this.damageTable);
            if (this.caster.HasTalent("talent_ancient_apparition_ice_blast_instant_kill")) {
                if (RollPseudoRandomPercentage(this.chance, this.ability) && !this.parent.IsBoss()) {
                    this.parent.Kill(this.ability, this.caster);
                }
            }
            if (this.timer >= this.stunInterval && this.caster.HasTalent("talent_ancient_apparition_ice_blast_stun_for_time")) {
                this.parent.AddNewModifier(this.caster, this.ability, modifier_ancient_apparition_ice_blast_custom_stun.name, {
                    duration: this.stunDuration
                });
                this.timer = 0;
            }
        } else {
            this.parent.GiveMana(this.giveMana * this.interval);
        }
    }

    OnTakeDamageKillCredit(kv: ModifierAttackEvent): void {
        if (
            kv.attacker.GetTeamNumber() == this.caster.GetTeamNumber() &&
            this.parent.GetHealth() < this.parent.GetMaxHealth() * this.killPct &&
            this.parent.GetTeamNumber() != this.caster.GetTeamNumber()
        ) {
            this.parent.Kill(this.ability, kv.attacker);
        }

        if (!this.parent.IsAlive && this.parent.GetTeamNumber() != this.caster.GetTeamNumber()) {
            const pfx = ParticleManager.CreateParticle(
                "particles/units/heroes/hero_ancient_apparition/ancient_apparition_ice_blast_death.vpcf",
                ParticleAttachment.ABSORIGIN_FOLLOW,
                this.parent
            );
            ParticleManager.DestroyAndReleaseParticle(pfx);
        }
    }
}

@registerModifier()
export class modifier_ancient_apparition_ice_blast_custom_stun extends BaseModifier {
    // Modifier properties
    private parent: CDOTA_BaseNPC = this.GetParent();

    // Modifier specials

    override IsHidden() {
        return false;
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

    GetEffectName(): string {
        return "particles/units/heroes/hero_ancient_apparition/ancient_apparition_cold_feet_frozen.vpcf";
    }

    GetEffectAttachType(): ParticleAttachment {
        return ParticleAttachment.OVERHEAD_FOLLOW;
    }

    CheckState(): Partial<Record<ModifierState, boolean>> {
        return {
            [ModifierState.STUNNED]: true,
            [ModifierState.FROZEN]: true
        };
    }

    override OnCreated(): void {
        if (!IsServer()) {
            return;
        }

        this.parent.EmitSound("Hero_Ancient_Apparition.ColdFeetFreeze");
    }
}
