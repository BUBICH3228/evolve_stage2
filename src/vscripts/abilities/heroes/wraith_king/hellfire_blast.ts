import { BaseAbility, registerAbility } from "../../../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../../../libraries/dota_ts_adapter";
import { modifier_stunned } from "../../../modifiers/modifier_stunned";

@registerAbility()
export class wraith_king_hellfire_blast_custom extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();
    targets: CDOTA_BaseNPC[] = [];

    GetBehavior(): AbilityBehavior | Uint64 {
        if (this.caster.HasTalent("talent_wraith_king_hellfire_blast_custom_aoe")) {
            return AbilityBehavior.UNIT_TARGET + AbilityBehavior.AOE;
        }
        return super.GetBehavior();
    }

    GetAOERadius(): number {
        return this.GetSpecialValueFor("talent_radius");
    }

    override OnSpellStart(): void {
        const target = this.GetCursorTarget();

        if (target == undefined) {
            return;
        }

        if (target.TriggerSpellAbsorb(this)) {
            return;
        }

        if (this.caster.HasTalent("talent_wraith_king_hellfire_blast_custom_aoe")) {
            this.targets = FindUnitsInRadius(
                this.caster.GetTeamNumber(),
                target.GetAbsOrigin(),
                undefined,
                this.GetSpecialValueFor("talent_radius"),
                this.GetAbilityTargetTeam(),
                this.GetAbilityTargetType(),
                this.GetAbilityTargetFlags(),
                FindOrder.ANY,
                false
            );
        } else {
            this.targets.push(target);
        }

        this.targets.forEach((target) => {
            ProjectileManager.CreateTrackingProjectile({
                EffectName: "particles/units/heroes/hero_skeletonking/skeletonking_hellfireblast.vpcf",
                Ability: this,
                iMoveSpeed: this.GetSpecialValueFor("blast_speed"),
                Source: this.caster,
                Target: target,
                iSourceAttachment: ProjectileAttachment.ATTACK_2
            });
        });

        EmitSoundOn("Hero_SkeletonKing.Hellfire_Blast", this.caster);

        this.targets = [];
    }

    override OnProjectileHit(target: CDOTA_BaseNPC | undefined): boolean | void {
        if (target != undefined) {
            const stunDuration = this.GetSpecialValueFor("blast_stun_duration");
            let damage = this.GetSpecialValueFor("damage");
            const dotDuration = this.GetSpecialValueFor("blast_dot_duration");

            damage *= this.caster.GetSpellAmplification(false) + 1;

            ApplyDamage({
                victim: target,
                attacker: this.caster,
                damage: damage,
                damage_type: this.GetAbilityDamageType(),
                ability: this
            });

            target.AddNewModifier(this.caster, this, modifier_stunned.name, { duration: stunDuration });

            target.AddNewModifier(this.caster, this, modifier_wraith_king_hellfire_blast_custom.name, { duration: dotDuration });

            EmitSoundOn("Hero_SkeletonKing.Hellfire_BlastImpact", target);
        }

        return true;
    }
}

