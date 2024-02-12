import { BaseAbility, registerAbility } from "../../../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../../../libraries/dota_ts_adapter";
import { modifier_shild_custom } from "../../../modifiers/modifier_shild_custom";

@registerAbility()
export class wraith_king_reincarnation_custom extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();

    GetIntrinsicModifierName(): string {
        return modifier_wraith_king_reincarnation_custom.name;
    }
}

@registerModifier()
export class modifier_wraith_king_reincarnation_custom extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    reincarnateTime!: number;
    targetTeam!: UnitTargetTeam;
    targetType!: UnitTargetType;
    targetFlags!: UnitTargetFlags;
    slowRadius!: number;
    slowDuration!: number;
    scepterAuraRadius!: number;
    targetTeamScepter!: UnitTargetTeam;
    targetTypeScepter!: UnitTargetType;
    targetFlagsScepter!: UnitTargetFlags;
    inspirationDuration!: number;
    healthShildPerMaxHealth!: number;

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
        return this.parent.HasScepter();
    }

    GetAuraSearchTeam(): UnitTargetTeam {
        return this.targetTeamScepter;
    }

    GetAuraSearchType(): UnitTargetType {
        return this.targetTypeScepter;
    }

    GetAuraSearchFlags(): UnitTargetFlags {
        return this.targetFlagsScepter;
    }

    GetAuraRadius(): number {
        return this.scepterAuraRadius;
    }

    GetModifierAura(): string {
        return modifier_wraith_king_reincarnation_custom_buff.name;
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.REINCARNATION, ModifierFunction.ON_TAKEDAMAGE];
    }

    ReincarnateTime(): number {
        if (!IsServer()) {
            return 0;
        }
        if (this.ability.IsFullyCastable()) {
            this.Reincarnate();
            return this.reincarnateTime;
        }
        return 0;
    }

    override OnCreated(): void {
        this.OnRefresh();

        if (!IsServer()) {
            return;
        }

        this.targetTeam = this.ability.GetAbilityTargetTeam(1);
        this.targetType = this.ability.GetAbilityTargetType(1);
        this.targetFlags = this.ability.GetAbilityTargetFlags(1);

        this.targetTeamScepter = this.ability.GetAbilityTargetTeam(2);
        this.targetTypeScepter = this.ability.GetAbilityTargetType(2);
        this.targetFlagsScepter = this.ability.GetAbilityTargetFlags(2);
    }

    OnRefresh(): void {
        this.reincarnateTime = this.ability.GetSpecialValueFor("reincarnate_time");
        this.slowRadius = this.ability.GetSpecialValueFor("slow_radius");
        this.slowDuration = this.ability.GetSpecialValueFor("slow_duration");
        this.scepterAuraRadius = this.ability.GetSpecialValueFor("scepter_aura_radius");

        this.inspirationDuration = this.ability.GetSpecialValueFor("talent_inspiration_duration");
        this.healthShildPerMaxHealth =
            (this.ability.GetSpecialValueFor("talent_shild_health_shild_per_max_health") / 100) * this.parent.GetMaxHealth();
    }

    Reincarnate(): void {
        this.ability.UseResources(true, false, false, true);
        AddFOWViewer(this.parent.GetTeamNumber(), this.parent.GetAbsOrigin(), 800, this.reincarnateTime, false);
        const pfx = ParticleManager.CreateParticle(
            "particles/units/heroes/hero_skeletonking/wraith_king_reincarnate.vpcf",
            ParticleAttachment.ABSORIGIN,
            this.parent
        );
        ParticleManager.SetParticleControl(pfx, 0, this.parent.GetAbsOrigin());
        ParticleManager.SetParticleControl(pfx, 1, Vector(this.reincarnateTime, 0, 0));
        ParticleManager.DestroyAndReleaseParticle(pfx);

        const enemies = FindUnitsInRadius(
            this.parent.GetTeamNumber(),
            this.parent.GetAbsOrigin(),
            undefined,
            this.slowRadius,
            this.targetTeam,
            this.targetType,
            this.targetFlags,
            FindOrder.ANY,
            false
        );

        enemies.forEach((target) => {
            target.AddNewModifier(this.parent, this.ability, modifier_wraith_king_reincarnation_custom_debuff.name, {
                duration: this.slowDuration
            });
        });

        Timers.CreateTimer(this.reincarnateTime + 0.1, () => {
            if (this.caster.HasTalent("talent_wraith_king_reincarnation_custom_shild")) {
                this.parent.AddNewModifier(this.parent, this.ability, modifier_shild_custom.name, {
                    duaration: -1,
                    PhysicalDamageBlock: this.healthShildPerMaxHealth
                });
            }

            if (this.caster.HasTalent("talent_wraith_king_reincarnation_custom_inspiration")) {
                this.parent.AddNewModifier(
                    this.parent,
                    this.ability,
                    modifier_wraith_king_reincarnation_custom_talent_inspiration_buff.name,
                    {
                        duration: this.inspirationDuration
                    }
                );
            }
        });
    }
}

