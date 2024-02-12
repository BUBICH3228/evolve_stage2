import { BaseAbility, registerAbility } from "../../../libraries/dota_ts_adapter";
import { BaseModifier, registerModifier } from "../../../libraries/dota_ts_adapter";

@registerAbility()
export class lion_mana_drain_custom extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();
    targets: Array<CDOTA_BaseNPC> = [];

    GetIntrinsicModifierName(): string {
        return modifier_lion_mana_drain_custom_aura.name;
    }

    Precache(context: CScriptPrecacheContext) {
        PrecacheResource(PrecacheType.PARTICLE, "particles/units/heroes/hero_lion/lion_spell_mana_drain.vpcf", context);
    }

    GetBehavior(): AbilityBehavior | Uint64 {
        if (this.caster.HasShard()) {
            return AbilityBehavior.POINT + AbilityBehavior.AOE;
        }
        return super.GetBehavior();
    }

    GetAOERadius(): number {
        return this.GetSpecialValueFor("aoe");
    }

    GetChannelTime(): number {
        return this.GetSpecialValueFor("duration");
    }

    override OnSpellStart(): void {
        const target = this.GetCursorTarget()!;
        let point = this.GetCursorPosition();

        if (target != undefined) {
            point = target.GetAbsOrigin();
        }

        if (this.caster.HasShard()) {
            const enemies = FindUnitsInRadius(
                this.caster.GetTeamNumber(),
                point,
                undefined,
                this.GetSpecialValueFor("aoe"),
                this.GetAbilityTargetTeam(),
                this.GetAbilityTargetType(),
                this.GetAbilityTargetFlags(),
                FindOrder.ANY,
                false
            );

            enemies.forEach((target) => {
                this.targets[this.targets.length] = target;
            });
        } else {
            this.targets[this.targets.length] = target;
        }

        this.targets.forEach((target) => {
            if (target.HasModifier(modifier_lion_mana_drain_custom_debuff.name)) {
                const modifier = target.FindModifierByName(modifier_lion_mana_drain_custom_debuff.name);
                modifier!.IncrementStackCount();
            }
            target.AddNewModifier(this.caster, this, modifier_lion_mana_drain_custom_debuff.name, { duration: this.GetChannelTime() });
        });

        EmitSoundOn("Hero_Lion.ManaDrain", this.caster);
    }

    OnChannelThink(): void {
        for (let index = 0; index < this.targets.length; index++) {
            if (this.targets[index] == null || this.targets[index] == undefined) {
                return;
            }
            if (
                !this.targets[index].HasModifier(modifier_lion_mana_drain_custom_debuff.name) ||
                CalculateDistance(this.caster, this.targets[index]) > this.GetSpecialValueFor("break_distance")
            ) {
                this.targets[index].RemoveModifierByName(modifier_lion_mana_drain_custom_debuff.name);
                this.targets.splice(index, 1);
            }
        }

        if (this.targets.length == 0) {
            this.caster.InterruptChannel();
        }
    }

    OnChannelFinish(): void {
        this.targets.forEach((target) => {
            if (target.HasModifier(modifier_lion_mana_drain_custom_debuff.name)) {
                target.RemoveModifierByName(modifier_lion_mana_drain_custom_debuff.name);
            }
        });

        this.targets = [];
        StopSoundOn("Hero_Lion.ManaDrain", this.caster);
    }
}

@registerModifier()
export class modifier_lion_mana_drain_custom_debuff extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC_Hero = this.GetCaster()! as CDOTA_BaseNPC_Hero;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    damageTable!: ApplyDamageOptions;
    movespeed_slow_pct!: number;
    drain_per_sec!: number;
    dmg_per_sec!: number;
    int_to_dmg_pct!: number;
    tick_interval!: number;
    talent_mult_if_cast_on_aura_target!: number;

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

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.MOVESPEED_BONUS_PERCENTAGE, ModifierFunction.TOOLTIP];
    }

    GetModifierMoveSpeedBonus_Percentage(): number {
        return this.movespeed_slow_pct * -1;
    }

    OnTooltip(): number {
        return this.drain_per_sec;
    }

    override OnCreated(): void {
        if (this.parent.IsIllusion()) {
            this.parent.Kill(this.ability, this.caster);
        }
        this.OnRefresh();
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
        this.StartIntervalThink(this.tick_interval);

        const pfx = ParticleManager.CreateParticle(
            "particles/units/heroes/hero_lion/lion_spell_mana_drain.vpcf",
            ParticleAttachment.ABSORIGIN_FOLLOW,
            this.parent
        );
        ParticleManager.SetParticleControlEnt(
            pfx,
            0,
            this.parent,
            ParticleAttachment.POINT_FOLLOW,
            ParticleAttachmentLocation.HITLOC,
            Vector(0, 0, 0),
            true
        );
        ParticleManager.SetParticleControlEnt(
            pfx,
            1,
            this.caster,
            ParticleAttachment.POINT_FOLLOW,
            ParticleAttachmentLocation.MOUTH,
            Vector(0, 0, 0),
            true
        );
        this.AddParticle(pfx, false, false, -1, false, false);
    }

    OnRefresh(): void {
        this.movespeed_slow_pct = this.ability.GetSpecialValueFor("movespeed_slow_pct");
        this.drain_per_sec = this.ability.GetSpecialValueFor("drain_per_sec");
        this.dmg_per_sec = this.ability.GetSpecialValueFor("dmg_per_sec");
        this.int_to_dmg_pct = this.ability.GetSpecialValueFor("int_to_dmg_pct");
        this.tick_interval = this.ability.GetSpecialValueFor("tick_interval");
        this.talent_mult_if_cast_on_aura_target = this.ability.GetSpecialValueFor("talent_mult_if_cast_on_aura_target");
    }

    OnIntervalThink() {
        let damage = this.dmg_per_sec;
        let drain_per_sec = this.drain_per_sec;
        damage = damage * (this.caster.GetSpellAmplification(false) + 1);
        damage = damage + (this.caster.GetIntellect() / 100) * this.int_to_dmg_pct;
        if (this.caster.HasTalent("talent_lion_mana_drain_custom_passive") && this.GetStackCount() > 0) {
            if (this.ability.IsChanneling()) {
                damage = damage * this.talent_mult_if_cast_on_aura_target;
                drain_per_sec = drain_per_sec * this.talent_mult_if_cast_on_aura_target;
            } else {
                this.DecrementStackCount();
            }
        }
        damage = damage * this.tick_interval;
        drain_per_sec = drain_per_sec * this.tick_interval;
        this.parent.SpendMana(drain_per_sec, this.ability);
        this.caster.GiveMana(drain_per_sec);
        this.damageTable.damage = damage;
        ApplyDamage(this.damageTable);
    }
}

@registerModifier()
export class modifier_lion_mana_drain_custom_aura extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    radius!: number;
    targetTeam!: UnitTargetTeam;
    targetType!: UnitTargetType;
    targetFlags!: UnitTargetFlags;

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
        return modifier_lion_mana_drain_custom_debuff.name;
    }

    GetAuraEntityReject(): boolean {
        return !this.caster.HasTalent("talent_lion_mana_drain_custom_passive");
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

    OnRefresh(): void {
        this.radius = this.ability.GetSpecialValueFor("talent_radius");
    }
}
