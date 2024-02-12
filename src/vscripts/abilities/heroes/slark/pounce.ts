import { BaseAbility, registerAbility } from "../../../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../../../libraries/dota_ts_adapter";

interface SlarkPounceData {
    isOriginal: boolean;
}

@registerAbility()
export class slark_pounce_custom extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();

    GetAOERadius(): number {
        return this.GetSpecialValueFor("distance");
    }

    Precache(context: CScriptPrecacheContext): void {
        PrecacheResource(PrecacheType.PARTICLE, "particles/custom/units/heroes/slark/pounce/sea_of_suffering_1.vpcf", context);
    }

    override OnSpellStart(): void {
        if (!IsServer()) {
            return;
        }

        const distance = this.GetSpecialValueFor("distance");
        const speed = this.GetSpecialValueFor("speed");

        this.caster.AddNewModifier(this.caster, this, "modifier_generic_arc", {
            distance: distance,
            speed: speed,
            height: 150,
            fix_end: false,
            isForward: true
        });

        const pfx = ParticleManager.CreateParticle(
            "particles/units/heroes/hero_slark/slark_pounce_start.vpcf",
            ParticleAttachment.ABSORIGIN_FOLLOW,
            this.caster
        );
        ParticleManager.DestroyAndReleaseParticle(pfx);

        this.caster.AddNewModifier(this.caster, this, modifier_slark_pounce_custom.name, { duration: distance / speed });

        EmitSoundOn("Hero_Slark.Pounce.Cast", this.caster);
    }
}

@registerModifier()
export class modifier_slark_pounce_custom extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    targetTeam!: UnitTargetTeam;
    targetType!: UnitTargetType;
    targetFlags!: UnitTargetFlags;
    duration!: number;
    debufDuration!: number;

    // Modifier specials

    override IsHidden() {
        return true;
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

    override OnCreated(): void {
        this.OnRefresh();
        if (!IsServer()) {
            return;
        }
        this.parent.StartGesture(GameActivity.DOTA_SLARK_POUNCE);
        this.targetTeam = this.ability.GetAbilityTargetTeam();
        this.targetType = this.ability.GetAbilityTargetType();
        this.targetFlags = this.ability.GetAbilityTargetFlags();

        this.StartIntervalThink(0.01);
        this.OnIntervalThink();
    }

    OnRefresh(): void {
        this.duration = this.ability.GetSpecialValueFor("duration");
        this.debufDuration = this.ability.GetSpecialValueFor("debuf_duration");
    }

    GetEffectName(): string {
        return "particles/units/heroes/hero_slark/slark_pounce_trail.vpcf";
    }

    GetEffectAttachType(): ParticleAttachment {
        return ParticleAttachment.ABSORIGIN_FOLLOW;
    }

    OnIntervalThink(): void {
        const enemies = FindUnitsInRadius(
            this.caster.GetTeamNumber(),
            this.parent.GetAbsOrigin(),
            undefined,
            100,
            this.targetTeam,
            this.targetType,
            this.targetFlags,
            FindOrder.CLOSEST,
            false
        );

        if (enemies.length != 0) {
            this.Destroy();
        }
    }

    OnDestroy(): void {
        if (!IsServer()) {
            return;
        }

        const modifier = this.parent.FindModifierByName("modifier_generic_arc");

        if (modifier != undefined) {
            modifier.Destroy();
        }

        CreateModifierThinker(
            this.caster,
            this.ability,
            modifierThinker_slark_pounce_custom_debuff.name,
            { duration: this.duration },
            this.parent.GetAbsOrigin(),
            this.parent.GetTeamNumber(),
            false
        );

        if (
            this.parent.HasTalent("talent_slark_pounce_custom_delaying_death") &&
            this.parent.FindModifierByName(modifier_slark_pounce_custom_delayed_death_coldown.name) == undefined
        ) {
            this.parent.AddNewModifier(this.caster, this.ability, modifier_slark_pounce_custom_buff.name, {
                duration: this.duration + this.debufDuration
            });
        }
    }
}

