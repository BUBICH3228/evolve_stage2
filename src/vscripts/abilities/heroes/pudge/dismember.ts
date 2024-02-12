import { BaseModifier, BaseModifierMotionHorizontal, registerModifier } from "../../../libraries/dota_ts_adapter";
import { BaseAbility, registerAbility } from "../../../libraries/dota_ts_adapter";

@registerAbility()
export class pudge_dismember_custom extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();
    targets: Array<CDOTA_BaseNPC> = [];

    GetIntrinsicModifierName(): string {
        if (this.caster.HasTalent("talent_pudge_dismember_custom_damage_per_kill")) {
            return modifier_dismember_custom_talent_bonus_damage.name;
        }
        return "";
    }

    GetChannelTime(): number {
        if (this.caster.HasTalent("talent_pudge_dismember_custom_damage_per_kill")) {
            return (
                super.GetChannelTime() +
                this.caster.GetModifierStackCount(modifier_dismember_custom_talent_bonus_damage.name, this.caster) *
                    this.GetSpecialValueFor("talen_dismember_bonus_channel_per_kill")
            );
        }
        return super.GetChannelTime();
    }

    GetBehavior(): AbilityBehavior | Uint64 {
        if (this.caster.HasTalent("talent_pudge_dismember_custom_aoe")) {
            return (
                AbilityBehavior.CHANNELLED +
                AbilityBehavior.IGNORE_BACKSWING +
                AbilityBehavior.AOE +
                AbilityBehavior.POINT +
                AbilityBehavior.UNIT_TARGET
            );
        }
        return super.GetBehavior();
    }

    GetAOERadius(): number {
        return this.GetSpecialValueFor("talent_dismember_aoe_radius");
    }

    override OnSpellStart(): void {
        const target = this.GetCursorTarget()!;
        let point = this.GetCursorPosition();

        if (target != undefined) {
            point = target.GetAbsOrigin();
        }

        if (target.TriggerSpellAbsorb(this) && !this.caster.HasTalent("talent_pudge_dismember_custom_aoe")) {
            return;
        }

        if (target && target.GetTeamNumber() == this.caster.GetTeamNumber()) {
            if (this.caster.HasShard() && this.caster != target && !this.caster.HasModifier(modifier_pudge_dismember_custom_swallow.name)) {
                target.AddNewModifier(this.caster, this, modifier_pudge_dismember_custom_swallow_hide.name, { duration: -1 });
                this.caster.AddNewModifier(this.caster, this, modifier_pudge_dismember_custom_swallow.name, { duration: -1 });
            } else {
                this.EndCooldown();
                this.caster.Interrupt();
            }
            return;
        }

        if (this.caster.HasTalent("talent_pudge_dismember_custom_aoe")) {
            const enemies = FindUnitsInRadius(
                this.caster.GetTeamNumber(),
                point,
                undefined,
                this.GetSpecialValueFor("talent_dismember_aoe_radius"),
                this.GetAbilityTargetTeam(),
                this.GetAbilityTargetType(),
                this.GetAbilityTargetFlags(),
                FindOrder.ANY,
                false
            );
            enemies.forEach((target) => {
                if (this.caster != target && target.GetTeamNumber() != this.caster.GetTeamNumber()) {
                    this.targets[this.targets.length] = target;
                }
            });
        } else {
            this.targets.push(target);
        }

        this.targets.forEach((target) => {
            target.AddNewModifier(this.caster, this, modifier_pudge_dismember_custom.name, { duration: this.GetChannelTime() });
        });

        if (this.targets.length == 0) {
            this.EndCooldown();
            this.caster.Interrupt();
        }
    }

    OnChannelThink(): void {
        for (let index = 0; index <= this.targets.length; index++) {
            if (this.targets[index] == null || this.targets[index] == undefined) {
                return;
            }
            if (!this.targets[index].HasModifier(modifier_pudge_dismember_custom.name)) {
                this.targets.splice(index, 1);
            }
        }

        if (this.targets.length == 0) {
            this.caster.InterruptChannel();
        }
    }

    OnChannelFinish(): void {
        this.targets.forEach((target) => {
            target.RemoveModifierByName(modifier_pudge_dismember_custom.name);
        });

        this.targets = [];
    }
}

