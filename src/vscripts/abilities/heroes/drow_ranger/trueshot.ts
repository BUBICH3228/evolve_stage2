import { BaseAbility, BaseModifier, registerAbility, registerModifier } from "../../../libraries/dota_ts_adapter";

@registerAbility()
export class drow_ranger_trueshot_custom extends BaseAbility {
    override GetCastRange(): number {
        return this.GetSpecialValueFor("aura_radius");
    }

    override GetIntrinsicModifierName(): string {
        return modifier_drow_ranger_trueshot_custom.name;
    }
}

@registerModifier()
export class modifier_drow_ranger_trueshot_custom extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    private targetTeam!: UnitTargetTeam;
    private targetType!: UnitTargetType;
    private targetFlags!: UnitTargetFlags;
    private radius!: number;

    override IsAura(): boolean {
        return true;
    }

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

    override RemoveOnDeath(): boolean {
        return false;
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
        this.radius = this.ability.GetCastRange(undefined, undefined);
    }

    override GetAuraRadius(): number {
        return this.radius;
    }

    override GetAuraSearchFlags(): UnitTargetFlags {
        return this.targetFlags;
    }

    override GetAuraSearchTeam(): UnitTargetTeam {
        return this.targetTeam;
    }

    override GetAuraSearchType(): UnitTargetType {
        return this.targetType;
    }

    override GetAuraDuration(): number {
        return 0;
    }

    override GetModifierAura(): string {
        return modifier_drow_ranger_trueshot_custom_aura_buff.name;
    }
}

@registerModifier()
export class modifier_drow_ranger_trueshot_custom_aura_buff extends BaseModifier {
    // Modifier properties
    caster: CDOTA_BaseNPC_Hero = this.GetCaster() as CDOTA_BaseNPC_Hero;
    ability: CDOTABaseAbility = this.GetAbility()!;
    agilityPctToBonusDamage!: number;
    bonusDamage!: number;

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
        if (!IsServer()) {
            return;
        }

        this.OnRefresh();
        this.SetHasCustomTransmitterData(true);
        this.OnIntervalThink();
        this.StartIntervalThink(1);
    }

    override OnRefresh(): void {
        this.agilityPctToBonusDamage = this.ability.GetSpecialValueFor("agility_pct_to_bonus_damage") / 100;
    }

    override OnIntervalThink(): void {
        const newBonusDamage = this.caster.GetAgility() * this.agilityPctToBonusDamage;
        if (this.bonusDamage != newBonusDamage) {
            this.bonusDamage = newBonusDamage;
            this.SendBuffRefreshToClients();
        }
    }

    override DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.PREATTACK_BONUS_DAMAGE];
    }

    override GetModifierPreAttack_BonusDamage(): number {
        return this.bonusDamage;
    }

    AddCustomTransmitterData() {
        return {
            bonusDamage: this.bonusDamage
        };
    }

    HandleCustomTransmitterData(data: ReturnType<this["AddCustomTransmitterData"]>): void {
        this.bonusDamage = data.bonusDamage;
    }
}
