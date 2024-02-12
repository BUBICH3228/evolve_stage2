import { BaseItem, registerAbility } from "../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../libraries/dota_ts_adapter";

@registerAbility()
export class item_ethereal_blade_custom extends BaseItem {
    GetIntrinsicModifierName(): string {
        return modifier_passive_item_ethereal_blade_custom.name;
    }

    override OnSpellStart(): void {
        const caster = this.GetCaster();
        const target = this.GetCursorTarget();

        if (target == undefined) {
            return;
        }

        ProjectileManager.CreateTrackingProjectile({
            Target: target,
            Source: caster,
            Ability: this,
            EffectName: "particles/items_fx/ethereal_blade.vpcf",
            iMoveSpeed: this.GetSpecialValueFor("projectile_speed"),
            vSourceLoc: caster.GetAbsOrigin(),
            bDrawsOnMinimap: false,
            bDodgeable: true,
            bIsAttack: false,
            bVisibleToEnemies: true,
            bReplaceExisting: false,
            flExpireTime: GameRules.GetGameTime() + 20,
            bProvidesVision: false
        });
    }

    OnProjectileHit(target: CDOTA_BaseNPC | undefined): boolean | void {
        if (!IsServer()) {
            return true;
        }

        if (target == undefined || target.IsMagicImmune()) {
            return true;
        }

        if (target.TriggerSpellAbsorb(this)) {
            return true;
        }
        const caster = this.GetCaster();
        target.EmitSound("DOTA_Item.EtherealBlade.Target");

        if (target.GetTeamNumber() == caster.GetTeamNumber()) {
            target.AddNewModifier(caster, this, modifier_item_ethereal_blade_custom.name, { duration: this.GetDuration() });
        } else {
            target.AddNewModifier(caster, this, modifier_item_ethereal_blade_custom.name, {
                duration: this.GetDuration() * (1 - target.GetStatusResistance())
            });
            ApplyDamage({
                victim: target,
                damage:
                    (this.GetSpecialValueFor("blast_damage_base") +
                        (this.GetLevel() - 1) * this.GetSpecialValueFor("blast_damage_base_per_level")) *
                    (caster.GetSpellAmplification(false) + 1),
                damage_type: this.GetAbilityDamageType(),
                damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION,
                attacker: caster,
                ability: this
            });
        }
    }
}

@registerModifier()
export class modifier_item_ethereal_blade_custom extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    blastMovementSlow!: number;
    etherealDamageBonus!: number;

    // Modifier specials

    override IsHidden() {
        return false;
    }
    override IsDebuff() {
        return !(this.parent.GetTeamNumber() == this.caster.GetTeamNumber());
    }
    override IsPurgable() {
        return true;
    }
    override IsPurgeException() {
        return true;
    }
    RemoveOnDeath(): boolean {
        return false;
    }

    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.MOVESPEED_BONUS_PERCENTAGE,
            ModifierFunction.MAGICAL_RESISTANCE_DECREPIFY_UNIQUE,
            ModifierFunction.ABSOLUTE_NO_DAMAGE_PHYSICAL
        ];
    }

    CheckState(): Partial<Record<ModifierState, boolean>> {
        return {
            [ModifierState.ATTACK_IMMUNE]: true,
            [ModifierState.DISARMED]: true
        };
    }

    GetModifierMoveSpeedBonus_Percentage(): number {
        if (!(this.parent.GetTeamNumber() == this.caster.GetTeamNumber())) {
            return this.blastMovementSlow;
        }
        return 0;
    }

    GetModifierMagicalResistanceDecrepifyUnique(): number {
        return this.etherealDamageBonus;
    }

    GetStatusEffectName(): string {
        return "particles/status_fx/status_effect_ghost.vpcf";
    }

    override OnCreated(): void {
        this.OnRefresh();
    }

    override OnRefresh(): void {
        this.blastMovementSlow = -1 * this.ability.GetSpecialValueFor("blast_movement_slow");
        this.etherealDamageBonus = -1 * this.ability.GetSpecialValueFor("ethereal_damage_bonus");
    }
}

@registerModifier()
export class modifier_passive_item_ethereal_blade_custom extends BaseModifier {
    // Modifier properties
    private ability: CDOTABaseAbility = this.GetAbility()!;
    bonusAgility!: number;
    bonusStrength!: number;
    bonusIntellect!: number;
    spellAmp!: number;
    spellLifestealAmp!: number;
    manaRegenMultiplier!: number;
    bonusSpellAmpPerLevel!: number;

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

    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.STATS_AGILITY_BONUS,
            ModifierFunction.STATS_STRENGTH_BONUS,
            ModifierFunction.STATS_INTELLECT_BONUS,
            ModifierFunction.SPELL_AMPLIFY_PERCENTAGE,
            ModifierFunction.SPELL_LIFESTEAL_AMPLIFY_PERCENTAGE,
            ModifierFunction.MANA_REGEN_TOTAL_PERCENTAGE
        ];
    }

    GetModifierBonusStats_Agility(): number {
        return this.bonusAgility;
    }

    GetModifierBonusStats_Strength(): number {
        return this.bonusStrength;
    }

    GetModifierBonusStats_Intellect(): number {
        return this.bonusIntellect;
    }

    GetModifierSpellAmplify_Percentage(): number {
        return this.spellAmp + (this.ability.GetLevel() - 1) * this.bonusSpellAmpPerLevel;
    }

    GetModifierSpellLifestealRegenAmplify_Percentage(): number {
        return this.spellLifestealAmp;
    }

    GetModifierTotalPercentageManaRegen(): number {
        return this.manaRegenMultiplier;
    }

    override OnCreated(): void {
        this.OnRefresh();
    }

    override OnRefresh(): void {
        this.bonusAgility = this.ability.GetSpecialValueFor("bonus_agility");
        this.bonusStrength = this.ability.GetSpecialValueFor("bonus_strength");
        this.bonusIntellect = this.ability.GetSpecialValueFor("bonus_intellect");
        this.spellAmp = this.ability.GetSpecialValueFor("spell_amp");
        this.spellLifestealAmp = this.ability.GetSpecialValueFor("spell_lifesteal_amp");
        this.manaRegenMultiplier = this.ability.GetSpecialValueFor("mana_regen_multiplier") / 100;
        this.bonusSpellAmpPerLevel = this.ability.GetSpecialValueFor("bonus_spell_amp_per_level");
    }
}
