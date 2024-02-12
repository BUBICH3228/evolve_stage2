import { registerModifier, BaseModifier } from "../libraries/dota_ts_adapter";
import { BaseItem, registerAbility } from "../libraries/dota_ts_adapter";

@registerAbility()
export class item_mjollnir_custom extends BaseItem {
    GetIntrinsicModifierName(): string {
        return modifier_item_mjollnir_custom.name;
    }
    override OnSpellStart(): void {
        const caster = this.GetCaster();
        const target = this.GetCursorTarget();

        if (target == undefined) {
            return;
        }

        target.AddNewModifier(caster, this, modifier_item_mjollnir_custom_active.name, { duration: this.GetDuration() });
        target.EmitSound("MountainItem.Mjollnir.Cast");
    }

    StartChainLightning(
        attacker: CDOTA_BaseNPC,
        target: CDOTA_BaseNPC,
        targetTeam: UnitTargetTeam,
        targetType: UnitTargetType,
        targetFlags: UnitTargetFlags,
        chainDamage: number,
        totalStrikes: number,
        chainRadius: number,
        strikeDelay: number
    ): void {
        const damagedEnemies: boolean[] = [];
        const source = attacker;
        const attackerTeamNumber = attacker.GetTeamNumber();

        let lastDamagedEnemy = target;
        let lastKnownPosition = target.GetAbsOrigin();
        damagedEnemies[target.GetEntityIndex()] = true;

        attacker.EmitSound("MountainItem.Maelstrom.Chain_Lightning");

        this._ChainLightning(attacker, source, target, chainDamage);
        let currentStrike = 1;

        const GetNextEnemy = (lastDamagedEnemy: CDOTA_BaseNPC): CDOTA_BaseNPC | undefined => {
            let searchPosition = lastKnownPosition;
            if (lastDamagedEnemy.IsNull() == false) {
                searchPosition = target.GetAbsOrigin();
            }
            const enemies = FindUnitsInRadius(
                attackerTeamNumber,
                searchPosition,
                undefined,
                chainRadius,
                targetTeam,
                targetType,
                targetFlags,
                FindOrder.ANY,
                false
            );

            for (const target of enemies) {
                if (damagedEnemies[target.GetEntityIndex()] == undefined) {
                    return target;
                }
            }
        };

        Timers.CreateTimer(strikeDelay, () => {
            if (currentStrike < totalStrikes) {
                const nextTarget = GetNextEnemy(lastDamagedEnemy);
                if (nextTarget != undefined) {
                    this._ChainLightning(attacker, lastDamagedEnemy, nextTarget, chainDamage);
                    currentStrike++;
                    damagedEnemies[nextTarget.GetEntityIndex()] = true;
                    lastDamagedEnemy = nextTarget;
                    lastKnownPosition = nextTarget.GetAbsOrigin();
                    return strikeDelay;
                }
            }
        });
    }

    _ChainLightning(attacker: CDOTA_BaseNPC, source: CDOTA_BaseNPC, target: CDOTA_BaseNPC, damage: number) {
        const pfx = ParticleManager.CreateParticle("particles/items_fx/chain_lightning.vpcf", ParticleAttachment.ABSORIGIN, source);
        ParticleManager.SetParticleControlEnt(
            pfx,
            0,
            source,
            ParticleAttachment.POINT_FOLLOW,
            ParticleAttachmentLocation.HITLOC,
            source.GetAbsOrigin(),
            true
        );
        ParticleManager.SetParticleControlEnt(
            pfx,
            1,
            target,
            ParticleAttachment.POINT_FOLLOW,
            ParticleAttachmentLocation.HITLOC,
            target.GetAbsOrigin(),
            true
        );
        ParticleManager.SetParticleControl(pfx, 62, Vector(2, 0, 2));
        ParticleManager.DestroyAndReleaseParticle(pfx, 1);

        source.EmitSound("MountainItem.Maelstrom.Chain_Lightning.Jump");
        ApplyDamage({
            victim: target,
            damage:
                damage * (attacker.GetSpellAmplification(false) + 1) +
                (attacker.GetAverageTrueAttackDamage(target) * this.GetSpecialValueFor("damage_per_attack_damage_pct")) / 100,
            damage_type: this.GetAbilityDamageType(),
            attacker: attacker,
            ability: this,
            damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION
        });
    }
}

