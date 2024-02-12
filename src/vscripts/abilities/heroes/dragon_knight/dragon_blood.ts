import { BaseAbility, BaseModifier, registerAbility, registerModifier } from "../../../libraries/dota_ts_adapter";
import { modifier_dragon_knight_elder_dragon_form_custom } from "./elder_dragon_form";

@registerAbility()
export class dragon_knight_dragon_blood_custom extends BaseAbility {
    public pathToBuffParticle = "particles/custom/units/heroes/dragon_knight/dragon_blood/dragon_blood_buff.vpcf";
    private pathToTalentCastParticle = "particles/custom/units/heroes/dragon_knight/dragon_blood/dragon_blood_cast.vpcf";
    private caster: CDOTA_BaseNPC = this.GetCaster();

    override Precache(context: CScriptPrecacheContext): void {
        PrecacheResource(PrecacheType.SOUNDFILE, "soundevents/custom/heroes/dragon_knight/game_sounds_dragon_knight.vsndevts", context);
        PrecacheResource(PrecacheType.PARTICLE, this.pathToBuffParticle, context);
        PrecacheResource(PrecacheType.PARTICLE, this.pathToTalentCastParticle, context);
    }

    override GetIntrinsicModifierName(): string {
        return modifier_dragon_knight_dragon_blood_custom_aura.name;
    }

    override GetCooldown(): number {
        return this.GetSpecialValueFor("talent_active_cooldown");
    }

    override GetBehavior(): AbilityBehavior | Uint64 {
        if (this.caster.HasTalent("talent_dragon_knight_dragon_blood_active")) {
            return AbilityBehavior.NO_TARGET;
        }

        return super.GetBehavior();
    }

    override GetCastRange(): number {
        return this.GetSpecialValueFor("talent_active_redirect_radius");
    }

    override OnSpellStart(): void {
        const radius = this.GetSpecialValueFor("talent_active_redirect_radius");
        const allies = FindUnitsInRadius(
            this.caster.GetTeamNumber(),
            this.caster.GetAbsOrigin(),
            undefined,
            radius,
            this.GetAbilityTargetTeam(2),
            this.GetAbilityTargetType(2),
            this.GetAbilityTargetFlags(2),
            FindOrder.ANY,
            false
        );

        const buffDuration = this.GetSpecialValueFor("talent_active_duration");

        for (const ally of allies) {
            if (ally != this.caster) {
                ally.AddNewModifier(this.caster, this, modifier_dragon_knight_dragon_blood_custom_talent_buff.name, {
                    duration: buffDuration
                });
            }
        }

        const particle = ParticleManager.CreateParticle(this.pathToTalentCastParticle, ParticleAttachment.ABSORIGIN, this.caster);

        ParticleManager.SetParticleControl(particle, 1, Vector(radius, 0, 0));
        ParticleManager.DestroyAndReleaseParticle(particle, 2, false);

        EmitSoundOn("DragonKnight.DragonBlood.Cast", this.caster);
    }
}

@registerModifier()
export class modifier_dragon_knight_dragon_blood_custom_aura extends BaseModifier {
    // Modifier properties
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    private radius!: number;
    private targetTeam!: UnitTargetTeam;
    private targetType!: UnitTargetType;
    private targetFlags!: UnitTargetFlags;

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
        return false;
    }

    override IsAura() {
        return true;
    }

    override GetAuraSearchTeam() {
        return this.targetTeam;
    }

    override GetAuraSearchType() {
        return this.targetType;
    }

    override GetAuraSearchFlags() {
        return this.targetFlags;
    }

    override GetAuraRadius() {
        return this.radius;
    }

    override GetModifierAura() {
        return modifier_dragon_knight_dragon_blood_custom_aura_buff.name;
    }

    override GetAuraEntityReject(entity: CDOTA_BaseNPC): boolean {
        return this.parent.HasTalent("talent_dragon_knight_dragon_blood_ally_aura") ? false : this.parent != entity;
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
        this.radius = this.ability.GetSpecialValueFor("talent_ally_aura_radius");

        if (!IsServer()) {
            return;
        }

        if (this.parent.HasTalent("talent_dragon_knight_dragon_blood_enemy_aura")) {
            this.parent.AddNewModifierSafe(this.parent, this.ability, modifier_dragon_knight_dragon_blood_custom_enemy_aura.name, {
                duration: -1
            });
        }
    }
}

