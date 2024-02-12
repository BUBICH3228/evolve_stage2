import { BaseAbility, BaseModifier, registerAbility } from "../../../libraries/dota_ts_adapter";
import { BaseModifierMotionHorizontal, registerModifier } from "../../../libraries/dota_ts_adapter";

@registerAbility()
export class pudge_meat_hook_custom extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC_Hero = this.GetCaster() as CDOTA_BaseNPC_Hero;

    bChainAttached!: boolean;
    hVictim: Array<CDOTA_BaseNPC> = [];
    hookSpeed!: number;
    hookWidth!: number;
    hookDistance!: number;
    vStartPosition!: Vector;
    vProjectileLocation!: Vector;
    vTargetPosition!: Vector;
    vHookOffset!: Vector;
    effectCast!: ParticleID;
    bRetracting!: boolean;
    bDiedInHook!: boolean;

    OnAbilityPhaseStart(): boolean {
        this.caster.StartGesture(GameActivity.DOTA_OVERRIDE_ABILITY_1);
        return true;
    }

    OnAbilityPhaseInterrupted(): void {
        this.caster.RemoveGesture(GameActivity.DOTA_OVERRIDE_ABILITY_1);
    }

    GetCastRange(): number {
        return this.GetSpecialValueFor("hook_distance");
    }

    override OnSpellStart(): void {
        this.bChainAttached = false;
        this.hVictim = [];
        this.hookSpeed = this.GetSpecialValueFor("hook_speed");
        this.hookWidth = this.GetSpecialValueFor("hook_width");
        this.hookDistance = this.GetCastRange();

        this.vStartPosition = this.caster.GetAbsOrigin();
        this.vProjectileLocation = this.vStartPosition;

        let vDirection = (this.GetCursorPosition() - this.vStartPosition) as Vector;
        vDirection.z = 0.0;

        vDirection = (vDirection.Normalized() * this.hookDistance) as Vector;
        this.vTargetPosition = (this.vStartPosition + vDirection) as Vector;

        this.vHookOffset = Vector(0, 0, 96);
        const vHookTarget = (this.vTargetPosition + this.vHookOffset) as Vector;
        const vKillswitch = Vector((this.hookDistance / this.hookSpeed) * 2, 0, 0);

        this.effectCast = ParticleManager.CreateParticle(
            "particles/units/heroes/hero_pudge/pudge_meathook.vpcf",
            ParticleAttachment.CUSTOMORIGIN,
            this.caster
        );
        ParticleManager.SetParticleControlEnt(
            this.effectCast,
            0,
            this.caster,
            ParticleAttachment.POINT_FOLLOW,
            ParticleAttachmentLocation.ATTACK1,
            Vector(0, 0, 0),
            true
        );
        ParticleManager.SetParticleControl(this.effectCast, 1, vHookTarget);
        ParticleManager.SetParticleControl(this.effectCast, 2, Vector(this.hookSpeed, this.hookDistance, this.hookWidth));
        ParticleManager.SetParticleControl(this.effectCast, 3, vKillswitch);
        ParticleManager.SetParticleControl(this.effectCast, 4, Vector(1, 0, 0));
        ParticleManager.SetParticleControl(this.effectCast, 5, Vector(0, 0, 0));
        ParticleManager.SetParticleControlEnt(
            this.effectCast,
            7,
            this.caster,
            ParticleAttachment.CUSTOMORIGIN,
            ParticleAttachmentLocation.HITLOC,
            Vector(0, 0, 0),
            true
        );

        EmitSoundOn("Hero_Pudge.AttackHookExtend", this.caster);

        ProjectileManager.CreateLinearProjectile({
            Source: this.caster,
            Ability: this,
            vSpawnOrigin: this.vStartPosition,
            iUnitTargetTeam: this.GetAbilityTargetTeam(),
            iUnitTargetType: this.GetAbilityTargetType(),
            iUnitTargetFlags: this.GetAbilityTargetFlags(),
            fDistance: this.hookDistance,
            fStartRadius: this.hookWidth,
            fEndRadius: this.hookWidth,
            fProjectileSpeed: this.hookSpeed,
            vVelocity: (vDirection.Normalized() * this.hookSpeed) as Vector,
            fExpireTime: GameRules.GetGameTime() + 10
        });

        this.bRetracting = false;
        this.bDiedInHook = false;
        this.caster.AddNewModifier(this.caster, this, modifier_pudge_meat_hook_followthrough_custom.name, { duration: -1 });
    }

    OnProjectileHit(target: CDOTA_BaseNPC | undefined, location: Vector): boolean | void {
        if (this.caster == target) {
            return false;
        }

        if (this.bRetracting == false) {
            let bTargetPulled = false;
            if (target != undefined) {
                EmitSoundOn("Hero_Pudge.AttackHookImpact", target);
                target.AddNewModifier(this.caster, this, modifier_pudge_meat_hook_custom.name, undefined);
                if (target.GetTeamNumber() != this.caster.GetTeamNumber()) {
                    let damage = this.GetSpecialValueFor("damage") * (this.caster.GetSpellAmplification(false) + 1);
                    damage += (this.caster.GetStrength() * this.GetSpecialValueFor("damge_per_strengt")) / 100;
                    if (
                        !target.IsBoss() &&
                        !target.IsRealHero() &&
                        this.caster.GetLevel() - target.GetLevel() >= this.GetSpecialValueFor("max_level_gap")
                    ) {
                        target.Kill(this, this.caster);
                    } else {
                        ApplyDamage({
                            victim: target,
                            attacker: this.caster,
                            ability: this,
                            damage: damage,
                            damage_type: this.GetAbilityDamageType(),
                            damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION
                        });
                    }

                    if (!target.IsAlive) {
                        this.bDiedInHook = true;
                    }

                    if (!target.IsMagicImmune()) {
                        target.Interrupt();
                    }

                    const nFXIndex = ParticleManager.CreateParticle(
                        "particles/units/heroes/hero_pudge/pudge_meathook_impact.vpcf",
                        ParticleAttachment.CUSTOMORIGIN,
                        target
                    );
                    ParticleManager.SetParticleControlEnt(
                        nFXIndex,
                        0,
                        target,
                        ParticleAttachment.POINT_FOLLOW,
                        ParticleAttachmentLocation.HITLOC,
                        this.caster.GetAbsOrigin(),
                        true
                    );
                    ParticleManager.DestroyAndReleaseParticle(nFXIndex);
                }
                AddFOWViewer(
                    this.caster.GetTeamNumber(),
                    target.GetAbsOrigin(),
                    this.GetSpecialValueFor("vision_radius"),
                    this.GetSpecialValueFor("vision_duration"),
                    false
                );

                this.hVictim.push(target);
                bTargetPulled = true;
            }

            let vHookPos = this.vTargetPosition;
            let flPad = this.caster.GetPaddedCollisionRadius();

            if (target != undefined) {
                vHookPos = target.GetAbsOrigin();
                flPad += this.caster.GetPaddedCollisionRadius();
            }

            let vVelocity = (this.vStartPosition - vHookPos) as Vector;
            vVelocity.z = 0.0;

            const flDistance = vVelocity.Length2D() - flPad;
            vVelocity = (vVelocity.Normalized() * this.hookSpeed) as Vector;
            const position = (this.vStartPosition - this.vProjectileLocation) as Vector;
            if (!(this.caster.HasTalent("talent_pudge_meat_hook_custom_pierce") && position.Length2D() < this.hookDistance - 10)) {
                ProjectileManager.CreateLinearProjectile({
                    Source: this.caster,
                    Ability: this,
                    vSpawnOrigin: vHookPos,
                    fDistance: flDistance,
                    fStartRadius: undefined,
                    fEndRadius: undefined,
                    fProjectileSpeed: 0,
                    vVelocity: vVelocity,
                    fExpireTime: GameRules.GetGameTime() + 10
                });

                this.vProjectileLocation = vHookPos;

                if (target != undefined && !target.IsInvisible() && bTargetPulled) {
                    ParticleManager.SetParticleControlEnt(
                        this.effectCast,
                        1,
                        target,
                        ParticleAttachment.POINT_FOLLOW,
                        ParticleAttachmentLocation.HITLOC,
                        (target.GetAbsOrigin() + this.vHookOffset) as Vector,
                        true
                    );
                    ParticleManager.SetParticleControl(this.effectCast, 4, Vector(0, 0, 0));
                    ParticleManager.SetParticleControl(this.effectCast, 5, Vector(1, 0, 0));
                } else {
                    ParticleManager.SetParticleControlEnt(
                        this.effectCast,
                        1,
                        this.caster,
                        ParticleAttachment.POINT_FOLLOW,
                        ParticleAttachmentLocation.SWORD_END,
                        (this.caster.GetAbsOrigin() + this.vHookOffset) as Vector,
                        true
                    );
                }
                if (target != undefined) {
                    EmitSoundOn("Hero_Pudge.AttackHookRetract", target);
                }

                if (this.caster.IsAlive()) {
                    this.caster.RemoveGesture(GameActivity.DOTA_OVERRIDE_ABILITY_1);
                    this.caster.StartGesture(GameActivity.DOTA_CHANNEL_ABILITY_1);
                }

                this.bRetracting = true;
            }
        } else {
            if (this.hVictim.length != 0) {
                const vFinalHookPos = location;
                this.hVictim.forEach((target) => {
                    target.RemoveModifierByName(modifier_pudge_meat_hook_custom.name);
                    const vVictimPosCheck = (target.GetAbsOrigin() - vFinalHookPos) as Vector;
                    const flPad = this.caster.GetPaddedCollisionRadius() + target.GetPaddedCollisionRadius();
                    if (vVictimPosCheck.Length2D() > flPad) {
                        FindClearSpaceForUnit(target, this.vStartPosition, false);
                    }
                });
            }
            ParticleManager.DestroyAndReleaseParticle(this.effectCast);
            EmitSoundOn("Hero_Pudge.AttackHookRetractStop", this.caster);
            this.caster.RemoveModifierByName(modifier_pudge_meat_hook_followthrough_custom.name);
        }

        const position = (this.vStartPosition - this.vProjectileLocation) as Vector;
        if (this.caster.HasTalent("talent_pudge_meat_hook_custom_pierce") && position.Length2D() < this.hookDistance) {
            return false;
        } else {
            return true;
        }
    }

    OnProjectileThink(location: Vector): void {
        this.vProjectileLocation = location;

        if (!IsServer()) {
            return;
        }
        if (this.hVictim != undefined) {
            this.hVictim.forEach((target) => {
                target.SetOrigin(this.vProjectileLocation);
                const vToCaster = (this.vStartPosition - this.caster.GetAbsOrigin()) as Vector;
                const flDist = vToCaster.Length2D();
                if (this.bChainAttached == false && flDist > 128.0) {
                    this.bChainAttached = true;
                    ParticleManager.SetParticleControlEnt(
                        this.effectCast,
                        0,
                        this.caster,
                        ParticleAttachment.CUSTOMORIGIN,
                        ParticleAttachmentLocation.HITLOC,
                        this.caster.GetAbsOrigin(),
                        true
                    );
                    ParticleManager.SetParticleControl(this.effectCast, 0, (this.vStartPosition + this.vHookOffset) as Vector);
                }
            });
        }
    }

    OnOwnerDied(): void {
        this.caster.RemoveGesture(GameActivity.DOTA_OVERRIDE_ABILITY_1);
        this.caster.RemoveGesture(GameActivity.DOTA_CHANNEL_ABILITY_1);
    }
}

