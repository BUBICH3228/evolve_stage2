import { BaseAbility, registerAbility } from "../../../libraries/dota_ts_adapter";
import { BaseModifier, registerModifier } from "../../../libraries/dota_ts_adapter";

@registerAbility()
export class lion_finger_of_death_custom extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC_Hero = this.GetCaster() as CDOTA_BaseNPC_Hero;
    targets: Array<CDOTA_BaseNPC> = [];
    GetIntrinsicModifierName(): string {
        return modifier_lion_finger_of_death_custom_buff.name;
    }

    Precache(context: CScriptPrecacheContext) {
        PrecacheResource(PrecacheType.PARTICLE, "particles/units/heroes/hero_lion/lion_spell_mana_drain.vpcf", context);
    }

    GetAOERadius(): number {
        return this.GetSpecialValueFor("splash_radius_scepter");
    }

    GetBehavior(): AbilityBehavior | Uint64 {
        let behavior = AbilityBehavior.UNIT_TARGET;
        if (this.caster.HasScepter()) {
            behavior = behavior + AbilityBehavior.AOE;
        }
        if (this.caster.HasTalent("talent_lion_finger_of_death_custom_autocast")) {
            behavior = behavior + AbilityBehavior.AUTOCAST;
        }
        return behavior;
    }

    GetCooldown(level: number): number {
        if (this.caster.HasScepter()) {
            return this.GetSpecialValueFor("cooldown_scepter");
        }
        return super.GetCooldown(level);
    }

    override OnSpellStart(): void {
        const target = this.GetCursorTarget()!;
        const point = target.GetAbsOrigin();

        if (target.TriggerSpellAbsorb(this)) {
            return;
        }

        EmitSoundOn("Hero_Lion.FingerOfDeath", this.caster);

        let damage = this.GetSpecialValueFor("damage");
        const damagePerStack = this.GetSpecialValueFor("damage_per_stack");
        const damageDelay = this.GetSpecialValueFor("damage_delay");
        const intToDmgPct = this.GetSpecialValueFor("int_to_dmg_pct") / 100;
        const spellAmp = this.caster.GetSpellAmplification(false) + 1;
        damage =
            (damage + damagePerStack * this.GetIntrinsicModifier()!.GetStackCount()) * spellAmp + this.caster.GetIntellect() * intToDmgPct;

        if (this.caster.HasScepter()) {
            const enemies = FindUnitsInRadius(
                this.caster.GetTeamNumber(),
                point,
                undefined,
                this.GetSpecialValueFor("splash_radius_scepter"),
                this.GetAbilityTargetTeam(),
                this.GetAbilityTargetType(),
                this.GetAbilityTargetFlags(),
                FindOrder.ANY,
                false
            );

            enemies.forEach((target) => {
                this.targets[this.targets.length] = target;
            });
        } else {
            this.targets[this.targets.length] = target;
        }

        this.targets.forEach((target) => {
            target.AddNewModifier(this.caster, this, modifier_lion_finger_of_death_custom_death_grace.name, {
                duration: this.GetSpecialValueFor("grace_period")
            });
            this.PlayEffects(target);
            Timers.CreateTimer(damageDelay, () => {
                ApplyDamage({
                    victim: target,
                    attacker: this.caster,
                    damage: damage,
                    ability: this,
                    damage_type: this.GetAbilityDamageType(),
                    damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION
                });
            });
        });

        this.targets = [];

        if (this.GetAutoCastState()) {
            this.EndCooldown();
            const modifier = this.caster.AddNewModifier(this.caster, this, modifier_lion_finger_of_death_custom_autocast.name, {
                duration: this.GetSpecialValueFor("talent_manacost_increase_stack_duration")
            });
            modifier!.IncrementStackCount();
        }
    }

    PlayEffects(target: CDOTA_BaseNPC): void {
        const direction = this.caster.GetAbsOrigin().Normalized() - target.GetAbsOrigin().Normalized();

        const pfx = ParticleManager.CreateParticle(
            "particles/units/heroes/hero_lion/lion_spell_finger_of_death.vpcf",
            ParticleAttachment.ABSORIGIN,
            this.caster
        );
        ParticleManager.SetParticleControlEnt(
            pfx,
            0,
            this.caster,
            ParticleAttachment.POINT_FOLLOW,
            ParticleAttachmentLocation.ATTACK2,
            Vector(0, 0, 0),
            true
        );
        ParticleManager.SetParticleControlEnt(
            pfx,
            1,
            target,
            ParticleAttachment.POINT_FOLLOW,
            ParticleAttachmentLocation.HITLOC,
            Vector(0, 0, 0),
            true
        );
        ParticleManager.SetParticleControl(pfx, 2, target.GetAbsOrigin());
        ParticleManager.SetParticleControl(pfx, 3, (target.GetAbsOrigin() + direction) as never);
        ParticleManager.SetParticleControlForward(pfx, 3, -direction as Vector);
        ParticleManager.DestroyAndReleaseParticle(pfx);
    }
}

