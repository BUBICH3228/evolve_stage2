import { BaseItem, registerAbility } from "../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../libraries/dota_ts_adapter";

@registerAbility()
export class item_radiance_custom extends BaseItem {
    GetIntrinsicModifierName(): string {
        return modifier_item_radiance_custom.name;
    }

    Spawn(): void {
        if (!IsServer()) {
            return;
        }

        this.ToggleAbility();
    }

    OnToggle(): void {
        if (!IsServer()) {
            return;
        }

        const caster = this.GetParent() as CDOTA_BaseNPC_Hero;

        if (this.GetToggleState()) {
            caster.AddNewModifier(caster, this, modifier_item_radiance_custom_aura_enemy.name, { duration: -1 });
        } else {
            caster.RemoveModifierByName(modifier_item_radiance_custom_aura_enemy.name);
        }
    }

    GetAbilityTextureName(): string {
        const textureName = GetAbilityTextureNameForAbility(item_radiance_custom.name);
        if (this.GetToggleState()) {
            return textureName;
        } else {
            return "radiance_inactive";
        }
    }
}

@registerModifier()
export class modifier_item_radiance_custom extends BaseModifier {
    // Modifier properties
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    bonusDamage!: number;
    evasion!: number;
    bonusDamagePerLevel!: number;

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
    RemoveOnDeath(): boolean {
        return false;
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.EVASION_CONSTANT, ModifierFunction.PREATTACK_BONUS_DAMAGE, ModifierFunction.ON_RESPAWN];
    }

    GetModifierEvasion_Constant(): number {
        return this.evasion;
    }

    GetModifierPreAttack_BonusDamage(): number {
        return this.bonusDamage + (this.ability.GetLevel() - 1) * this.bonusDamagePerLevel;
    }

    override OnCreated(): void {
        this.OnRefresh();
        if (!IsServer()) {
            return;
        }
        this.ability.OnToggle();
    }

    OnRefresh(): void {
        this.bonusDamage = this.ability.GetSpecialValueFor("bonus_damage");
        this.evasion = this.ability.GetSpecialValueFor("evasion");
        this.bonusDamagePerLevel = this.ability.GetSpecialValueFor("bonus_damage_per_level");
    }

    OnRespawn(kv: ModifierUnitEvent): void {
        if (kv.unit != this.parent) {
            return;
        }

        this.ability.ToggleAbility();
    }

    OnDestroy(): void {
        if (!IsServer()) {
            return;
        }

        if (this.parent.HasModifier(this.GetName())) {
            return;
        }

        this.parent.RemoveModifierByName(modifier_item_radiance_custom_aura_enemy.name);
    }
}

@registerModifier()
export class modifier_item_radiance_custom_aura_enemy extends BaseModifier {
    // Modifier properties
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    targetTeam!: UnitTargetTeam;
    targetType!: UnitTargetType;
    targetFlags!: UnitTargetFlags;
    auraRadius!: number;
    parentModifierName!: string;

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
        return this.auraRadius;
    }

    GetModifierAura(): string {
        return modifier_item_radiance_custom_aura_enemy_debuff.name;
    }

    GetEffectName(): string {
        return "particles/items2_fx/radiance_owner.vpcf";
    }

    override OnCreated(): void {
        this.OnRefresh();
        if (!IsServer()) {
            return;
        }
        this.targetTeam = this.ability.GetAbilityTargetTeam();
        this.targetType = this.ability.GetAbilityTargetType();
        this.targetFlags = this.ability.GetAbilityTargetFlags();

        this.parentModifierName = this.ability.GetIntrinsicModifierName();
        this.StartIntervalThink(0.25);
    }

    OnRefresh(): void {
        this.auraRadius = this.ability.GetCastRange(this.parent.GetAbsOrigin(), this.parent);
    }

    OnIntervalThink(): void {
        if (this.parent.HasModifier(this.parentModifierName)) {
            return;
        }

        this.OnDestroy();
    }
}

@registerModifier()
export class modifier_item_radiance_custom_aura_enemy_debuff extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    blindPct!: number;
    auraDamage!: number;
    auraDamagePerLevel!: number;
    damageTable!: ApplyDamageOptions;
    auraDamageIllusions!: number;
    illusionMultiplierPct!: number;

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
        return [ModifierFunction.MISS_PERCENTAGE];
    }

    GetModifierMiss_Percentage(): number {
        return this.blindPct;
    }

    override OnCreated(): void {
        this.OnRefresh();

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

        this.StartIntervalThink(1);

        const pfx = ParticleManager.CreateParticle("particles/items2_fx/radiance.vpcf", ParticleAttachment.ABSORIGIN_FOLLOW, this.caster);
        ParticleManager.SetParticleControlEnt(
            pfx,
            1,
            this.caster,
            ParticleAttachment.ABSORIGIN_FOLLOW,
            ParticleAttachmentLocation.HITLOC,
            Vector(0, 0, 0),
            true
        );
        this.AddParticle(pfx, false, false, 1, false, false);
    }

    OnRefresh(): void {
        if (!this.ability || this.ability.IsNull()) {
            this.OnDestroy();
            return;
        }
        this.blindPct = this.ability.GetSpecialValueFor("blind_pct");
        this.auraDamage = this.ability.GetSpecialValueFor("aura_damage");
        this.auraDamageIllusions = this.ability.GetSpecialValueFor("aura_damage_illusions");
        this.illusionMultiplierPct = this.ability.GetSpecialValueFor("illusion_multiplier_pct") / 100;
        this.auraDamagePerLevel = this.ability.GetSpecialValueFor("aura_damage_per_level");
    }

    OnIntervalThink(): void {
        if (this.caster.IsIllusion()) {
            this.damageTable.damage = this.auraDamageIllusions;
        } else {
            this.damageTable.damage = this.auraDamage;
        }

        this.damageTable.damage += (this.ability.GetLevel() - 1) * this.auraDamagePerLevel;

        if (this.parent.IsIllusion()) {
            this.damageTable.damage *= this.illusionMultiplierPct;
        }

        this.damageTable.damage *= this.caster.GetSpellAmplification(false) + 1;

        ApplyDamage(this.damageTable);
    }
}
