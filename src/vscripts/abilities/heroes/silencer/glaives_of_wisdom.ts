import { BaseAbility, registerAbility } from "../../../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../../../libraries/dota_ts_adapter";

interface SilencerGlaivesOfWisdomData {
    damage: number;
    bounce: number;
}
@registerAbility()
export class silencer_glaives_of_wisdom_custom extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();

    Precache(context: CScriptPrecacheContext): void {
        PrecacheResource(PrecacheType.PARTICLE, "particles/units/heroes/hero_silencer/silencer_glaives_of_wisdom.vpcf", context);
    }

    GetIntrinsicModifierName(): string {
        return modifier_silencer_glaives_of_wisdom_custom.name;
    }

    ProcsMagicStick(): boolean {
        return false;
    }

    GetCastRange(): number {
        return this.caster.Script_GetAttackRange() + this.GetSpecialValueFor("attack_range_bonus");
    }

    OnProjectileHit_ExtraData(target: CDOTA_BaseNPC | undefined, location: Vector, ExtraData: SilencerGlaivesOfWisdomData): boolean | void {
        if (!target) {
            return;
        }
        const modifier = this.GetIntrinsicModifier()! as modifier_silencer_glaives_of_wisdom_custom;
        if (!modifier) {
            return;
        }
        modifier.ApplyGlaiveEffect(target, ExtraData.damage);
        modifier.FireShardBounceProjectile(target, ExtraData.bounce + 1, ExtraData.damage);
    }
}