@registerModifier()
export class modifier_dragon_knight_dragon_blood_custom_aura_buff extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent()!;
    private bonus_health_regen!: number;
    private bonus_armor!: number;
    private talent_armor_bonus_pct!: number;
    private talent_hp_regen_bonus_pct!: number;

    // Modifier specials

    override IsHidden() {
        return this.parent == this.caster;
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

    override DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.HEALTH_REGEN_CONSTANT,
            ModifierFunction.PHYSICAL_ARMOR_BONUS,
            ModifierFunction.MOUNTAIN_PHYSICAL_ARMOR_TOTAL_PERCENTAGE,
            ModifierFunction.HEALTH_REGEN_PERCENTAGE
        ];
    }

    override GetModifierConstantHealthRegen() {
        return this.bonus_health_regen;
    }

    override GetModifierPhysicalArmorBonus() {
        return this.bonus_armor;
    }

    override GetModifierPhysicalArmorTotal_Percentage() {
        if (this.caster.HasModifier(modifier_dragon_knight_elder_dragon_form_custom.name)) {
            return this.talent_armor_bonus_pct;
        }

        return 0;
    }

    override GetModifierHealthRegenPercentage() {
        if (this.caster.HasModifier(modifier_dragon_knight_elder_dragon_form_custom.name)) {
            return this.talent_hp_regen_bonus_pct;
        }

        return 0;
    }

    override OnCreated(): void {
        if (this.ability == undefined) {
            this.Destroy();
            return;
        }

        this.OnRefresh();

        if (!IsServer()) {
            return;
        }
    }

    override OnRefresh(): void {
        this.bonus_health_regen = this.ability.GetSpecialValueFor("bonus_health_regen");
        this.bonus_armor = this.ability.GetSpecialValueFor("bonus_armor");
        this.talent_armor_bonus_pct = this.ability.GetSpecialValueFor("talent_armor_bonus_pct");
        this.talent_hp_regen_bonus_pct = this.ability.GetSpecialValueFor("talent_hp_regen_bonus_pct");
    }
}

@registerModifier()
export class modifier_dragon_knight_dragon_blood_custom_enemy_aura extends BaseModifier {
    // Modifier properties
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent()!;
    private radius!: number;
    private targetTeam!: UnitTargetTeam;
    private targetType!: UnitTargetType;
    private targetFlags!: UnitTargetFlags;

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
        return false;
    }

    override IsAura() {
        return true;
    }

    override GetAuraSearchTeam() {
        return this.targetTeam;
    }

    override GetAuraSearchType() {
        return this.targetType;
    }

    override GetAuraSearchFlags() {
        return this.targetFlags;
    }

    override GetAuraRadius() {
        return this.radius;
    }

    override GetModifierAura() {
        return modifier_dragon_knight_dragon_blood_custom_enemy_aura_debuff.name;
    }

    override GetAuraEntityReject(): boolean {
        return !this.parent.HasModifier(modifier_dragon_knight_elder_dragon_form_custom.name);
    }

    override OnCreated(): void {
        this.OnRefresh();

        if (!IsServer()) {
            return;
        }
        this.targetTeam = this.ability.GetAbilityTargetTeam(1);
        this.targetType = this.ability.GetAbilityTargetType(1);
        this.targetFlags = this.ability.GetAbilityTargetFlags(1);
    }

    override OnRefresh(): void {
        this.radius = this.ability.GetSpecialValueFor("talent_enemy_aura_radius");
    }
}