@registerModifier()
export class modifierThinker_slark_pounce_custom_debuff extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    radius!: number;
    visionAoe!: number;
    vortexDuration!: number;
    targetFlags!: UnitTargetFlags;
    targetTeam!: UnitTargetTeam;
    targetType!: UnitTargetType;

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

    override IsAura(): boolean {
        return true;
    }

    GetAuraSearchFlags(): UnitTargetFlags {
        return this.targetFlags;
    }

    GetAuraSearchTeam(): UnitTargetTeam {
        return this.targetTeam;
    }

    GetAuraSearchType(): UnitTargetType {
        return this.targetType;
    }

    GetAuraRadius(): number {
        return this.radius;
    }

    GetModifierAura(): string {
        return modifier_slark_pounce_custom_debuff.name;
    }

    override OnCreated(): void {
        this.OnRefresh();
        if (!IsServer()) {
            return;
        }
        this.targetTeam = this.ability.GetAbilityTargetTeam();
        this.targetType = this.ability.GetAbilityTargetType();
        this.targetFlags = this.ability.GetAbilityTargetFlags();

        const pfx = ParticleManager.CreateParticle(
            "particles/custom/units/heroes/slark/pounce/sea_of_suffering_1.vpcf",
            ParticleAttachment.WORLDORIGIN,
            this.caster
        );
        ParticleManager.SetParticleControl(pfx, 1, this.parent.GetAbsOrigin());
        ParticleManager.SetParticleControl(pfx, 0, Vector(this.GetDuration(), this.radius, 0));
        this.AddParticle(pfx, false, false, -1, false, false);
    }

    override OnRefresh(): void {
        this.radius = this.ability.GetSpecialValueFor("radius");
    }

    OnDestroy(): void {
        if (!IsServer()) {
            return;
        }

        this.parent.RemoveSelf;
    }
}

@registerModifier()
export class modifier_slark_pounce_custom_debuff extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    missChance!: number;
    incomingPhysicalDamage!: number;
    isOriginal!: boolean;
    debufDuration!: number;
    reducesHealthPct!: number;
    targetTeam!: UnitTargetTeam;
    targetType!: UnitTargetType;
    targetFlags!: UnitTargetFlags;
    radius!: number;
    IsRestricted = false;

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

    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.MISS_PERCENTAGE,
            ModifierFunction.INCOMING_PHYSICAL_DAMAGE_PERCENTAGE,
            ModifierFunction.EXTRA_HEALTH_PERCENTAGE
        ];
    }

    CheckState(): Partial<Record<ModifierState, boolean>> {
        return { [ModifierState.COMMAND_RESTRICTED]: this.IsRestricted };
    }

    GetModifierExtraHealthPercentage(): number {
        return this.reducesHealthPct;
    }

    GetModifierMiss_Percentage(): number {
        return this.missChance;
    }

    GetModifierIncomingPhysicalDamage_Percentage(): number {
        return this.incomingPhysicalDamage;
    }

    override OnCreated(kv: SlarkPounceData): void {
        this.OnRefresh();

        if (kv.isOriginal != undefined) {
            this.isOriginal = kv.isOriginal;
        }

        if (!IsServer()) {
            return;
        }
        this.targetTeam = this.ability.GetAbilityTargetTeam();
        this.targetType = this.ability.GetAbilityTargetType();
        this.targetFlags = this.ability.GetAbilityTargetFlags();
    }

    override OnRefresh(): void {
        this.missChance = this.ability.GetSpecialValueFor("miss_chance");
        this.incomingPhysicalDamage = this.ability.GetSpecialValueFor("incoming_physical_damage");
        this.debufDuration = this.ability.GetSpecialValueFor("debuf_duration");
        this.radius = this.ability.GetSpecialValueFor("radius");

        this.reducesHealthPct = -1 * this.ability.GetSpecialValueFor("talent_reduces_health_pct");
    }

    OnDestroy(): void {
        if (!IsServer()) {
            return;
        }

        if (this.isOriginal != undefined) {
            return;
        }

        this.parent.AddNewModifier(this.caster, this.ability, modifier_slark_pounce_custom_debuff.name, {
            duration: this.debufDuration,
            isOriginal: false
        });
    }
}

@registerModifier()
export class modifier_slark_pounce_custom_buff extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    essentialHealthPct!: number;
    buffDuration!: number;
    buffColdown!: number;
    IsTalentProck = false;
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
        return [ModifierFunction.MIN_HEALTH];
    }

    GetMinHealth(): number {
        if (
            this.parent.GetHealth() <= 1 &&
            this.parent.FindModifierByName(modifier_slark_pounce_custom_delayed_death_coldown.name) == undefined
        ) {
            this.IsTalentProck = true;
            this.parent.AddNewModifier(this.caster, this.ability, modifier_slark_pounce_custom_delayed_death_coldown.name, {
                duration: this.buffColdown
            });
            this.SetDuration(this.buffDuration, true);
        }
        return 1;
    }

    override OnCreated(): void {
        this.OnRefresh();
    }

    override OnRefresh(): void {
        this.buffDuration = this.ability.GetSpecialValueFor("talent_buff_duration");
        this.buffColdown = this.ability.GetSpecialValueFor("talent_buff_coldown");
        this.essentialHealthPct = this.ability.GetSpecialValueFor("talent_essential_health_pct");
    }

    OnDestroy(): void {
        if (this.IsTalentProck && this.parent.GetHealthPercent() <= this.essentialHealthPct) {
            this.parent.Kill(this.ability, undefined);
        }
    }
}

@registerModifier()
export class modifier_slark_pounce_custom_delayed_death_coldown extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();

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

    RemoveOnDeath(): boolean {
        return false;
    }
}
