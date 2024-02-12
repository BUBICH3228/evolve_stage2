import { BaseItem, registerAbility } from "../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../libraries/dota_ts_adapter";

@registerAbility()
export class item_shivas_guard_custom extends BaseItem {
    GetIntrinsicModifierName(): string {
        return modifier_item_shivas_guard_custom.name;
    }
    override OnSpellStart(): void {
        const caster = this.GetCaster();
        const blastSpeed = this.GetSpecialValueFor("blast_speed");
        const blastRadius = this.GetCastRange(caster.GetAbsOrigin(), caster);

        caster.AddNewModifier(caster, this, modifier_item_shivas_guard_custom_active.name, { duration: blastRadius / blastSpeed });
        EmitSoundOn("MountainItem.HeartOfShivas.Cast", caster);
    }
}

@registerModifier()
export class modifier_item_shivas_guard_custom extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    targetFlags!: UnitTargetFlags;
    targetTeam!: UnitTargetTeam;
    targetType!: UnitTargetType;
    auraRadius!: number;
    bonusAllStats!: number;
    bonusHpRegen!: number;
    bonusArmor!: number;
    bonusArmorPerLevel!: number;

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
    RemoveOnDeath(): boolean {
        return false;
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
        return this.auraRadius;
    }

    GetModifierAura(): string {
        return modifier_item_shivas_guard_custom_aura_debuff.name;
    }

    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.STATS_AGILITY_BONUS,
            ModifierFunction.STATS_STRENGTH_BONUS,
            ModifierFunction.STATS_INTELLECT_BONUS,
            ModifierFunction.PHYSICAL_ARMOR_BONUS,
            ModifierFunction.HEALTH_REGEN_CONSTANT
        ];
    }

    GetModifierBonusStats_Agility(): number {
        return this.bonusAllStats;
    }

    GetModifierBonusStats_Strength(): number {
        return this.bonusAllStats;
    }

    GetModifierBonusStats_Intellect(): number {
        return this.bonusAllStats;
    }

    GetModifierConstantHealthRegen(): number {
        return this.bonusHpRegen;
    }

    GetModifierPhysicalArmorBonus(): number {
        return this.bonusArmor + (this.ability.GetLevel() - 1) * this.bonusArmorPerLevel;
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
        this.auraRadius = this.ability.GetSpecialValueFor("aura_radius");
        this.bonusAllStats = this.ability.GetSpecialValueFor("bonus_all_stats");
        this.bonusArmor = this.ability.GetSpecialValueFor("bonus_armor");
        this.bonusHpRegen = this.ability.GetSpecialValueFor("bonus_hp_regen");
        this.bonusArmorPerLevel = this.ability.GetSpecialValueFor("bonus_armor_per_level");
    }
}

@registerModifier()
export class modifier_item_shivas_guard_custom_aura_debuff extends BaseModifier {
    // Modifier properties
    private ability: CDOTABaseAbility = this.GetAbility()!;
    auraSttackSpeed!: number;
    hpRegenDegenAura!: number;

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
        return [ModifierFunction.ATTACKSPEED_BONUS_CONSTANT, ModifierFunction.LIFESTEAL_AMPLIFY_PERCENTAGE];
    }

    GetModifierAttackSpeedBonus_Constant(): number {
        return this.auraSttackSpeed;
    }

    GetModifierLifestealRegenAmplify_Percentage(): number {
        return this.hpRegenDegenAura;
    }

    override OnCreated(): void {
        this.OnRefresh();
    }

    OnRefresh(): void {
        this.auraSttackSpeed = -1 * this.ability.GetSpecialValueFor("aura_attack_speed");
        this.hpRegenDegenAura = -1 * this.ability.GetSpecialValueFor("hp_regen_degen_aura");
    }
}

