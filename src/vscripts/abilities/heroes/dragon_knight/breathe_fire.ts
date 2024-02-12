import { BaseAbility, BaseModifier, registerAbility, registerModifier } from "../../../libraries/dota_ts_adapter";

@registerAbility()
export class dragon_knight_breathe_fire_custom extends BaseAbility {
    public pathToDragonBreatheParticle = "particles/units/heroes/hero_dragon_knight/dragon_knight_breathe_fire.vpcf";

    private caster: CDOTA_BaseNPC_Hero = this.GetCaster() as CDOTA_BaseNPC_Hero;
    private damageTable: ApplyDamageOptions = {
        victim: this.caster,
        attacker: this.caster,
        damage: 0,
        ability: this,
        damage_type: this.GetAbilityDamageType == undefined ? DamageTypes.NONE : this.GetAbilityDamageType(),
        damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION
    };

    override Precache(context: CScriptPrecacheContext): void {
        PrecacheResource(
            PrecacheType.PARTICLE,
            ParticleManager.GetParticleReplacement(this.pathToDragonBreatheParticle, this.caster),
            context
        );
    }

    override OnAbilityUpgrade(upgradeAbility: CDOTABaseAbility): void {
        if (upgradeAbility.GetAbilityName() != "talent_dragon_knight_elder_dragon_form_fire_breath_on_attack") {
            return;
        }

        this.caster.AddNewModifierSafe(this.caster, this, modifier_dragon_knight_breathe_fire_custom_handler.name, { duration: -1 });
    }

    override OnSpellStart(targetPosition?: Vector) {
        const target = this.GetCursorTarget();
        let point = this.GetCursorPosition();

        if (target != undefined) {
            point = target.GetAbsOrigin();
        }
        if (targetPosition != undefined) {
            point = targetPosition;
        }

        this.Fire(point);

        if (!this.caster.HasTalent("talent_dragon_knight_breathe_fire_multicast")) {
            return;
        }

        const multicasts = this.GetSpecialValueFor("talent_dragon_knight_breathe_fire_multicasts");
        const multicastsDelay = this.GetSpecialValueFor("talent_dragon_knight_breathe_fire_multicasts_delay");
        for (let i = 1; i <= multicasts; i++) {
            Timers.CreateTimer(
                i * multicastsDelay,
                () => {
                    const multicastTargetPoint = (this.caster.GetAbsOrigin() + this.caster.GetForwardVector() * 5) as Vector;
                    this.Fire(multicastTargetPoint);
                },
                this
            );
        }
    }

    private Fire(targetPoint: Vector) {
        const casterPosition = this.caster.GetAbsOrigin();

        ProjectileManager.CreateLinearProjectile(<CreateLinearProjectileOptions>{
            Source: this.caster,
            Ability: this,
            vSpawnOrigin: casterPosition,
            bDeleteOnHit: false,
            iUnitTargetTeam: this.GetAbilityTargetTeam(),
            iUnitTargetType: this.GetAbilityTargetType(),
            iUnitTargetFlags: this.GetAbilityTargetFlags(),
            EffectName: ParticleManager.GetParticleReplacement(this.pathToDragonBreatheParticle, this.caster),
            fDistance: this.GetSpecialValueFor("range"),
            fStartRadius: this.GetSpecialValueFor("start_radius"),
            fEndRadius: this.GetSpecialValueFor("end_radius"),
            fProjectileSpeed: this.GetSpecialValueFor("speed"),
            fExpireTime: GameRules.GetGameTime() + 10,
            vVelocity: (((targetPoint - casterPosition) as Vector).Normalized() * this.GetSpecialValueFor("speed")) as Vector
        });

        EmitSoundOn("Hero_DragonKnight.BreathFire", this.caster);
    }

    public DealDamage(target: CDOTA_BaseNPC, damage: number) {
        this.damageTable.victim = target;
        this.damageTable.damage = damage;
        ApplyDamage(this.damageTable);
    }

    override OnProjectileHit(target: CDOTA_BaseNPC | undefined): boolean | void {
        if (target == undefined) {
            return;
        }

        let damage = this.GetSpecialValueFor("damage");
        damage = damage * (this.caster.GetSpellAmplification(false) + 1);
        damage = damage + (this.caster.GetStrength() / 100) * this.GetSpecialValueFor("str_to_damage_pct");

        this.DealDamage(target, damage);

        target.AddNewModifier(this.caster, this, modifier_dragon_knight_breathe_fire_custom_debuff.name, {
            duration: this.GetSpecialValueFor("ignite_duration")
        });
    }
}

@registerModifier()
export class modifier_dragon_knight_breathe_fire_custom_debuff extends BaseModifier {
    // Modifier properties
    private ability: dragon_knight_breathe_fire_custom = this.GetAbility()! as dragon_knight_breathe_fire_custom;
    private damage_reduction_pct!: number;

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

    override GetModifierDamageOutgoing_Percentage() {
        return this.damage_reduction_pct;
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.DAMAGEOUTGOING_PERCENTAGE];
    }

    override OnCreated(): void {
        this.OnRefresh();
    }

    override OnRefresh(): void {
        this.damage_reduction_pct = -this.ability.GetSpecialValueFor("damage_reduction_pct");
    }
}

@registerModifier()
export class modifier_dragon_knight_breathe_fire_custom_handler extends BaseModifier {
    private ability: dragon_knight_breathe_fire_custom = this.GetAbility()! as dragon_knight_breathe_fire_custom;
    private parent: CDOTA_BaseNPC = this.GetParent();
    private isCooldown = false;

    breathFireCooldown!: number;
    procChance!: number;

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

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.ON_ATTACK_LANDED];
    }

    override OnCreated(): void {
        this.OnRefresh();
    }

    override OnRefresh(): void {
        this.breathFireCooldown = this.ability.GetSpecialValueFor("talent_breathe_fire_cooldown");
        this.procChance = this.ability.GetSpecialValueFor("talent_breathe_fire_proc_chance");
    }

    override OnIntervalThink(): void {
        this.StartIntervalThink(-1);
        this.SetIsCooldown(false);
    }

    IsCooldown() {
        return this.isCooldown;
    }

    SetIsCooldown(state: boolean) {
        this.isCooldown = state;
    }

    override OnAttackLanded(event: ModifierAttackEvent): void {
        if (event.attacker != this.parent || this.IsCooldown()) {
            return;
        }

        if (!RollPseudoRandomPercentage(this.procChance, this)) {
            return;
        }

        if (this.ability.GetLevel() == 0) {
            return;
        }

        this.ability.OnSpellStart(event.target.GetAbsOrigin());
        this.SetIsCooldown(true);
        this.StartIntervalThink(this.breathFireCooldown);
    }
}