@registerModifier()
export class modifier_silencer_glaives_of_wisdom_custom extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC_Hero = this.GetParent() as CDOTA_BaseNPC_Hero;
    targetTeam!: UnitTargetTeam;
    targetType!: UnitTargetType;
    targetFlags!: UnitTargetFlags;
    shardProjectile!: {
        Source: undefined | CDOTA_BaseNPC;
        Target: undefined | CDOTA_BaseNPC;
        Ability: CDOTABaseAbility;
        bDodgeable: boolean;
        EffectName: string;
        iMoveSpeed: number;
        ExtraData: SilencerGlaivesOfWisdomData;
    };
    intToDamagePct!: number;
    bounceRange!: number;
    bonusIntPerKillRangeSqr!: number;
    bonusIntPerKill!: number;
    bounceCount!: number;
    bonusIntPerKillShard!: number;
    stacksForSilence!: number;
    silenceDuration!: number;
    damageTable!: ApplyDamageOptions;
    procs: boolean[] = [];
    _IsManualAttack!: boolean;
    buffIntDuration!: number;

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
            ModifierFunction.ON_ATTACK_RECORD,
            ModifierFunction.ON_ATTACK_RECORD_DESTROY,
            ModifierFunction.ON_ATTACK_LANDED,
            ModifierFunction.ON_ATTACK,
            ModifierFunction.ON_ORDER,
            ModifierFunction.PROJECTILE_NAME,
            ModifierFunction.ON_DEATH
        ];
    }

    override OnCreated(): void {
        this.OnRefresh();
        if (!IsServer()) {
            return;
        }
        this.targetTeam = this.ability.GetAbilityTargetTeam();
        this.targetType = this.ability.GetAbilityTargetType();
        this.targetFlags = this.ability.GetAbilityTargetFlags();
        this.shardProjectile = {
            Source: undefined,
            Target: undefined,
            Ability: this.ability,
            bDodgeable: true,
            EffectName: this.GetGlaiveProjectileName(),
            iMoveSpeed: 0,
            ExtraData: <SilencerGlaivesOfWisdomData>{
                damage: 0,
                bounce: 0
            }
        };
    }

    OnRefresh(): void {
        this.intToDamagePct = this.ability.GetSpecialValueFor("intellect_damage_pct") / 100;
        this.bounceRange = this.ability.GetSpecialValueFor("bounce_range");
        this.bounceCount = this.ability.GetSpecialValueFor("bounce_count");
        this.bonusIntPerKillRangeSqr = this.ability.GetSpecialValueFor("permanent_int_steal_range") ^ 2;
        this.bonusIntPerKill = this.ability.GetSpecialValueFor("permanent_int_steal_amount");
        this.bonusIntPerKillShard = this.ability.GetSpecialValueFor("permanent_int_steal_amount_shard");
        this.stacksForSilence = this.ability.GetSpecialValueFor("stacks_for_silence");
        this.silenceDuration = this.ability.GetSpecialValueFor("silence_duration");
        this.buffIntDuration = this.ability.GetSpecialValueFor("talent_duration");
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

    IsAbilityReady(): boolean {
        if (!this.ability.IsCooldownReady() || !this.ability.IsActivated() || !this.ability.IsOwnersManaEnough()) {
            return false;
        }
        if (this.ability.GetAutoCastState() == false && this.IsManualAttack() == false) {
            return false;
        }
        return true;
    }

    GetGlaiveProjectileName(): string {
        return ParticleManager.GetParticleReplacement("particles/units/heroes/hero_silencer/silencer_glaives_of_wisdom.vpcf", this.parent);
    }

    GetModifierProjectileName(): string {
        if (this.IsAbilityReady()) {
            return this.GetGlaiveProjectileName();
        }
        return "";
    }

    OnAttackRecord(kv: ModifierAttackEvent): void {
        if (kv.attacker != this.parent) {
            return;
        }

        if (this.IsAbilityReady()) {
            this.procs[kv.record] = true;
            this.SetIsManualAttack(false);
        }
    }

    OnAttack(kv: ModifierAttackEvent): void {
        if (kv.attacker != this.parent) {
            return;
        }

        if (!this.procs[kv.record]) {
            return;
        }

        this.ability.UseResources(true, true, true, true);
        EmitSoundOn("Hero_Silencer.GlaivesOfWisdom", this.parent);
    }

    OnAttackLanded(kv: ModifierAttackEvent): void {
        if (kv.attacker != this.parent) {
            return;
        }
        if (
            UnitFilter(kv.target, this.targetTeam, this.targetType, this.targetFlags, this.caster.GetTeamNumber()) !=
            UnitFilterResult.SUCCESS
        ) {
            return;
        }

        if (!this.procs[kv.record]) {
            return;
        }

        const damage = this.parent.GetIntellect() * this.intToDamagePct;
        this.ApplyGlaiveEffect(kv.target, damage);
        this.FireShardBounceProjectile(kv.target, 0, damage);
        if (!this.parent.HasShard()) {
            return;
        }
        const stacks = this.GetStackCount() + 1;
        if (stacks >= this.stacksForSilence) {
            kv.target.AddNewModifier(this.parent, this.ability, "modifier_silence", { duration: this.silenceDuration });
            this.SetStackCount(0);
        } else {
            this.SetStackCount(stacks);
        }
    }

    ApplyGlaiveEffect(target: CDOTA_BaseNPC, damage: number): void {
        this.damageTable.damage = damage;
        this.damageTable.victim = target;
        const damageDone = ApplyDamage(this.damageTable);
        SendOverheadEventMessage(undefined, OverheadAlert.BONUS_SPELL_DAMAGE, target, damageDone, undefined);
        EmitSoundOn("Hero_Silencer.GlaivesOfWisdom.Damage", target);
        if (this.parent.HasTalent("talent_silencer_glaives_of_wisdom_bonus_int_per_attack")) {
            const modifier = this.parent.AddNewModifier(this.parent, this.ability, talent_modifier_silencer_glaives_of_wisdom_custom.name, {
                duration: this.buffIntDuration
            }) as talent_modifier_silencer_glaives_of_wisdom_custom;
            if (modifier != undefined) {
                if (modifier.bossStacks == undefined) {
                    modifier.bossStacks = 0;
                }
                if (target.IsBoss()) {
                    modifier.bossStacks++;
                    modifier.IncrementIndependentStackCount(() => {
                        if (modifier.bossStacks != undefined) {
                            modifier.bossStacks--;
                        }
                    });
                } else {
                    modifier.IncrementIndependentStackCount();
                }
            }
        }
    }

    FireShardBounceProjectile(source: CDOTA_BaseNPC, currentBounce: number, damage: number): void {
        if (currentBounce >= this.bounceCount) {
            return;
        }
        const enemies = FindUnitsInRadius(
            this.parent.GetTeamNumber(),
            source.GetAbsOrigin(),
            undefined,
            this.bounceRange,
            this.targetTeam,
            this.targetType,
            this.targetFlags,
            FindOrder.CLOSEST,
            false
        );

        for (let key = 0; key < enemies.length; key++) {
            const enemy = enemies[key];
            if (enemy != source) {
                this.shardProjectile.Source = source;
                this.shardProjectile.Target = enemy;
                this.shardProjectile.iMoveSpeed = this.parent.GetProjectileSpeed();
                this.shardProjectile.ExtraData.damage = damage;
                this.shardProjectile.ExtraData.bounce = currentBounce;
                ProjectileManager.CreateTrackingProjectile(this.shardProjectile);
                break;
            }
        }
    }

    OnDeath(kv: ModifierInstanceEvent): void {
        if (kv.unit == this.parent) {
            return;
        }
        if (
            UnitFilter(kv.unit, this.targetTeam, this.targetType, UnitTargetFlags.DEAD, this.parent.GetTeamNumber()) !=
            UnitFilterResult.SUCCESS
        ) {
            return;
        }
        if (CalculateDistance(this.caster, kv.unit) < this.bonusIntPerKillRangeSqr || kv.attacker == this.caster) {
            const modifier = this.caster.AddNewModifier(this.caster, this.ability, modifier_silencer_glaives_of_wisdom_custom_buff.name, {
                duration: -1
            }) as modifier_silencer_glaives_of_wisdom_custom_buff;
            if (modifier != undefined) {
                modifier.IncrementBonusIntellect(this.bonusIntPerKill);
                SendOverheadEventMessage(undefined, OverheadAlert.MANA_ADD, this.caster, this.bonusIntPerKill, undefined);
            }
        }
    }

    OnAttackRecordDestroy(kv: ModifierAttackEvent): void {
        if (kv.attacker != this.parent) {
            return;
        }
        this.procs[kv.record] = false;
    }

    OnOrder(kv: ModifierOrderEvent): void {
        if (kv.unit != this.parent) {
            return;
        }

        if (kv.order_type == UnitOrder.CAST_TARGET && kv.ability == this.ability) {
            this.SetIsManualAttack(true);
        } else {
            this.SetIsManualAttack(false);
        }
    }

    SetIsManualAttack(state: boolean): void {
        this._IsManualAttack = state;
    }

    IsManualAttack(): boolean {
        if (this._IsManualAttack != undefined) {
            return this._IsManualAttack;
        }
        return false;
    }
}

