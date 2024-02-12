import { HeroStatsTable } from "../common/data/hero_stats";
import { BaseItem, registerAbility } from "../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../libraries/dota_ts_adapter";

@registerAbility()
export class item_solar_crest_custom extends BaseItem {
    GetIntrinsicModifierName(): string {
        return modifier_item_solar_crest_custom.name;
    }

    override OnSpellStart(): void {
        const caster = this.GetCaster();
        const target = this.GetCursorTarget();

        if (target == undefined) {
            return;
        }

        target.AddNewModifier(caster, this, modifier_item_solar_crest_custom_active.name, { duration: this.GetDuration() });
        EmitSoundOn("MountainItem.Solar.Cast", target);
    }
}

@registerModifier()
export class modifier_item_solar_crest_custom extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    bonusAllStats!: number;
    bonusArmor!: number;
    bonusMovementSpeed!: number;
    bonusMana!: number;
    bonusHealth!: number;
    bonusAllStatsPerLevel!: number;

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
            ModifierFunction.STATS_AGILITY_BONUS,
            ModifierFunction.STATS_STRENGTH_BONUS,
            ModifierFunction.STATS_INTELLECT_BONUS,
            ModifierFunction.PHYSICAL_ARMOR_BONUS,
            ModifierFunction.MOVESPEED_BONUS_CONSTANT,
            ModifierFunction.MANA_BONUS,
            ModifierFunction.HEALTH_BONUS
        ];
    }

    GetModifierBonusStats_Agility(): number {
        return this.bonusAllStats + (this.ability.GetLevel() - 1) * this.bonusAllStatsPerLevel;
    }

    GetModifierBonusStats_Strength(): number {
        return this.bonusAllStats + (this.ability.GetLevel() - 1) * this.bonusAllStatsPerLevel;
    }

    GetModifierBonusStats_Intellect(): number {
        return this.bonusAllStats + (this.ability.GetLevel() - 1) * this.bonusAllStatsPerLevel;
    }

    GetModifierPhysicalArmorBonus(): number {
        return this.bonusArmor;
    }

    GetModifierMoveSpeedBonus_Constant(): number {
        return this.bonusMovementSpeed;
    }

    GetModifierHealthBonus(): number {
        return this.bonusHealth;
    }

    GetModifierManaBonus(): number {
        return this.bonusMana;
    }

    override OnCreated(): void {
        this.OnRefresh();
    }

    override OnRefresh(): void {
        this.bonusArmor = this.ability.GetSpecialValueFor("bonus_armor");
        this.bonusAllStats = this.ability.GetSpecialValueFor("bonus_all_stats");
        this.bonusMovementSpeed = this.ability.GetSpecialValueFor("bonus_movement_speed");
        this.bonusMana = this.ability.GetSpecialValueFor("bonus_mana");
        this.bonusHealth = this.ability.GetSpecialValueFor("bonus_health");

        this.bonusAllStatsPerLevel = this.ability.GetSpecialValueFor("bonus_all_stats_per_level");
    }
}