let dataStack = 0;

@registerModifier()
export class modifier_lion_finger_of_death_custom_death_grace extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    stackPerBossKill!: number;
    stackPerCreepKill!: number;

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
        return [ModifierFunction.ON_DEATH];
    }

    GetAttributes(): ModifierAttribute {
        return ModifierAttribute.MULTIPLE;
    }

    override OnCreated(): void {
        this.OnRefresh();
    }

    OnRefresh(): void {
        this.stackPerBossKill = this.ability.GetSpecialValueFor("stacks_per_boss");
        this.stackPerCreepKill = this.ability.GetSpecialValueFor("stacks_per_creep");
    }

    OnDeath(kv: ModifierInstanceEvent): void {
        if (this.parent != kv.unit) {
            return;
        }
        if (kv.unit.IsBoss()) {
            this.AddStack(this.stackPerBossKill);
        } else {
            this.AddStack(this.stackPerCreepKill);
        }
    }

    AddStack(stacks: number): void {
        dataStack = dataStack + stacks;

        if (dataStack >= 1) {
            const stack = math.floor(dataStack);
            const curentStack = this.ability.GetIntrinsicModifier()!.GetStackCount();
            this.ability.GetIntrinsicModifier()!.SetStackCount(curentStack + stack);
            dataStack = dataStack - stack;
        }
    }
}

@registerModifier()
export class modifier_lion_finger_of_death_custom_buff extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC_Hero = this.GetCaster()! as CDOTA_BaseNPC_Hero;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    heals!: number;
    damagePerStack!: number;

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

    override RemoveOnDeath(): boolean {
        return false;
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.HEALTH_BONUS, ModifierFunction.TOOLTIP];
    }

    OnTooltip(): number {
        return this.damagePerStack * this.GetStackCount();
    }

    GetModifierHealthBonus(): number {
        return this.heals * this.GetStackCount();
    }

    override OnCreated(): void {
        this.OnRefresh();
    }

    OnRefresh(): void {
        this.heals = this.ability.GetSpecialValueFor("talent_hp_per_stack");
        this.damagePerStack = this.ability.GetSpecialValueFor("damage_per_stack");
    }

    OnStackCountChanged(): void {
        if (!IsServer()) {
            return;
        }
        this.OnRefresh();
        this.caster.CalculateStatBonus(true);
    }
}

@registerModifier()
export class modifier_lion_finger_of_death_custom_autocast extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    talentManacostIncreasePerStackPct!: number;

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
        return [ModifierFunction.MANACOST_PERCENTAGE, ModifierFunction.TOOLTIP];
    }

    OnTooltip(): number {
        return this.talentManacostIncreasePerStackPct * this.GetStackCount();
    }

    GetModifierPercentageManacost(kv: ModifierAbilityEvent): number {
        if (this.ability != kv.ability) {
            return 1;
        }
        return this.talentManacostIncreasePerStackPct * this.GetStackCount() * -1;
    }

    override OnCreated(): void {
        this.OnRefresh();
    }

    OnRefresh(): void {
        this.talentManacostIncreasePerStackPct = this.ability.GetSpecialValueFor("talent_manacost_increase_per_stack_pct");
    }
}
