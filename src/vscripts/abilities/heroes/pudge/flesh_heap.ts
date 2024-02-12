import { BaseAbility, registerAbility } from "../../../libraries/dota_ts_adapter";
import { BaseModifier, registerModifier } from "../../../libraries/dota_ts_adapter";

@registerAbility()
export class pudge_flesh_heap_custom extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();
    GetIntrinsicModifierName(): string {
        return modifier_pudge_flesh_heap_custom.name;
    }

    GetCastRange(): number {
        return this.GetSpecialValueFor("flesh_heap_range");
    }

    OnSpellStart(): void {
        this.caster.AddNewModifier(this.caster, this, modifier_pudge_flesh_heap_custom_block.name, {
            duration: this.GetSpecialValueFor("duration")
        });
    }
}

@registerModifier()
export class modifier_pudge_flesh_heap_custom_block extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC_Hero = this.GetCaster()! as CDOTA_BaseNPC_Hero;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    blockDamage!: number;
    healRegenPct!: number;
    multiplier!: number;

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
        return [ModifierFunction.TOTAL_CONSTANT_BLOCK, ModifierFunction.HEALTH_REGEN_CONSTANT];
    }

    GetModifierTotal_ConstantBlock(): number {
        if (this.caster.HasTalent("talent_pudge_flesh_heap_custom_stack_multiplier")) {
            return this.blockDamage * this.multiplier;
        }
        return this.blockDamage;
    }

    GetModifierConstantHealthRegen(): number {
        return this.healRegenPct;
    }

    GetEffectName(): string {
        return "particles/units/heroes/hero_pudge/pudge_fleshheap_block_activation.vpcf";
    }

    override OnCreated(): void {
        this.OnRefresh();
    }

    OnRefresh(): void {
        this.blockDamage = this.ability.GetSpecialValueFor("block_damage");
        this.multiplier = this.ability.GetSpecialValueFor("talent_multiplier");
        this.healRegenPct = (this.ability.GetSpecialValueFor("talen_heal_regen_pct") / 100) * this.caster.GetMaxHealth();
    }
}

@registerModifier()
export class modifier_pudge_flesh_heap_custom extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    strengGainPerCreep!: number;
    strengGainPerBoss!: number;
    heapRange!: number;
    bonusStr = 0;
    targetTeam!: UnitTargetTeam;
    targetType!: UnitTargetType;
    targetFlags!: UnitTargetFlags;
    modelScale!: number;
    multiplier!: number;

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
        return [ModifierFunction.ON_DEATH, ModifierFunction.STATS_STRENGTH_BONUS, ModifierFunction.MODEL_SCALE];
    }

    GetModifierBonusStats_Strength(): number {
        if (this.caster.HasTalent("talent_pudge_flesh_heap_custom_stack_multiplier")) {
            return this.bonusStr * this.multiplier;
        }
        return this.bonusStr;
    }

    GetModifierModelScale(): number {
        return this.modelScale;
    }

    CheckState(): Partial<Record<ModifierState, boolean>> {
        if (this.caster.HasTalent("talent_pudge_flesh_heap_custom_stack_multiplier")) {
            return {
                [ModifierState.FLYING_FOR_PATHING_PURPOSES_ONLY]: true
            };
        }
        return {
            [ModifierState.FLYING_FOR_PATHING_PURPOSES_ONLY]: false
        };
    }

    AddCustomTransmitterData() {
        return {
            bonusStr: this.bonusStr
        };
    }

    HandleCustomTransmitterData(data: ReturnType<this["AddCustomTransmitterData"]>): void {
        this.bonusStr = data.bonusStr;
    }

    override OnCreated(): void {
        this.OnRefresh();
        this.SetHasCustomTransmitterData(true);
        if (!IsServer()) {
            return;
        }
        this.targetTeam = this.ability.GetAbilityTargetTeam();
        this.targetType = this.ability.GetAbilityTargetType();
        this.targetFlags = this.ability.GetAbilityTargetFlags();
    }

    OnRefresh(): void {
        this.strengGainPerCreep = this.ability.GetSpecialValueFor("str_gain_per_creep");
        this.strengGainPerBoss = this.ability.GetSpecialValueFor("str_gain_per_boss");
        this.heapRange = this.ability.GetSpecialValueFor("flesh_heap_range");
        this.multiplier = this.ability.GetSpecialValueFor("talent_multiplier");
        this.modelScale = this.ability.GetSpecialValueFor("talent_model_scale");
    }

    OnDeath(kv: ModifierInstanceEvent): void {
        if (kv.unit == this.caster) {
            return;
        }
        if (
            UnitFilter(kv.unit, this.targetTeam, this.targetType, this.targetFlags, this.caster.GetTeamNumber()) != UnitFilterResult.SUCCESS
        ) {
            return;
        }

        if (kv.attacker == this.caster || this.heapRange >= CalculateDistance(kv.unit, this.caster)) {
            const oldStr = this.bonusStr;
            if (kv.unit.IsBoss()) {
                this.bonusStr += this.strengGainPerBoss;
                this.IncrementStackCount();
            } else {
                this.bonusStr += this.strengGainPerCreep;
                this.IncrementStackCount();
            }

            for (let index = 1; index <= this.bonusStr - oldStr; index++) {
                Timers.CreateTimer((index - 1) * 0.15, () => {
                    const pfx = ParticleManager.CreateParticle(
                        "particles/units/heroes/hero_pudge/pudge_fleshheap_count.vpcf",
                        ParticleAttachment.OVERHEAD_FOLLOW,
                        this.caster
                    );
                    ParticleManager.DestroyAndReleaseParticle(pfx);
                });
            }
        }
    }
}
