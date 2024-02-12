import { BaseAbility, registerAbility } from "../../../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../../../libraries/dota_ts_adapter";
import { modifier_invulnerable_custom } from "../../../modifiers/modifier_invulnerable_custom";

@registerAbility()
export class wraith_king_tombstone_custom extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();

    GetHealthCost(): number {
        return (this.caster.GetMaxHealth() * this.GetSpecialValueFor("ability_health_cost_pct")) / 100;
    }

    override OnSpellStart(): void {
        const point = this.GetCursorPosition();

        const unit = CreateUnitByName(
            "npc_wraith_king_tombstone_custom",
            point,
            false,
            this.caster,
            this.caster,
            this.caster.GetTeamNumber()
        );

        unit.AddNewModifier(this.caster, this, modifier_wraith_king_tombstone_custom.name, {
            duration: this.GetSpecialValueFor("duration")
        });
        unit.AddNewModifier(this.caster, this, modifier_invulnerable_custom.name, { duration: this.GetSpecialValueFor("duration") });
    }
}

@registerModifier()
export class modifier_wraith_king_tombstone_custom extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    targetTeam!: UnitTargetTeam;
    targetType!: UnitTargetType;
    targetFlags!: UnitTargetFlags;
    radius!: number;

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

    IsAura(): boolean {
        return true;
    }

    GetAuraSearchTeam(): UnitTargetTeam {
        return this.targetTeam;
    }

    GetAuraSearchType(): UnitTargetType {
        return this.targetType;
    }

    GetAuraSearchFlags(): UnitTargetFlags {
        return this.targetFlags;
    }

    GetAuraRadius(): number {
        return this.radius;
    }

    GetModifierAura(): string {
        return modifier_wraith_king_tombstone_custom_debuff.name;
    }

    CheckState(): Partial<Record<ModifierState, boolean>> {
        return {
            [ModifierState.NO_HEALTH_BAR]: true
        };
    }

    GetAuraOwner(): CDOTA_BaseNPC | undefined {
        return this.caster;
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
        this.radius = this.ability.GetSpecialValueFor("radius");
    }

    OnDestroy(): void {
        if (!IsServer()) {
            return;
        }

        this.parent.ForceKill(false);
    }
}

@registerModifier()
export class modifier_wraith_king_tombstone_custom_debuff extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    moveSpeedPctSlow!: number;
    damagePerAttackPct!: number;
    interval!: number;
    damgeTable!: {
        victim: CDOTA_BaseNPC;
        attacker: CDOTA_BaseNPC;
        damage: number;
        ability: CDOTABaseAbility;
        damage_type: DamageTypes;
        damage_flags: DamageFlag;
    };

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
        return [ModifierFunction.MOVESPEED_BONUS_PERCENTAGE];
    }

    GetModifierMoveSpeedBonus_Percentage(): number {
        return this.moveSpeedPctSlow;
    }

    override OnCreated(): void {
        this.OnRefresh();
    }

    OnRefresh(): void {
        this.damagePerAttackPct = this.ability.GetSpecialValueFor("damage_per_attack_pct") / 100;
        this.moveSpeedPctSlow = -1 * this.ability.GetSpecialValueFor("move_speed_pct_slow");
        this.interval = this.ability.GetSpecialValueFor("interval");

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

        this.StartIntervalThink(this.interval);
    }

    OnIntervalThink(): void {
        const damage = this.damagePerAttackPct * this.caster.GetAverageTrueAttackDamage(this.parent) * this.interval;
        this.damgeTable.damage = damage;
        ApplyDamage(this.damgeTable);
    }
}