@registerModifier()
export class modifier_wraith_king_hellfire_blast_custom extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    damage!: number;
    damgeTable!: {
        victim: CDOTA_BaseNPC;
        attacker: CDOTA_BaseNPC;
        damage: number;
        ability: CDOTABaseAbility;
        damage_type: DamageTypes;
        damage_flags: DamageFlag;
    };
    slow!: number;
    isTalentExplosionProc = false;
    targetTeam!: UnitTargetTeam;
    targetType!: UnitTargetType;
    targetFlags!: UnitTargetFlags;
    talentRadiusExplosion!: number;
    talentDamagePerMaxHealth!: number;
    talentDelay!: number;

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
        return true;
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.MOVESPEED_BONUS_PERCENTAGE];
    }

    GetModifierMoveSpeedBonus_Percentage(): number {
        return this.slow;
    }

    GetEffectName(): string {
        return "particles/units/heroes/hero_skeletonking/skeletonking_hellfireblast_debuff.vpcf";
    }

    GetEffectAttachType(): ParticleAttachment {
        return ParticleAttachment.ABSORIGIN_FOLLOW;
    }

    GetAttributes(): ModifierAttribute {
        return ModifierAttribute.MULTIPLE;
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
        this.damage = this.ability.GetSpecialValueFor("blast_dot_damage");
        this.slow = -1 * this.ability.GetSpecialValueFor("blast_slow");

        this.talentRadiusExplosion = this.ability.GetSpecialValueFor("talent_radius_explosion");
        this.talentDamagePerMaxHealth = this.ability.GetSpecialValueFor("talent_damage_per_max_health") / 100;
        this.talentDelay = this.ability.GetSpecialValueFor("talent_delay");

        if (!IsServer()) {
            return;
        }

        this.damgeTable = {
            victim: this.parent,
            attacker: this.caster,
            damage: 0,
            ability: this.ability,
            damage_type: this.ability.GetAbilityDamageType(),
            damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION
        };

        this.StartIntervalThink(1);
    }

    OnIntervalThink(): void {
        const damage = this.damage * (this.caster.GetSpellAmplification(false) + 1);

        this.damgeTable.damage = damage;

        ApplyDamage(this.damgeTable);

        if (!this.caster.HasTalent("talent_wraith_king_hellfire_blast_custom_explosion")) {
            return;
        }

        if (this.isTalentExplosionProc) {
            return;
        }

        this.isTalentExplosionProc = true;

        Timers.CreateTimer(this.talentDelay, () => {
            const enemies = FindUnitsInRadius(
                this.caster.GetTeamNumber(),
                this.parent.GetAbsOrigin(),
                undefined,
                this.talentRadiusExplosion,
                this.targetTeam,
                this.targetType,
                this.targetFlags,
                FindOrder.ANY,
                false
            );

            const pfx = ParticleManager.CreateParticle(
                "particles/units/heroes/hero_techies/techies_blast_off.vpcf",
                ParticleAttachment.WORLDORIGIN,
                this.parent
            );
            ParticleManager.SetParticleControl(pfx, 0, this.parent.GetAbsOrigin());
            ParticleManager.DestroyAndReleaseParticle(pfx);

            const damage = this.talentDamagePerMaxHealth * this.parent.GetMaxHealth();

            enemies.forEach((target) => {
                if (target.GetHealth() > damage) {
                    target.SetHealth(this.parent.GetHealth() - damage);
                } else {
                    target.Kill(this.ability, this.caster);
                }
            });
        });
    }
}

@registerModifier()
export class modifier_hellfire_blast_illusion_custom extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    outgoingDamage!: number;

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

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.MOVESPEED_ABSOLUTE, ModifierFunction.DAMAGEOUTGOING_PERCENTAGE];
    }

    GetModifierMoveSpeed_Absolute(): number {
        return 1000;
    }

    GetModifierDamageOutgoing_Percentage(): number {
        return this.outgoingDamage;
    }

    CheckState(): Partial<Record<ModifierState, boolean>> {
        return {
            [ModifierState.INVULNERABLE]: true,
            [ModifierState.NO_UNIT_COLLISION]: true,
            [ModifierState.NO_HEALTH_BAR]: true,
            [ModifierState.FLYING_FOR_PATHING_PURPOSES_ONLY]: true,
            [ModifierState.NOT_ON_MINIMAP]: true
        };
    }

    GetEffectName(): string {
        return "particles/status_fx/status_effect_terrorblade_reflection.vpcf";
    }

    OnCreated(): void {
        this.outgoingDamage = this.ability.GetSpecialValueFor("talent_illusion_outgoing_damage");
        if (!IsServer()) {
            return;
        }
        this.parent.MoveToTargetToAttack(this.caster);
    }

    OnDestroy(): void {
        if (!IsServer()) {
            return;
        }
        this.parent.ForceKill(false);
    }
}