@registerModifier()
export class modifier_wraith_king_reincarnation_custom_debuff extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    attackSlow!: number;
    moveSpeedPctSlow!: number;

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
        return [ModifierFunction.ATTACKSPEED_BONUS_CONSTANT, ModifierFunction.MOVESPEED_BONUS_PERCENTAGE];
    }

    GetModifierAttackSpeedBonus_Constant(): number {
        return this.attackSlow;
    }

    GetModifierMoveSpeedBonus_Percentage(): number {
        return this.moveSpeedPctSlow;
    }

    GetEffectName(): string {
        return "particles/units/heroes/hero_skeletonking/wraith_king_reincarnate_slow_debuff.vpcf";
    }

    GetEffectAttachType(): ParticleAttachment {
        return ParticleAttachment.ABSORIGIN;
    }

    override OnCreated(): void {
        this.OnRefresh();
    }

    OnRefresh(): void {
        this.attackSlow = -1 * this.ability.GetSpecialValueFor("attack_slow");
        this.moveSpeedPctSlow = -1 * this.ability.GetSpecialValueFor("move_speed_pct_slow");
    }
}

@registerModifier()
export class modifier_wraith_king_reincarnation_custom_buff extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    scepterAttackSpeed!: number;
    scepterMoveSpeedPct!: number;
    scepterDuration!: number;
    delayingDeath = false;
    minHealth = 1;

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
            ModifierFunction.MIN_HEALTH,
            ModifierFunction.ATTACKSPEED_BONUS_CONSTANT,
            ModifierFunction.MOVESPEED_BONUS_PERCENTAGE,
            ModifierFunction.ON_TAKEDAMAGE,
            ModifierFunction.MODEL_SCALE
        ];
    }

    GetMinHealth(): number {
        return this.minHealth;
    }

    GetModifierAttackSpeedBonus_Constant(): number {
        if (this.delayingDeath == true) {
            return this.scepterAttackSpeed;
        }
        return 0;
    }

    GetModifierMoveSpeedBonus_Percentage(): number {
        if (this.delayingDeath == true) {
            return this.scepterMoveSpeedPct;
        }
        return 0;
    }

    GetEffectName(): string {
        if (this.delayingDeath == true) {
            return "particles/units/heroes/hero_skeletonking/wraith_king_ambient.vpcf";
        }
        return "";
    }

    GetEffectAttachType(): ParticleAttachment {
        return ParticleAttachment.ABSORIGIN;
    }

    GetModifierModelScale(): number {
        if (this.delayingDeath == true) {
            return 30;
        }
        return 0;
    }

    override OnCreated(): void {
        this.OnRefresh();
    }

    OnRefresh(): void {
        this.scepterDuration = this.ability.GetSpecialValueFor("scepter_duration");
        this.scepterAttackSpeed = this.ability.GetSpecialValueFor("scepter_attack_speed");
        this.scepterMoveSpeedPct = this.ability.GetSpecialValueFor("scepter_move_speed_pct");
    }

    OnTakeDamage(kv: ModifierInstanceEvent): void {
        if (kv.unit != this.parent) {
            return;
        }

        if (kv.unit.GetHealth() >= kv.damage) {
            return;
        }

        if (this.delayingDeath == true) {
            return;
        }

        if (kv.unit == this.caster && this.ability.IsCooldownReady()) {
            kv.unit.ForceKill(true);
            return;
        }

        this.delayingDeath = true;
        this.parent.SetRenderColor(0, 128, 0);

        Timers.CreateTimer(this.scepterDuration, () => {
            this.parent.SetRenderColor(255, 255, 255);
            this.delayingDeath = false;
            this.minHealth = -1;
            kv.unit.Kill(this.ability, kv.attacker);
        });
    }
}

@registerModifier()
export class modifier_wraith_king_reincarnation_custom_talent_inspiration_buff extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    bonusOutgoingDamge!: number;

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

    RemoveOnDeath(): boolean {
        return false;
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.TOTALDAMAGEOUTGOING_PERCENTAGE];
    }

    GetModifierTotalDamageOutgoing_Percentage(): number {
        return this.bonusOutgoingDamge;
    }

    override OnCreated(): void {
        this.bonusOutgoingDamge = this.ability.GetSpecialValueFor("talent_inspiration_bonus_outgoing_damge");
    }
}

@registerModifier()
export class modifier_wraith_king_reincarnation_custom_talent_shild_buff extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    healthShildPerMaxHealth!: number;

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

    RemoveOnDeath(): boolean {
        return false;
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.INCOMING_PHYSICAL_DAMAGE_CONSTANT];
    }

    GetModifierIncomingPhysicalDamageConstant(kv: ModifierAttackEvent): number {
        if (!IsServer()) {
            return this.healthShildPerMaxHealth;
        }

        if (kv.damage > this.healthShildPerMaxHealth) {
            this.Destroy();
            return -this.healthShildPerMaxHealth;
        } else {
            this.healthShildPerMaxHealth -= kv.damage;
            this.SendBuffRefreshToClients();
            return -kv.damage;
        }
    }

    override OnCreated(): void {
        this.healthShildPerMaxHealth =
            (this.ability.GetSpecialValueFor("talent_shild_health_shild_per_max_health") / 100) * this.parent.GetMaxHealth();
        if (!IsServer()) {
            return;
        }
        this.SetHasCustomTransmitterData(true);
    }

    AddCustomTransmitterData() {
        return {
            current_shield: this.healthShildPerMaxHealth
        };
    }

    HandleCustomTransmitterData(data: ReturnType<this["AddCustomTransmitterData"]>): void {
        this.healthShildPerMaxHealth = data.current_shield;
    }
}
