import { BaseAbility, registerAbility } from "../../../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../../../libraries/dota_ts_adapter";
import { ancient_apparition_ice_vortex_custom } from "./ice_vortex";

@registerAbility()
export class ancient_apparition_chilling_touch_custom extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();

    Precache(context: CScriptPrecacheContext): void {
        PrecacheResource(
            PrecacheType.PARTICLE,
            "particles/units/heroes/hero_ancient_apparition/ancient_apparition_chilling_touch_projectile.vpcf",
            context
        );
        PrecacheResource(PrecacheType.PARTICLE, "particles/units/heroes/hero_crystalmaiden/maiden_crystal_nova.vpcf", context);
    }

    GetIntrinsicModifierName(): string {
        return modifier_ancient_apparition_chilling_touch_custom.name;
    }

    ProcsMagicStick(): boolean {
        return false;
    }

    GetCastRange(): number {
        return this.caster.Script_GetAttackRange() + this.GetSpecialValueFor("attack_range_bonus");
    }
}

@registerModifier()
export class modifier_ancient_apparition_chilling_touch_custom extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC_Hero = this.GetParent() as CDOTA_BaseNPC_Hero;
    targetTeam!: UnitTargetTeam;
    targetType!: UnitTargetType;
    targetFlags!: UnitTargetFlags;
    damage!: number;
    damageTable!: ApplyDamageOptions;
    procs: boolean[] = [];
    _IsManualAttack!: boolean;
    damageRadius!: number;
    damagePct!: number;

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
            ModifierFunction.PROJECTILE_NAME
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
    }

    OnRefresh(): void {
        this.damage = this.ability.GetSpecialValueFor("damage");
        this.damageRadius = this.ability.GetSpecialValueFor("talent_damage_radius");
        this.damagePct = this.ability.GetSpecialValueFor("talent_damage_pct") / 100;
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

    GetChillingTouchProjectileName(): string {
        return ParticleManager.GetParticleReplacement(
            "particles/units/heroes/hero_ancient_apparition/ancient_apparition_chilling_touch_projectile.vpcf",
            this.parent
        );
    }

    GetModifierProjectileName(): string {
        if (this.IsAbilityReady()) {
            return this.GetChillingTouchProjectileName();
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
        EmitSoundOn("Hero_Ancient_Apparition.ChillingTouchCast", this.parent);
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

        const damage = this.damage * (this.caster.GetSpellAmplification(false) + 1);
        this.ApplyChillingTouchEffect(kv.target, damage);
        if (this.caster.HasTalent("talent_ancient_apparition_chilling_touch_damage_aoe")) {
            this.FireChillingTouchDamageAOE(kv.target, damage);
        }
    }

    ApplyChillingTouchEffect(target: CDOTA_BaseNPC, damage: number): void {
        this.damageTable.damage = damage;
        this.damageTable.victim = target;
        const damageDone = ApplyDamage(this.damageTable);
        if (this.caster.HasTalent("talent_ancient_apparition_chilling_touch_cast_ice_vortex")) {
            if (RollPseudoRandomPercentage(this.ability.GetSpecialValueFor("talen_chance"), this.ability)) {
                const ability = this.caster.FindAbilityByName(
                    "ancient_apparition_ice_vortex_custom"
                ) as ancient_apparition_ice_vortex_custom;
                if (ability != undefined || ability != null) {
                    ability.OnSpellStart(target.GetAbsOrigin());
                }
            }
        }
        SendOverheadEventMessage(undefined, OverheadAlert.BONUS_SPELL_DAMAGE, target, damageDone, undefined);
        EmitSoundOn("Hero_Ancient_Apparition.ChillingTouch.Target", target);
    }

    FireChillingTouchDamageAOE(target: CDOTA_BaseNPC, damageOld: number): void {
        const enemies = FindUnitsInRadius(
            this.parent.GetTeamNumber(),
            target.GetAbsOrigin(),
            undefined,
            this.damageRadius,
            this.targetTeam,
            this.targetType,
            this.targetFlags,
            FindOrder.CLOSEST,
            false
        );
        //const pfx = ParticleManager.CreateParticle(
        //    "particles/units/heroes/hero_crystalmaiden/maiden_crystal_nova.vpcf",
        //    ParticleAttachment.WORLDORIGIN,
        //    target
        //);
        //ParticleManager.SetParticleControl(pfx, 0, target.GetAbsOrigin());
        //ParticleManager.SetParticleControl(pfx, 1, Vector(this.damageRadius, 0.5, this.damageRadius));
        //ParticleManager.DestroyAndReleaseParticle(pfx);
        enemies.forEach((enemy) => {
            if (enemy != target) {
                const damage = damageOld * this.damagePct;
                this.damageTable.damage = damage;
                this.damageTable.victim = enemy;
                ApplyDamage(this.damageTable);
            }
        });
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