@registerModifier()
export class modifier_dragon_knight_dragon_blood_custom_enemy_aura_debuff extends BaseModifier {
    private ability: CDOTABaseAbility = this.GetAbility()!;
    armorReductionPct!: number;
    attackDamageReductionPct!: number;
    magicResistancePct!: number;

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

    override DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.MOUNTAIN_PHYSICAL_ARMOR_TOTAL_PERCENTAGE,
            ModifierFunction.MAGICAL_RESISTANCE_BONUS,
            ModifierFunction.DAMAGEOUTGOING_PERCENTAGE,
            ModifierFunction.TOOLTIP
        ];
    }

    override GetModifierDamageOutgoing_Percentage() {
        return this.attackDamageReductionPct;
    }

    override GetModifierMagicalResistanceBonus() {
        return this.magicResistancePct;
    }

    override GetModifierPhysicalArmorTotal_Percentage() {
        return this.armorReductionPct;
    }

    override OnTooltip(): number {
        return this.armorReductionPct;
    }

    override OnCreated(): void {
        if (this.ability == undefined) {
            this.Destroy();
            return;
        }

        this.OnRefresh();
    }

    override OnRefresh(): void {
        this.armorReductionPct = this.ability.GetSpecialValueFor("talent_enemy_aura_armor_reduction_pct");
        this.attackDamageReductionPct = this.ability.GetSpecialValueFor("talent_enemy_aura_attack_damage_reduction_pct");
        this.magicResistancePct = this.ability.GetSpecialValueFor("talent_enemy_aura_magic_resistance_reduction_pct");
    }
}

@registerModifier()
export class modifier_dragon_knight_dragon_blood_custom_talent_buff extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: dragon_knight_dragon_blood_custom = this.GetAbility()! as dragon_knight_dragon_blood_custom;
    private parent: CDOTA_BaseNPC = this.GetParent()!;
    damageRedirectPct!: number;
    damageTable!: ApplyDamageOptions;
    damageRedirectRatio!: number;
    // Modifier specials

    override IsHidden() {
        return false;
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

    override DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.INCOMING_DAMAGE_PERCENTAGE, ModifierFunction.TOOLTIP];
    }

    override OnTooltip(): number {
        return this.damageRedirectPct;
    }

    override GetModifierIncomingDamage_Percentage(event: ModifierAttackEvent): number {
        if (event.target != this.parent) {
            return 0;
        }

        if (this.caster.IsAlive() == false) {
            return 0;
        }

        this.damageTable.damage = event.damage * this.damageRedirectRatio;
        ApplyDamage(this.damageTable);

        return -this.damageRedirectPct;
    }

    override OnCreated(): void {
        if (this.ability == undefined) {
            this.Destroy();
            return;
        }

        this.OnRefresh();

        if (!IsServer()) {
            return;
        }

        this.damageTable = {
            victim: this.caster,
            attacker: this.parent,
            ability: this.ability,
            damage: 0,
            damage_type: DamageTypes.PURE,
            damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION + DamageFlag.NO_SPELL_LIFESTEAL + DamageFlag.NO_DAMAGE_MULTIPLIERS
        };

        const particle = ParticleManager.CreateParticle(this.ability.pathToBuffParticle, ParticleAttachment.CUSTOMORIGIN, undefined);
        ParticleManager.SetParticleControlEnt(
            particle,
            0,
            this.parent,
            ParticleAttachment.POINT_FOLLOW,
            ParticleAttachmentLocation.HITLOC,
            Vector(0, 0, 0),
            true
        );
        this.AddParticle(particle, false, false, 1, false, false);
    }

    override OnRefresh(): void {
        this.damageRedirectPct = this.ability.GetSpecialValueFor("talent_active_redirect_pct");
        this.damageRedirectRatio = this.damageRedirectPct / 100;
    }
}
