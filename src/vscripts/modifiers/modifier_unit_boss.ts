import { ModifierUnitBossData } from "../common/data/modifier_unit_boss";
import { BaseModifier, registerModifier } from "../libraries/dota_ts_adapter";

@registerModifier()
export class modifier_unit_boss extends BaseModifier {
    private parent: CDOTA_BaseNPC_Hero = this.GetParent() as CDOTA_BaseNPC_Hero;
    ModifierUnitBossData!: ModifierUnitBossData;
    storedDamageForPurge = 0;
    IsHidden() {
        return true;
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
    RemoveOnDeath(): boolean {
        return false;
    }
    IsAura(): boolean {
        return true;
    }
    GetAuraDuration(): number {
        return 0.5;
    }
    GetAuraSearchTeam(): UnitTargetTeam {
        return UnitTargetTeam.ENEMY;
    }
    GetAuraSearchType(): UnitTargetType {
        return UnitTargetType.ALL;
    }
    GetAuraSearchFlags(): UnitTargetFlags {
        return UnitTargetFlags.INVULNERABLE + UnitTargetFlags.MAGIC_IMMUNE_ENEMIES;
    }
    GetAuraRadius(): number {
        return this.parent.GetDayTimeVisionRange() || 800;
    }
    GetModifierAura(): string {
        return "modifier_truesight";
    }
    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.PROVIDES_FOW_POSITION,
            ModifierFunction.MOVESPEED_LIMIT,
            ModifierFunction.IGNORE_MOVESPEED_LIMIT,
            ModifierFunction.ON_TAKEDAMAGE,
            ModifierFunction.PHYSICAL_ARMOR_BONUS,
            ModifierFunction.STATUS_RESISTANCE
        ];
    }
    GetModifierProvidesFOWVision(): 0 | 1 {
        return ModifierUnitBossData.bossStats[this.parent.GetUnitName()].ProvidesFOWVision || 0;
    }
    GetModifierMoveSpeed_Limit(): number {
        return ModifierUnitBossData.bossStats[this.parent.GetUnitName()].MovespeedLimit || 550;
    }
    GetModifierIgnoreMovespeedLimit(): 0 | 1 {
        return ModifierUnitBossData.bossStats[this.parent.GetUnitName()].IgnoreMovespeedLimit || 0;
    }
    GetModifierStatusResistance(): number {
        return ModifierUnitBossData.bossStats[this.parent.GetUnitName()].StatusResistance || 0;
    }
    GetModifierPhysicalArmorBonus(): number {
        return ModifierUnitBossData.bossStats[this.parent.GetUnitName()].AdditionalArmor || 0;
    }
    CheckState(): Partial<Record<ModifierState, boolean>> {
        return {
            [ModifierState.NO_HEALTH_BAR]: true,
            [ModifierState.UNSLOWABLE]: ModifierUnitBossData.bossStats[this.parent.GetUnitName()].Unslowable || false
        };
    }

    override OnCreated(): void {
        this.OnRefresh();

        if (!IsServer()) {
            return;
        }

        this.SetHasCustomTransmitterData(true);
        this.StartIntervalThink(0.05);
    }

    override OnRefresh(): void {
        if (!IsServer()) {
            return;
        }

        this.ModifierUnitBossData = ModifierUnitBossData;
        this.SendBuffRefreshToClients();
    }

    OnTakeDamage(kv: ModifierInstanceEvent): void {
        if (kv.unit != this.parent) {
            return;
        }
        if (kv.attacker == this.parent) {
            return;
        }
        if (this.parent.PassivesDisabled()) {
            return;
        }

        this.storedDamageForPurge = this.storedDamageForPurge + kv.damage;

        if (
            this.storedDamageForPurge <
            (ModifierUnitBossData.bossStats[this.parent.GetUnitName()].MaxDamagePctForPurge / 100) * this.parent.GetMaxHealth()
        ) {
            return;
        }

        this.storedDamageForPurge = 0;
        this.parent.Purge(false, true, false, true, true);
        const pfx = ParticleManager.CreateParticle(
            "particles/units/heroes/hero_tidehunter/tidehunter_krakenshell_purge.vpcf",
            ParticleAttachment.ABSORIGIN_FOLLOW,
            this.parent
        );

        ParticleManager.DestroyAndReleaseParticle(pfx, 1);
        EmitSoundOn("Bosses.DamageBlock.Purge", this.parent);
    }

    OnIntervalThink(): void {
        for (const [k, data] of Object.entries(ModifierUnitBossData.bossStats[this.parent.GetUnitName()].Items)) {
            const item = CreateItem(data.ItemName, undefined, undefined);
            if (item == undefined) {
                return;
            }
            item.SetLevel(data.ItemLevel);
            this.parent.AddItem(item);
        }
        this.SendBuffRefreshToClients();
        this.StartIntervalThink(-1);
    }

    AddCustomTransmitterData() {
        return {
            ModifierUnitBossData: this.ModifierUnitBossData
        };
    }

    HandleCustomTransmitterData(data: ReturnType<this["AddCustomTransmitterData"]>): void {
        this.ModifierUnitBossData = data.ModifierUnitBossData;
    }
}