@registerModifier()
export class modifier_item_mjollnir_custom extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbilityMjollnir = this.GetAbility()! as CDOTABaseAbilityMjollnir;
    private parent: CDOTA_BaseNPC = this.GetParent();
    bonusDamage!: number;
    bonusAttackSpeed!: number;
    targetTeam!: UnitTargetTeam;
    targetType!: UnitTargetType;
    targetFlags!: UnitTargetFlags;
    chainChance!: number;
    chainDamage!: number;
    chainStrikes!: number;
    chainRadius!: number;
    chainDelay!: number;
    chainCooldown!: number;
    damagePerLevel!: number;
    bonusAttackSpeedPerLevel!: number;

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
        return true;
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.PREATTACK_BONUS_DAMAGE, ModifierFunction.ATTACKSPEED_BONUS_CONSTANT, ModifierFunction.ON_ATTACK_LANDED];
    }

    GetModifierPreAttack_BonusDamage(): number {
        return this.bonusDamage;
    }

    GetModifierAttackSpeedBonus_Constant(): number {
        return this.bonusAttackSpeed + (this.ability.GetLevel() - 1) * this.bonusAttackSpeedPerLevel;
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

    override OnRefresh(): void {
        this.bonusDamage = this.ability.GetSpecialValueFor("bonus_damage");
        this.bonusAttackSpeed = this.ability.GetSpecialValueFor("bonus_attack_speed");
        this.chainChance = this.ability.GetSpecialValueFor("chain_chance");
        this.chainDamage = this.ability.GetSpecialValueFor("chain_damage");
        this.chainStrikes = this.ability.GetSpecialValueFor("chain_strikes");
        this.chainRadius = this.ability.GetSpecialValueFor("chain_radius");
        this.chainDelay = this.ability.GetSpecialValueFor("chain_delay");
        this.damagePerLevel = this.ability.GetSpecialValueFor("damage_per_level");
        this.bonusAttackSpeedPerLevel = this.ability.GetSpecialValueFor("bonus_attack_speed_per_level");
    }

    OnAttackLanded(kv: ModifierAttackEvent): void {
        if (kv.attacker != this.parent) {
            return;
        }

        if (RollPseudoRandomPercentage(this.chainChance, this) == false) {
            return;
        }

        if (
            UnitFilter(kv.target, this.targetTeam, this.targetType, this.targetFlags, this.parent.GetTeamNumber()) !=
            UnitFilterResult.SUCCESS
        ) {
            return;
        }

        this.ability.StartChainLightning(
            this.parent,
            kv.target,
            this.targetTeam,
            this.targetType,
            this.targetFlags,
            this.chainDamage + (this.ability.GetLevel() - 1) * this.damagePerLevel,
            this.chainStrikes,
            this.chainRadius,
            this.chainDelay
        );
    }
}

interface CDOTABaseAbilityMjollnir extends CDOTABaseAbility {
    StartChainLightning(
        attacker: CDOTA_BaseNPC,
        target: CDOTA_BaseNPC,
        targetTeam: UnitTargetTeam,
        targetType: UnitTargetType,
        targetFlags: UnitTargetFlags,
        chainDamage: number,
        chainStrikes: number,
        chainRadius: number,
        chainDelay: number
    ): void;
}

@registerModifier()
export class modifier_item_mjollnir_custom_active extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbilityMjollnir = this.GetAbility()! as CDOTABaseAbilityMjollnir;
    private parent: CDOTA_BaseNPC = this.GetParent();
    staticStrikes!: number;
    staticDamage!: number;
    staticInterval!: number;
    targetTeam!: UnitTargetTeam;
    targetType!: UnitTargetType;
    targetFlags!: UnitTargetFlags;
    damagePerLevel!: number;

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
    override RemoveOnDeath() {
        return true;
    }

    override OnCreated(): void {
        this.OnRefresh();

        if (!IsServer()) {
            return;
        }

        this.targetTeam = this.ability.GetAbilityTargetTeam(1);
        this.targetType = this.ability.GetAbilityTargetType(1);
        this.targetFlags = this.ability.GetAbilityTargetFlags(1);
        const pfx = ParticleManager.CreateParticle(
            "particles/items2_fx/mjollnir_shield.vpcf",
            ParticleAttachment.ABSORIGIN_FOLLOW,
            this.parent
        );
        this.AddParticle(pfx, false, false, -1, false, false);
        this.StartIntervalThink(this.staticInterval);
    }

    override OnRefresh(): void {
        this.staticStrikes = this.ability.GetSpecialValueFor("static_strikes");
        this.staticDamage = this.ability.GetSpecialValueFor("static_damage");
        this.staticInterval = this.ability.GetSpecialValueFor("static_interval");
        this.damagePerLevel = this.ability.GetSpecialValueFor("damage_per_level");
    }

    OnIntervalThink(): void {
        const enemies = FindUnitsInRadius(
            this.parent.GetTeamNumber(),
            this.parent.GetAbsOrigin(),
            undefined,
            this.ability.GetCastRange(this.parent.GetAbsOrigin(), this.parent),
            this.targetTeam,
            this.targetType,
            this.targetFlags,
            FindOrder.CLOSEST,
            false
        );

        if (enemies.length == 0) {
            return;
        }

        this.ability.StartChainLightning(
            this.parent,
            enemies[0],
            this.targetTeam,
            this.targetType,
            this.targetFlags,
            this.staticDamage + (this.ability.GetLevel() - 1) * this.damagePerLevel,
            this.staticStrikes,
            650,
            0.25
        );
    }
}