@registerModifier()
export class modifier_silencer_glaives_of_wisdom_custom_buff extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    bonusInt = 0;

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
    override RemoveOnDeath(): boolean {
        return false;
    }
    override IsPurgeException() {
        return false;
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.TOOLTIP, ModifierFunction.STATS_INTELLECT_BONUS];
    }

    OnTooltip(): number {
        return this.GetBonusIntellect();
    }

    GetModifierBonusStats_Intellect(): number {
        return this.GetBonusIntellect();
    }

    override OnCreated(): void {
        if (!IsServer()) {
            return;
        }
        this.SetHasCustomTransmitterData(true);
    }

    IncrementBonusIntellect(value: number): void {
        this.bonusInt = this.bonusInt + value;
        this.SendBuffRefreshToClients();
        this.SetStackCount(this.bonusInt);
    }

    GetBonusIntellect(): number {
        return this.bonusInt;
    }

    AddCustomTransmitterData() {
        return {
            bonusInt: this.bonusInt
        };
    }

    HandleCustomTransmitterData(data: ReturnType<this["AddCustomTransmitterData"]>): void {
        this.bonusInt = data.bonusInt;
    }
}

@registerModifier()
export class talent_modifier_silencer_glaives_of_wisdom_custom extends BaseModifier {
    // Modifier properties
    private ability: CDOTABaseAbility = this.GetAbility()!;
    bonusIntPerUnitAttack!: number;
    bonusIntPerBossAttack!: number;
    bonusInt!: number;
    bossStacks?: number;

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
        return [ModifierFunction.TOOLTIP, ModifierFunction.STATS_INTELLECT_BONUS];
    }

    OnTooltip(): number {
        return this.bonusInt;
    }

    GetModifierBonusStats_Intellect(): number {
        return this.GetBonusIntellect();
    }

    override OnCreated(): void {
        this.OnRefresh();
        if (!IsServer()) {
            return;
        }
        this.SetHasCustomTransmitterData(true);
    }

    OnRefresh(): void {
        this.bonusIntPerUnitAttack = this.ability.GetSpecialValueFor("talent_bonus_int_per_unit");
        this.bonusIntPerBossAttack = this.ability.GetSpecialValueFor("talent_bonus_int_per_boss");
    }

    GetBonusIntellect(): number {
        if (this.bossStacks == undefined) {
            return 0;
        } else {
            return this.bonusIntPerUnitAttack * (this.GetStackCount() - this.bossStacks) + this.bonusIntPerBossAttack * this.bossStacks;
        }
    }

    AddCustomTransmitterData() {
        return {
            bonusInt: this.GetBonusIntellect()
        };
    }

    HandleCustomTransmitterData(data: ReturnType<this["AddCustomTransmitterData"]>): void {
        this.bonusInt = data.bonusInt;
    }
}