@registerModifier()
export class modifier_pudge_dismember_custom extends BaseModifierMotionHorizontal {
    // Modifier properties
    private caster: CDOTA_BaseNPC_Hero = this.GetCaster()! as CDOTA_BaseNPC_Hero;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    damage!: number;
    damagePerStrengt!: number;
    damageTable!: ApplyDamageOptions;
    pullDistanceLimit!: number;
    pullUnitsPerSecond!: number;
    tickInterval!: number;
    bonusDamagePerKill!: number;

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

    override UpdateHorizontalMotion(me: CDOTA_BaseNPC, dt: number): void {
        if (!IsServer()) {
            return;
        }
        const distance = (this.caster.GetAbsOrigin() - me.GetAbsOrigin()) as Vector;

        if (this.parent.HasModifier(this.GetName())) {
            if (distance.Length2D() > this.pullDistanceLimit) {
                me.SetOrigin((me.GetAbsOrigin() + distance.Normalized() * this.pullUnitsPerSecond * dt) as Vector);
            }
        } else {
            this.Destroy();
        }
    }

    override OnCreated(): void {
        this.OnRefresh();

        if (!IsServer()) {
            return;
        }
        if (this.parent.IsBoss()) {
            return;
        }
        if (this.ApplyHorizontalMotionController() == false) {
            this.Destroy();
            return;
        }
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.OVERRIDE_ANIMATION];
    }

    CheckState(): Partial<Record<ModifierState, boolean>> {
        return { [ModifierState.STUNNED]: true, [ModifierState.INVISIBLE]: false };
    }

    GetOverrideAnimation(): GameActivity {
        return GameActivity.DOTA_DISABLED;
    }

    OnRefresh(): void {
        this.damage = this.ability.GetSpecialValueFor("dismember_damage");
        this.damagePerStrengt = this.ability.GetSpecialValueFor("damge_per_strengt") / 100;
        this.tickInterval = this.ability.GetSpecialValueFor("tick_interval");
        this.pullDistanceLimit = this.ability.GetSpecialValueFor("pull_distance_limit");
        this.pullUnitsPerSecond = this.ability.GetSpecialValueFor("pull_units_per_second");
        this.bonusDamagePerKill = this.ability.GetSpecialValueFor("talen_dismember_bonus_damage_per_kill") / 100;
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

        this.StartIntervalThink(this.tickInterval);
    }

    OnIntervalThink(): void {
        let damage = this.damage * (this.caster.GetSpellAmplification(false) + 1);
        damage += this.damagePerStrengt * this.caster.GetStrength();
        if (this.caster.HasTalent("talent_pudge_dismember_custom_damage_per_kill")) {
            damage += damage * this.ability.GetIntrinsicModifier()!.GetStackCount() * this.bonusDamagePerKill;
        }
        this.damageTable.damage = damage * this.tickInterval;
        ApplyDamage(this.damageTable);
        this.caster.Heal(damage * this.tickInterval, this.ability);
        SendOverheadEventMessage(undefined, OverheadAlert.HEAL, this.caster, this.damage * this.tickInterval, undefined);
    }

    OnDestroy(): void {
        if (!IsServer()) {
            return;
        }

        this.parent.RemoveHorizontalMotionController(this);
    }
}

@registerModifier()
export class modifier_dismember_custom_talent_bonus_damage extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    bonusDamagePerKill!: number;
    bonuschannelPerKill!: number;

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

    override OnCreated(): void {
        this.OnRefresh();
    }

    OnRefresh(): void {
        this.bonusDamagePerKill = this.ability.GetSpecialValueFor("talen_dismember_bonus_damage_per_kill");
        this.bonuschannelPerKill = this.ability.GetSpecialValueFor("talen_dismember_bonus_channel_per_kill");
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.ON_DEATH, ModifierFunction.TOOLTIP, ModifierFunction.TOOLTIP2];
    }

    OnTooltip(): number {
        return this.bonusDamagePerKill * this.GetStackCount();
    }

    OnTooltip2(): number {
        return this.bonuschannelPerKill * this.GetStackCount();
    }

    OnDeath(kv: ModifierInstanceEvent): void {
        if (kv.unit == this.caster) {
            return;
        }

        if (!kv.unit.HasModifier(modifier_pudge_dismember_custom.name)) {
            return;
        }

        this.IncrementStackCount();
    }
}
@registerModifier()
export class modifier_pudge_dismember_custom_swallow extends BaseModifier {
    override IsHidden() {
        return false;
    }
    override IsDebuff() {
        return false;
    }
    override RemoveOnDeath(): boolean {
        return true;
    }
}