@registerModifier()
export class modifier_item_solar_crest_custom_active extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    bonusArmor!: number;
    targetAttackSpeed!: number;
    targetMovementSpeed!: number;
    targetAttackSpeedLimitBonus!: number;
    shildPerHealthPct!: number;
    physicalDamageBlock = 0;
    pfx!: ParticleID;
    targetArmorPerLevel!: number;

    // Modifier specials

    override IsHidden() {
        return false;
    }
    override IsDebuff() {
        return false;
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
        return [
            ModifierFunction.PHYSICAL_ARMOR_BONUS,
            ModifierFunction.ATTACKSPEED_BONUS_CONSTANT,
            ModifierFunction.MOVESPEED_BONUS_CONSTANT,
            ModifierFunction.INCOMING_PHYSICAL_DAMAGE_CONSTANT
        ];
    }

    GetModifierPhysicalArmorBonus(): number {
        return this.bonusArmor + (this.ability.GetLevel() - 1) * this.targetArmorPerLevel;
    }

    GetModifierMoveSpeedBonus_Constant(): number {
        return this.targetMovementSpeed;
    }

    GetModifierAttackSpeedBonus_Constant(): number {
        return this.targetAttackSpeed;
    }

    override OnCreated(): void {
        this.OnRefresh();

        this.physicalDamageBlock = this.parent.GetMaxHealth() * this.shildPerHealthPct;

        if (!IsServer()) {
            return;
        }

        this.pfx = ParticleManager.CreateParticle("particles/items2_fx/pavise_friend.vpcf", ParticleAttachment.WORLDORIGIN, this.parent);
        ParticleManager.SetParticleControl(this.pfx, 0, (this.parent.GetAbsOrigin() + Vector(200, 0, 0)) as Vector);
        ParticleManager.SetParticleControl(this.pfx, 1, this.parent.GetAbsOrigin());
        Timers.CreateTimer(FrameTime(), () => {
            ParticleManager.SetParticleControl(this.pfx, 0, (this.parent.GetAbsOrigin() + Vector(200, 0, 0)) as Vector);
            ParticleManager.SetParticleControl(this.pfx, 1, this.parent.GetAbsOrigin());
            return FrameTime();
        });

        HeroStatsTable[this.parent.GetPlayerOwnerID()]["max_attackspeed"]["StatCount"] += this.targetAttackSpeedLimitBonus;
    }

    override OnRefresh(): void {
        this.bonusArmor = this.ability.GetSpecialValueFor("target_armor");
        this.targetAttackSpeed = this.ability.GetSpecialValueFor("target_attack_speed");
        this.targetMovementSpeed = this.ability.GetSpecialValueFor("target_movement_speed");
        this.targetAttackSpeedLimitBonus = this.ability.GetSpecialValueFor("target_attack_speed_limit_bonus");
        this.shildPerHealthPct = this.ability.GetSpecialValueFor("shild_per_health_pct") / 100;

        this.targetArmorPerLevel = this.ability.GetSpecialValueFor("target_armor_per_level");

        if (!IsServer()) {
            return;
        }
        this.SetHasCustomTransmitterData(true);
        this.StartIntervalThink(0.1);
    }

    OnIntervalThink(): void {
        this.physicalDamageBlock += 0.1;
        this.SendBuffRefreshToClients();
        this.physicalDamageBlock -= 0.1;
    }

    AddCustomTransmitterData() {
        return {
            physicalDamageBlock: this.physicalDamageBlock
        };
    }

    HandleCustomTransmitterData(data: ReturnType<this["AddCustomTransmitterData"]>): void {
        this.physicalDamageBlock = data.physicalDamageBlock;
    }

    GetModifierIncomingPhysicalDamageConstant(kv: ModifierAttackEvent): number {
        if (this.physicalDamageBlock == 0) {
            return 0;
        }
        const armor = this.parent.GetPhysicalArmorValue(false);
        const dotaDecline = (0.058 * armor) / (1 + 0.058 * math.abs(armor));
        kv.damage = kv.damage / (1 - dotaDecline);

        let damageMult = 1 - armor / (100 + math.abs(armor));

        if (armor < 0) {
            damageMult = 2 - damageMult;
        }

        kv.damage = kv.damage * damageMult;
        if (!IsServer()) {
            return this.physicalDamageBlock;
        }

        if (kv.damage > this.physicalDamageBlock) {
            ParticleManager.DestroyAndReleaseParticle(this.pfx, 0, true);
            const damge = -this.physicalDamageBlock;
            this.physicalDamageBlock = -1;
            return damge;
        } else {
            this.physicalDamageBlock -= kv.damage;
            this.SendBuffRefreshToClients();
            return -kv.damage;
        }
    }

    OnDestroy(): void {
        if (!IsServer()) {
            return;
        }
        HeroStatsTable[this.parent.GetPlayerOwnerID()]["max_attackspeed"]["StatCount"] -= this.targetAttackSpeedLimitBonus;
        ParticleManager.DestroyAndReleaseParticle(this.pfx, 0, true);
    }
}