@registerModifier()
export class modifier_item_shivas_guard_custom_active extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    targetType!: UnitTargetType;
    targetTeam!: UnitTargetTeam;
    targetFlags!: UnitTargetFlags;
    damageTable!: ApplyDamageOptions;
    hitted: boolean[] | undefined[] = [];
    radiusIncrease = 0;
    blastSpeed!: number;
    blastRadius!: number;
    blastDamage!: number;
    movementSpeedDebuffDuration!: number;
    blastDamagePerLevel!: number;

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

    override OnCreated(): void {
        this.OnRefresh();
        if (!IsServer()) {
            return;
        }

        this.targetTeam = this.ability.GetAbilityTargetTeam();
        this.targetType = this.ability.GetAbilityTargetType();
        this.targetFlags = this.ability.GetAbilityTargetFlags();

        this.damageTable = {
            victim: undefined,
            attacker: this.caster,
            damage: 0,
            ability: this.ability,
            damage_type: this.ability.GetAbilityDamageType(),
            damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION
        };

        const pfx = ParticleManager.CreateParticle(
            "particles/items2_fx/shivas_guard_active.vpcf",
            ParticleAttachment.ABSORIGIN_FOLLOW,
            this.parent
        );
        ParticleManager.SetParticleControl(pfx, 1, Vector(this.blastRadius, this.GetDuration() * 1.33));
        this.AddParticle(pfx, false, false, 15, false, false);
        this.radiusIncrease = 0;
        this.hitted = [];
        this.StartIntervalThink(FrameTime());
    }

    override OnRefresh(): void {
        this.blastRadius = this.ability.GetCastRange(this.parent.GetAbsOrigin(), this.parent);
        this.blastSpeed = this.ability.GetSpecialValueFor("blast_speed");
        this.blastDamage = this.ability.GetSpecialValueFor("blast_damage");
        this.movementSpeedDebuffDuration = this.ability.GetSpecialValueFor("movement_speed_debuff_duration");
        this.blastDamagePerLevel = this.ability.GetSpecialValueFor("blast_damage_per_level");
    }

    OnIntervalThink(): void {
        this.radiusIncrease += this.blastSpeed / (1.0 / FrameTime());
        AddFOWViewer(this.parent.GetTeamNumber(), this.parent.GetAbsOrigin(), this.radiusIncrease, FrameTime(), false);
        const enemies = FindUnitsInRadius(
            this.parent.GetTeamNumber(),
            this.parent.GetAbsOrigin(),
            undefined,
            this.radiusIncrease,
            this.targetTeam,
            this.targetType,
            this.targetFlags,
            FindOrder.ANY,
            false
        );
        enemies.forEach((target) => {
            if (this.hitted[target.GetEntityIndex()] == undefined) {
                this.hitted[target.GetEntityIndex()] = true;
                const pfx = ParticleManager.CreateParticle(
                    "particles/items2_fx/shivas_guard_impact.vpcf",
                    ParticleAttachment.ABSORIGIN_FOLLOW,
                    target
                );
                ParticleManager.SetParticleControl(pfx, 1, this.parent.GetAbsOrigin());
                ParticleManager.DestroyAndReleaseParticle(pfx, 1);
                this.damageTable.victim = target;
                this.damageTable.damage =
                    (this.blastDamage + this.blastDamagePerLevel * (this.ability.GetLevel() - 1)) *
                    (this.parent.GetSpellAmplification(false) + 1);
                target.AddNewModifier(this.parent, this.ability, modifier_item_shivas_guard_custom_spell_debuff.name, {
                    duration: this.ability.GetDuration() * (1 - target.GetStatusResistance())
                });
                target.AddNewModifier(this.parent, this.ability, modifier_item_shivas_guard_custom_movement_speed_debuff.name, {
                    duration: this.movementSpeedDebuffDuration * (1 - target.GetStatusResistance())
                });
                ApplyDamage(this.damageTable);
            }
        });
    }
}

@registerModifier()
export class modifier_item_shivas_guard_custom_movement_speed_debuff extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    blastMovementSpeedDebuff!: number;

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
        return [ModifierFunction.MOVESPEED_BONUS_PERCENTAGE];
    }

    GetModifierMoveSpeedBonus_Percentage(): number {
        return this.blastMovementSpeedDebuff;
    }

    override OnCreated(): void {
        this.OnRefresh();
    }

    override OnRefresh(): void {
        this.blastMovementSpeedDebuff = -1 * this.ability.GetSpecialValueFor("blast_movement_speed_debuff");
    }
}

@registerModifier()
export class modifier_item_shivas_guard_custom_spell_debuff extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    spellAmpDebuff!: number;

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
        return [ModifierFunction.INCOMING_DAMAGE_PERCENTAGE, ModifierFunction.TOOLTIP];
    }

    OnTooltip(): number {
        return this.spellAmpDebuff;
    }

    GetModifierIncomingDamage_Percentage(kv: ModifierAttackEvent): number {
        if (kv.damage_category == DamageCategory.SPELL) {
            return this.spellAmpDebuff;
        }

        return 0;
    }

    override OnCreated(): void {
        this.OnRefresh();
    }

    override OnRefresh(): void {
        this.spellAmpDebuff = this.ability.GetSpecialValueFor("spell_amp_debuff");
    }
}