@registerModifier()
export class modifier_pudge_dismember_custom_swallow_hide extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    regenPct!: number;
    orderLockDuration!: number;

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
        return [ModifierFunction.HEALTH_REGEN_PERCENTAGE, ModifierFunction.ON_ORDER];
    }

    GetModifierHealthRegenPercentage(): number {
        return this.regenPct;
    }

    CheckState(): Partial<Record<ModifierState, boolean>> {
        return {
            [ModifierState.INVULNERABLE]: true,
            [ModifierState.OUT_OF_GAME]: true,
            [ModifierState.DISARMED]: true,
            [ModifierState.NO_UNIT_COLLISION]: true,
            [ModifierState.UNSELECTABLE]: true,
            [ModifierState.COMMAND_RESTRICTED]: this.GetElapsedTime() <= this.orderLockDuration
        };
    }

    OnOrder(kv: ModifierOrderEvent): void {
        if (!IsServer()) {
            return;
        }

        if (kv.unit == this.parent) {
            const validOrders: UnitOrder[] = [
                UnitOrder.MOVE_TO_POSITION,
                UnitOrder.MOVE_TO_TARGET,
                UnitOrder.ATTACK_MOVE,
                UnitOrder.ATTACK_TARGET,
                UnitOrder.CAST_POSITION,
                UnitOrder.CAST_TARGET,
                UnitOrder.CAST_TARGET_TREE,
                UnitOrder.CAST_NO_TARGET,
                UnitOrder.DROP_ITEM,
                UnitOrder.GIVE_ITEM,
                UnitOrder.PICKUP_ITEM,
                UnitOrder.PICKUP_RUNE
            ];
            let isvalid = true;
            validOrders.forEach((UnitOrder) => {
                if (kv.order_type == UnitOrder && isvalid) {
                    this.Destroy();
                    isvalid = false;
                }
            });
        }
    }

    override OnCreated(): void {
        this.OnRefresh();

        if (!IsServer()) {
            return;
        }
        const pfx = ParticleManager.CreateParticle(
            "particles/units/heroes/hero_pudge/pudge_swallow.vpcf",
            ParticleAttachment.ABSORIGIN_FOLLOW,
            this.caster
        );
        ParticleManager.DestroyAndReleaseParticle(pfx);
    }

    OnRefresh(): void {
        this.regenPct = this.ability.GetSpecialValueFor("shard_regen_pct");
        this.orderLockDuration = this.ability.GetSpecialValueFor("order_lock_duration");

        if (!IsServer()) {
            return;
        }
        this.parent.AddNoDraw();
        this.StartIntervalThink(FrameTime());
    }

    OnIntervalThink(): void {
        this.parent.SetAbsOrigin(this.caster.GetAbsOrigin());
        if (!this.caster.HasModifier(modifier_pudge_dismember_custom_swallow.name)) {
            this.Destroy();
        }
    }

    OnDestroy(): void {
        if (!IsServer()) {
            return;
        }

        this.parent.RemoveNoDraw();
        this.caster.RemoveModifierByName(modifier_pudge_dismember_custom_swallow.name);
        const pfx = ParticleManager.CreateParticle(
            "particles/units/heroes/hero_pudge/pudge_swallow_release.vpcf",
            ParticleAttachment.ABSORIGIN_FOLLOW,
            this.caster
        );
        ParticleManager.DestroyAndReleaseParticle(pfx);
        EmitSoundOn("Hero_Pudge.Eject", this.caster);
    }
}