@registerModifier()
export class modifier_pudge_meat_hook_custom extends BaseModifierMotionHorizontal {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: pudge_meat_hook_custom = this.GetAbility()! as pudge_meat_hook_custom;
    private parent: CDOTA_BaseNPC_Hero = this.GetParent() as CDOTA_BaseNPC_Hero;
    tickInterval!: number;
    damgeTable!: ApplyDamageOptions;
    damgeDistance!: number;
    hookDistance!: number;
    distanceInterval!: number;

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

    override IsStunDebuff(): boolean {
        return true;
    }

    CheckState(): Partial<Record<ModifierState, boolean>> {
        return {
            [ModifierState.STUNNED]: true,
            [ModifierState.NO_UNIT_COLLISION]: true
        };
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.OVERRIDE_ANIMATION];
    }

    GetOverrideAnimation(): GameActivity {
        return GameActivity.DOTA_FLAIL;
    }

    override OnCreated(): void {
        this.OnRefresh();
    }

    OnRefresh(): void {
        this.damgeDistance = this.ability.GetSpecialValueFor("talent_damage_distance") / 100;
        this.hookDistance = this.ability.GetCastRange();
        this.tickInterval = this.ability.GetSpecialValueFor("talent_tick_interval");
        this.distanceInterval = this.ability.GetSpecialValueFor("talent_distance_interval");
        if (!IsServer()) {
            return;
        }
        this.damgeTable = {
            victim: this.parent,
            attacker: this.caster,
            damage: this.parent.GetMaxHealth() * (this.damgeDistance * (this.hookDistance / this.distanceInterval)) * this.tickInterval,
            ability: this.ability,
            damage_type: this.ability.GetAbilityDamageType(),
            damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION
        };
        if (this.caster.HasTalent("talent_pudge_meat_hook_custom_rupture") && this.parent.GetTeamNumber() != this.caster.GetTeamNumber()) {
            this.StartIntervalThink(this.tickInterval);
        }
    }

    OnIntervalThink(): void {
        ApplyDamage(this.damgeTable);
    }
}

@registerModifier()
export class modifier_pudge_meat_hook_followthrough_custom extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();

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

    CheckState(): Partial<Record<ModifierState, boolean>> {
        return {
            [ModifierState.COMMAND_RESTRICTED]: true
        };
    }

    override OnCreated(): void {
        // Modifier specials
    }
}
