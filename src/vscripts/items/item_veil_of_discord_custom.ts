import { BaseItem, registerAbility } from "../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../libraries/dota_ts_adapter";

@registerAbility()
export class item_veil_of_discord_custom extends BaseItem {
    GetIntrinsicModifierName(): string {
        return modifier_item_veil_of_discord_custom_aura.name;
    }

    override OnSpellStart(): void {
        const caster = this.GetCaster();
        const enemies = FindUnitsInRadius(
            caster.GetTeamNumber(),
            caster.GetAbsOrigin(),
            undefined,
            this.GetCastRange(caster.GetAbsOrigin(), caster),
            this.GetAbilityTargetTeam(),
            this.GetAbilityTargetType(),
            this.GetAbilityTargetFlags(),
            FindOrder.ANY,
            false
        );

        enemies.forEach((target) => {
            target.AddNewModifier(caster, this, modifier_item_veil_of_discord_custom_aura_debuff.name, {
                duration: this.GetSpecialValueFor("resist_debuff_duration") * (1 - target.GetStatusResistance())
            });
        });

        const pfx = ParticleManager.CreateParticle("particles/items2_fx/veil_of_discord.vpcf", ParticleAttachment.ABSORIGIN, caster);
        ParticleManager.SetParticleControl(pfx, 0, caster.GetAbsOrigin());
        ParticleManager.SetParticleControl(pfx, 1, Vector(this.GetCastRange(caster.GetAbsOrigin(), caster), 1, 1));
        ParticleManager.DestroyAndReleaseParticle(pfx);
        EmitSoundOn("DOTA_Item.VeilofDiscord.Activate", caster);
    }
}

@registerModifier()
export class modifier_item_veil_of_discord_custom_aura extends BaseModifier {
    // Modifier properties
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    targetTeam!: UnitTargetTeam;
    targetType!: UnitTargetType;
    targetFlags!: UnitTargetFlags;
    auraRadius!: number;
    bonusAllStats!: number;
    bonusAllStatsPerLevel!: number;

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
        return modifier_item_veil_of_discord_custom_aura_buff.name;
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.STATS_AGILITY_BONUS, ModifierFunction.STATS_STRENGTH_BONUS, ModifierFunction.STATS_INTELLECT_BONUS];
    }

    GetModifierBonusStats_Agility(): number {
        return this.bonusAllStats + (this.ability.GetLevel() - 1) * this.bonusAllStatsPerLevel;
    }

    GetModifierBonusStats_Strength(): number {
        return this.bonusAllStats + (this.ability.GetLevel() - 1) * this.bonusAllStatsPerLevel;
    }

    GetModifierBonusStats_Intellect(): number {
        return this.bonusAllStats + (this.ability.GetLevel() - 1) * this.bonusAllStatsPerLevel;
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

    OnRefresh(): void {
        this.auraRadius = this.ability.GetSpecialValueFor("aura_radius");
        this.bonusAllStats = this.ability.GetSpecialValueFor("bonus_all_stats");
        this.bonusAllStatsPerLevel = this.ability.GetSpecialValueFor("bonus_all_stats_per_level");
    }
}

@registerModifier()
export class modifier_item_veil_of_discord_custom_aura_buff extends BaseModifier {
    // Modifier properties
    private ability: CDOTABaseAbility = this.GetAbility()!;
    auraManaRegen!: number;

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

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.MANA_REGEN_CONSTANT];
    }

    GetModifierConstantManaRegen(): number {
        return this.auraManaRegen;
    }

    override OnCreated(): void {
        this.OnRefresh();
    }

    OnRefresh(): void {
        this.auraManaRegen = this.ability.GetSpecialValueFor("aura_mana_regen");
    }
}

@registerModifier()
export class modifier_item_veil_of_discord_custom_aura_debuff extends BaseModifier {
    // Modifier properties
    private ability: CDOTABaseAbility = this.GetAbility()!;
    spellAmpDebuff!: number;
    spellAmpDebuffPerLevel!: number;

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

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.INCOMING_DAMAGE_PERCENTAGE, ModifierFunction.TOOLTIP];
    }

    OnTooltip(): number {
        return this.spellAmpDebuff;
    }

    GetModifierIncomingDamage_Percentage(kv: ModifierAttackEvent): number {
        if (kv.damage_category == DamageCategory.SPELL) {
            return this.spellAmpDebuff + (this.ability.GetLevel() - 1) * this.spellAmpDebuffPerLevel;
        }

        return 0;
    }

    override OnCreated(): void {
        this.OnRefresh();
    }

    OnRefresh(): void {
        this.spellAmpDebuff = this.ability.GetSpecialValueFor("spell_amp_debuff");
        this.spellAmpDebuffPerLevel = this.ability.GetSpecialValueFor("spell_amp_debuff_per_level");
    }
}
