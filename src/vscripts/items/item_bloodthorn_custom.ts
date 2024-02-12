import { BaseItem, registerAbility } from "../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../libraries/dota_ts_adapter";

@registerAbility()
export class item_bloodthorn_custom extends BaseItem {
    GetIntrinsicModifierName(): string {
        return modifier_item_bloodthorn_custom.name;
    }

    GetDuration(): number {
        return super.GetDuration() + (this.GetLevel() - 1) * this.GetSpecialValueFor("duration_per_level");
    }
    override OnSpellStart(): void {
        const caster = this.GetParent() as CDOTA_BaseNPC_Hero;
        const target = this.GetCursorTarget() as CDOTA_BaseNPC_Hero;

        if (target.TriggerSpellAbsorb(this)) {
            return;
        }

        target.AddNewModifier(caster, this, modifier_item_bloodthorn_custom_debuff.name, {
            duration: this.GetDuration() * (1 - target.GetStatusResistance())
        });

        EmitSoundOn("DOTA_Item.Bloodthorn.Activate", caster);
    }
}

@registerModifier()
export class modifier_item_bloodthorn_custom extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    bonusIntellect!: number;
    bonusAttackSpeed!: number;
    bonusManaRegen!: number;
    bonusHealthRegen!: number;
    bonusDamage!: number;
    procDamage!: number;
    procChance!: number;
    targetTeam!: UnitTargetTeam;
    targetType!: UnitTargetType;
    targetFlags!: UnitTargetFlags;
    procs: boolean[] | undefined[] = [];
    isProc!: boolean;
    bonusIntellectPerLevel!: number;

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

    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.STATS_INTELLECT_BONUS,
            ModifierFunction.ATTACKSPEED_BONUS_CONSTANT,
            ModifierFunction.MANA_REGEN_CONSTANT,
            ModifierFunction.HEALTH_REGEN_CONSTANT,
            ModifierFunction.PREATTACK_BONUS_DAMAGE,
            ModifierFunction.PROCATTACK_BONUS_DAMAGE_MAGICAL,
            ModifierFunction.ON_ATTACK_RECORD,
            ModifierFunction.ON_ATTACK_RECORD_DESTROY
        ];
    }

    CheckState(): Partial<Record<ModifierState, boolean>> {
        return {
            [ModifierState.CANNOT_MISS]: this.IsProc()
        };
    }

    GetModifierBonusStats_Intellect(): number {
        return this.bonusIntellect + (this.ability.GetLevel() - 1) * this.bonusIntellectPerLevel;
    }

    GetModifierAttackSpeedBonus_Constant(): number {
        return this.bonusAttackSpeed;
    }

    GetModifierConstantManaRegen(): number {
        return this.bonusManaRegen;
    }

    GetModifierConstantHealthRegen(): number {
        return this.bonusHealthRegen;
    }

    GetModifierPreAttack_BonusDamage(): number {
        return this.bonusDamage;
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
        this.bonusIntellect = this.ability.GetSpecialValueFor("bonus_intellect");
        this.bonusAttackSpeed = this.ability.GetSpecialValueFor("bonus_attack_speed");
        this.bonusManaRegen = this.ability.GetSpecialValueFor("bonus_mana_regen");
        this.bonusHealthRegen = this.ability.GetSpecialValueFor("bonus_health_regen");
        this.bonusDamage = this.ability.GetSpecialValueFor("bonus_damage");
        this.procDamage = this.ability.GetSpecialValueFor("proc_damage");
        this.procChance = this.ability.GetSpecialValueFor("proc_chance");

        this.bonusIntellectPerLevel = this.ability.GetSpecialValueFor("bonus_intellect_per_level");
    }

    OnAttackRecord(kv: ModifierAttackEvent): void {
        if (kv.attacker != this.parent) {
            return;
        }

        this.SetIsProc(false);

        if (
            UnitFilter(kv.target, this.targetTeam, this.targetType, this.targetFlags, this.parent.GetTeamNumber()) !=
            UnitFilterResult.SUCCESS
        ) {
            return;
        }

        if (RollPseudoRandomPercentage(this.procChance, this.ability) == false) {
            return;
        }

        this.SetIsProc(true);

        this.procs[kv.record] = true;
    }

    OnAttackRecordDestroy(kv: ModifierAttackEvent): void {
        if (kv.attacker != this.parent) {
            return;
        }

        this.procs[kv.record] = undefined;
    }

    GetModifierProcAttack_BonusDamage_Magical(kv: ModifierAttackEvent): number {
        if (this.procs[kv.record] == undefined) {
            return 0;
        }
        this.parent.EmitSound("MountainItem.MonkeyKingBar.Proc");
        SendOverheadEventMessage(undefined, OverheadAlert.BONUS_SPELL_DAMAGE, kv.target, this.procDamage, undefined);
        return this.procDamage;
    }

    SetIsProc(value: boolean) {
        this.isProc = value;
    }

    IsProc(): boolean {
        return this.isProc || false;
    }
}

@registerModifier()
export class modifier_item_bloodthorn_custom_debuff extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    accruedDamage = 0;
    silenceDamagePercent!: number;
    damageTable!: ApplyDamageOptions;

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
        return [ModifierFunction.ON_TAKEDAMAGE, ModifierFunction.TOOLTIP];
    }

    CheckState(): Partial<Record<ModifierState, boolean>> {
        return {
            [ModifierState.CANNOT_MISS]: true,
            [ModifierState.PASSIVES_DISABLED]: true,
            [ModifierState.SILENCED]: true
        };
    }

    GetEffectName(): string {
        return "particles/items2_fx/orchid.vpcf";
    }

    GetEffectAttachType(): ParticleAttachment {
        return ParticleAttachment.OVERHEAD_FOLLOW;
    }

    OnTooltip(): number {
        return this.silenceDamagePercent * 100;
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
    }

    override OnRefresh(): void {
        this.silenceDamagePercent = this.ability.GetSpecialValueFor("silence_damage_percent") / 100;
    }

    OnTakeDamage(kv: ModifierInstanceEvent): void {
        if (kv.unit != this.parent) {
            return;
        }

        this.accruedDamage += kv.damage;
    }

    OnDestroy(): void {
        if (!IsServer()) {
            return;
        }

        const pfx = ParticleManager.CreateParticle("particles/items2_fx/orchid_pop.vpcf", ParticleAttachment.OVERHEAD_FOLLOW, this.parent);
        ParticleManager.SetParticleControl(pfx, 0, this.parent.GetAbsOrigin());
        ParticleManager.SetParticleControl(pfx, 1, Vector(100, 0, 0));
        ParticleManager.DestroyAndReleaseParticle(pfx);
        this.damageTable.damage = this.accruedDamage * this.silenceDamagePercent;
        ApplyDamage(this.damageTable);
    }
}
