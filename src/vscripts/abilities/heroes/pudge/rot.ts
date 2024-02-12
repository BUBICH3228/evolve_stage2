import { BaseAbility, registerAbility } from "../../../libraries/dota_ts_adapter";
import { BaseModifier, registerModifier } from "../../../libraries/dota_ts_adapter";

@registerAbility()
export class pudge_rot_custom extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();

    GetIntrinsicModifierName(): string {
        if (this.caster.HasTalent("talent_pudge_rot_custom_always_on")) {
            return modifier_pudge_rot_custom.name;
        }
        return "";
    }

    override OnToggle(): void {
        if (!this.caster.HasTalent("talent_pudge_rot_custom_always_on")) {
            if (this.GetToggleState()) {
                this.caster.AddNewModifier(this.caster, this, modifier_pudge_rot_custom.name, { duration: -1 });
            } else {
                this.caster.RemoveModifierByName(modifier_pudge_rot_custom.name);
            }
        }
    }
}

@registerModifier()
export class modifier_pudge_rot_custom extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC_Hero = this.GetCaster()! as CDOTA_BaseNPC_Hero;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    radius!: number;
    targetFlags!: UnitTargetFlags;
    targetType!: UnitTargetType;
    targetTeam!: UnitTargetTeam;
    spellLifesteal!: number;
    rotSpellLifesteal!: number;
    damage!: number;
    damagePerStrengt!: number;
    tickInterval!: number;
    slow!: number;
    damgeTable!: ApplyDamageOptions;
    rotDamagePerTickPct!: number;
    maxStacks!: number;

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
    override IsAura(): boolean {
        if (this.parent == this.caster) {
            return true;
        } else {
            return false;
        }
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
        return modifier_pudge_rot_custom.name;
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.MOUNTAIN_SPELL_LIFESTEAL, ModifierFunction.MOVESPEED_BONUS_PERCENTAGE];
    }

    GetModifierMoveSpeedBonus_Percentage(): number {
        if (this.parent == this.caster) {
            return 0;
        }
        return this.slow;
    }

    GetModifierSpellLifesteal(): number {
        if (this.parent == this.caster) {
            return this.spellLifesteal;
        }
        return 0;
    }

    override OnCreated(): void {
        this.OnRefresh();
        if (!IsServer()) {
            return;
        }
        this.targetTeam = this.ability.GetAbilityTargetTeam();
        this.targetType = this.ability.GetAbilityTargetType();
        this.targetFlags = this.ability.GetAbilityTargetFlags();
        if (this.parent == this.caster) {
            EmitSoundOn("Hero_Pudge.Rot", this.parent);
            const pfx = ParticleManager.CreateParticle(
                "particles/units/heroes/hero_pudge/pudge_rot.vpcf",
                ParticleAttachment.ABSORIGIN_FOLLOW,
                this.caster
            );
            ParticleManager.SetParticleControl(pfx, 1, Vector(this.radius, 0, 0));
            this.AddParticle(pfx, false, false, -1, false, false);
        }
    }

    OnRefresh(): void {
        this.radius = this.ability.GetSpecialValueFor("rot_radius");
        this.rotSpellLifesteal = this.ability.GetSpecialValueFor("talent_rot_spell_lifesteal_per_enemy_pct");
        this.damage = this.ability.GetSpecialValueFor("rot_damage");
        this.damagePerStrengt = this.ability.GetSpecialValueFor("rot_damge_per_strengt") / 100;
        this.tickInterval = this.ability.GetSpecialValueFor("rot_tick");
        this.rotDamagePerTickPct = this.ability.GetSpecialValueFor("talent_rot_dmg_increase_per_tick_pct") / 100;
        this.maxStacks = this.ability.GetSpecialValueFor("talent_rot_max_stacks_always_on");
        this.slow = -1 * this.ability.GetSpecialValueFor("rot_slow");
        if (!IsServer()) {
            return;
        }
        this.damgeTable = {
            victim: this.parent,
            attacker: this.caster,
            damage: 0,
            ability: this.ability,
            damage_type: this.ability.GetAbilityDamageType(),
            damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION
        };
        this.StartIntervalThink(this.tickInterval);
    }
    OnIntervalThink(): void {
        const spellAmp = this.caster.GetSpellAmplification(false) + 1;
        if (this.caster.HasTalent("talent_pudge_rot_custom_always_on")) {
            if (this.ability.GetToggleState()) {
                this.SetStackCount(math.min(this.maxStacks, this.GetStackCount() + 1));
            } else {
                this.SetStackCount(0);
            }
        }
        let damage = this.damage * spellAmp + this.caster.GetStrength() * this.damagePerStrengt;
        damage += damage * this.GetStackCount() * this.rotDamagePerTickPct;
        this.damgeTable.damage = damage * this.tickInterval;
        if (this.parent == this.caster) {
            this.damgeTable.damage_flags = DamageFlag.NO_SPELL_AMPLIFICATION + DamageFlag.NON_LETHAL;
            if (this.caster.HasTalent("talent_pudge_rot_custom_always_on") && !this.ability.GetToggleState()) {
                this.damgeTable.damage = 0;
            }
        }
        ApplyDamage(this.damgeTable);

        if (this.caster.HasTalent("talent_pudge_rot_custom_spell_lifesteal")) {
            const enemies = FindUnitsInRadius(
                this.caster.GetTeamNumber(),
                this.caster.GetAbsOrigin(),
                undefined,
                this.radius,
                this.targetTeam,
                this.targetType,
                this.targetFlags,
                FindOrder.ANY,
                false
            );

            this.spellLifesteal = this.rotSpellLifesteal * enemies.length - 1;
        }
    }

    OnDestroy(): void {
        StopSoundOn("Hero_Pudge.Rot", this.parent);
    }
}
