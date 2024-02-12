import { BaseAbility, registerAbility } from "../../../libraries/dota_ts_adapter";
import { BaseModifier, registerModifier } from "../../../libraries/dota_ts_adapter";
import { modifier_invulnerable_custom } from "../../../modifiers/modifier_invulnerable_custom";

@registerAbility()
export class ursa_enrage_custom extends BaseAbility {
    // Ability properties
    caster: CDOTA_BaseNPC = this.GetCaster();

    GetIntrinsicModifierName() {
        return modifier_ursa_enrage_custom_activation_for_attacks.name;
    }

    Precache(context: CScriptPrecacheContext) {
        PrecacheResource(PrecacheType.PARTICLE, "particles/units/heroes/hero_ursa/ursa_enrage_buff.vpcf", context);
    }

    OnSpellStart(): void {
        this.caster.Purge(false, true, false, true, false);
        this.caster.AddNewModifier(this.caster, this, modifier_ursa_enrage_custom.name, { duration: this.GetSpecialValueFor("duration") });
        if (this.caster.HasScepter()) {
            const enemies = FindUnitsInRadius(
                this.caster.GetTeamNumber(),
                this.caster.GetAbsOrigin(),
                undefined,
                this.GetSpecialValueFor("radius"),
                this.GetAbilityTargetTeam(),
                this.GetAbilityTargetType(),
                this.GetAbilityTargetFlags(),
                FindOrder.ANY,
                false
            );

            for (const enemy of enemies) {
                enemy.AddNewModifier(this.caster, this, modifier_ursa_enrage_custom.name, {
                    duration: this.GetSpecialValueFor("duration")
                });
            }
        }
        EmitSoundOn("Hero_Ursa.Enrage", this.caster);
    }
}

@registerModifier()
export class modifier_ursa_enrage_custom extends BaseModifier {
    // Modifier properties
    caster: CDOTA_BaseNPC = this.GetCaster()!;
    ability: CDOTABaseAbility = this.GetAbility()!;
    parent: CDOTA_BaseNPC = this.GetParent();
    damageReduction!: number;
    statusResistance!: number;
    particle_enrage = "particles/units/heroes/hero_ursa/ursa_enrage_buff.vpcf";
    particle_enrage_fx!: ParticleID;
    modelScale!: number;

    // Modifier specials

    IsHidden() {
        return false;
    }
    IsDebuff() {
        return false;
    }
    IsPurgable() {
        return false;
    }
    IsPurgeException() {
        return false;
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.INCOMING_DAMAGE_PERCENTAGE, ModifierFunction.STATUS_RESISTANCE_STACKING, ModifierFunction.MODEL_SCALE];
    }

    GetModifierIncomingDamage_Percentage(): number {
        return this.damageReduction;
    }

    GetModifierStatusResistanceStacking(): number {
        return this.statusResistance;
    }

    GetModifierModelScale(): number {
        return this.modelScale;
    }

    GetStatusEffectName(): string {
        return "particles/units/heroes/hero_ursa/ursa_enrage_buff.vpcf";
    }

    StatusEffectPriority(): ModifierPriority {
        return ModifierPriority.NORMAL;
    }

    OnCreated(): void {
        this.OnRefresh();
        if (!IsServer()) {
            return;
        }
        this.parent.SetRenderColor(255, 0, 0);
        if (this.parent.HasTalent("talent_ursa_enrage_invulnerability")) {
            this.parent.AddNewModifier(this.parent, this.ability, modifier_invulnerable_custom.name, { duration: -1 });
        }
    }

    OnRefresh(): void {
        this.damageReduction = -1 * this.ability.GetSpecialValueFor("damage_reduction");
        this.statusResistance = this.ability.GetSpecialValueFor("status_resistance");
        this.modelScale = this.ability.GetSpecialValueFor("model_scale");
    }

    OnDestroy(): void {
        if (!IsServer()) {
            return;
        }
        this.parent.SetRenderColor(255, 255, 255);
        this.parent.RemoveModifierByName(modifier_invulnerable_custom.name);
    }
}

@registerModifier()
export class modifier_ursa_enrage_custom_activation_for_attacks extends BaseModifier {
    // Modifier properties
    caster: CDOTA_BaseNPC = this.GetCaster()!;
    ability: CDOTABaseAbility = this.GetAbility()!;
    parent: CDOTA_BaseNPC = this.GetParent();
    chance!: number;
    targetTeam!: UnitTargetTeam;
    targetType!: UnitTargetType;
    targetFlags!: UnitTargetFlags;

    // Modifier specials

    IsHidden() {
        return true;
    }
    IsDebuff() {
        return true;
    }
    IsPurgable() {
        return false;
    }
    IsPurgeException() {
        return false;
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.ON_ATTACK_LANDED];
    }

    OnCreated(): void {
        this.OnRefresh();
        if (!IsServer()) {
            return;
        }
        this.targetTeam = this.ability.GetAbilityTargetTeam();
        this.targetType = this.ability.GetAbilityTargetType();
        this.targetFlags = this.ability.GetAbilityTargetFlags();
    }

    OnRefresh() {
        this.chance = this.ability.GetSpecialValueFor("talent_chance");
    }

    OnAttackLanded(kv: ModifierAttackEvent): void {
        if (!this.caster.HasTalent("talent_ursa_enrage_activation_for_attacks")) {
            return;
        }
        if (this.parent != kv.attacker || this.parent.IsIllusion()) {
            return;
        }

        if (RollPseudoRandomPercentage(this.chance, this.ability) == false) {
            return;
        }

        this.ability.OnSpellStart();
    }
}
