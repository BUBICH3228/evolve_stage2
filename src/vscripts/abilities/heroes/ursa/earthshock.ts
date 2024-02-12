import { BaseAbility, registerAbility } from "../../../libraries/dota_ts_adapter";
import { BaseModifier, registerModifier } from "../../../libraries/dota_ts_adapter";
import { modifier_invulnerable_custom } from "../../../modifiers/modifier_invulnerable_custom";

@registerAbility()
export class ursa_earthshock_custom extends BaseAbility {
    // Ability properties
    caster: CDOTA_BaseNPC = this.GetCaster();

    Precache(context: CScriptPrecacheContext) {
        PrecacheResource(PrecacheType.PARTICLE, "particles/units/heroes/hero_ursa/ursa_earthshock.vpcf", context);
    }

    OnSpellStart(isMulticastProc = false): void {
        if (!IsServer()) {
            return;
        }

        const shockRadius = this.GetSpecialValueFor("shock_radius");
        const hopDistance = this.GetSpecialValueFor("hop_distance");
        const hopSpeed = this.GetSpecialValueFor("hop_speed");
        const hopHeight = this.GetSpecialValueFor("hop_height");

        this.caster.AddNewModifier(this.caster, this, "modifier_generic_arc", {
            distance: hopDistance,
            speed: hopSpeed,
            height: hopHeight,
            fix_end: false,
            isForward: true
        });

        Timers.CreateTimer(hopDistance / hopSpeed, () => {
            const enemies = FindUnitsInRadius(
                this.caster.GetTeamNumber(),
                this.caster.GetAbsOrigin(),
                undefined,
                shockRadius,
                this.GetAbilityTargetTeam(),
                this.GetAbilityTargetType(),
                this.GetAbilityTargetFlags(),
                FindOrder.ANY,
                false
            );

            for (const enemy of enemies) {
                ApplyDamage({
                    attacker: this.caster,
                    damage: this.GetAbilityDamage(),
                    damage_type: this.GetAbilityDamageType(),
                    ability: this,
                    damage_flags: DamageFlag.NONE,
                    victim: enemy
                });
                enemy.AddNewModifier(this.caster, this, modifier_ursa_earthshock_custom.name, { duration: this.GetDuration() });
            }

            const particle_earthshock = "particles/units/heroes/hero_ursa/ursa_earthshock.vpcf";
            const particle_earthshock_fx = ParticleManager.CreateParticle(particle_earthshock, ParticleAttachment.WORLDORIGIN, this.caster);
            ParticleManager.SetParticleControl(particle_earthshock_fx, 0, this.GetCaster().GetAbsOrigin());
            ParticleManager.SetParticleControlForward(particle_earthshock_fx, 0, this.GetCaster().GetForwardVector());
            ParticleManager.SetParticleControl(particle_earthshock_fx, 1, Vector(shockRadius / 2, shockRadius / 2, shockRadius / 2));
            ParticleManager.DestroyAndReleaseParticle(particle_earthshock_fx);

            if (
                this.caster.HasTalent("talent_ursa_earthshock_assistants") &&
                !this.caster.HasModifier(modifier_ursa_earthshock_custom_assistants.name)
            ) {
                this.caster.AddNewModifier(this.caster, this, modifier_ursa_earthshock_custom_assistants.name, {
                    duration: this.GetSpecialValueFor("talent_cooldown_assistants")
                });
            }

            EmitSoundOn("Hero_Ursa.Earthshock", this.caster);
        });

        if (this.caster.HasTalent("talent_ursa_earthshock_multicast") && !isMulticastProc) {
            const delay = this.GetSpecialValueFor("talent_multicast_delay");
            for (let i = 1; i <= this.GetSpecialValueFor("talent_multicast_count"); i++) {
                Timers.CreateTimer(i * delay, () => {
                    this.OnSpellStart(true);
                });
            }
        }
    }
}

@registerModifier()
export class modifier_ursa_earthshock_custom extends BaseModifier {
    // Modifier properties
    caster: CDOTA_BaseNPC = this.GetCaster()!;
    ability: CDOTABaseAbility = this.GetAbility()!;
    parent: CDOTA_BaseNPC = this.GetParent();
    moveSpeedSlowPct!: number;

    // Modifier specials

    IsHidden() {
        return false;
    }
    IsDebuff() {
        return true;
    }
    IsPurgable() {
        return true;
    }
    IsPurgeException() {
        return true;
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.MOVESPEED_BONUS_PERCENTAGE];
    }

    GetModifierMoveSpeedBonus_Percentage(): number {
        return this.moveSpeedSlowPct;
    }

    OnCreated(): void {
        this.OnRefresh();
    }

    OnRefresh(): void {
        this.moveSpeedSlowPct = -1 * this.ability.GetSpecialValueFor("movement_slow");
    }
}
@registerModifier()
export class modifier_ursa_earthshock_custom_assistants extends BaseModifier {
    // Modifier properties
    caster: CDOTA_BaseNPC = this.GetCaster()!;
    ability: CDOTABaseAbility = this.GetAbility()!;
    parent: CDOTA_BaseNPC = this.GetParent();

    // Modifier specials

    IsHidden() {
        return false;
    }
    IsDebuff() {
        return true;
    }
    IsPurgable() {
        return false;
    }
    IsPurgeException() {
        return false;
    }

    OnCreated(): void {
        if (!IsServer()) {
            return;
        }
        for (let index = 1; index <= this.ability.GetSpecialValueFor("talent_count_assistants"); index++) {
            const point = (this.caster.GetAbsOrigin() + RandomVector(150)) as Vector;
            const unit = CreateUnitByName(
                "npc_talent_ursa_earthshock_assistant",
                point,
                true,
                this.caster,
                this.caster,
                this.caster.GetTeamNumber()
            );
            unit.AddNewModifier(this.caster, this.ability, modifier_ursa_earthshock_custom_life_duration.name, {
                duration: this.ability.GetSpecialValueFor("talent_duration_assistant")
            });
            const ability = unit.AddAbility("ursa_fury_swipes_custom");
            if (ability != undefined) {
                ability.SetLevel(this.ability.GetLevel());
            }
        }
    }
}

@registerModifier()
export class modifier_ursa_earthshock_custom_life_duration extends BaseModifier {
    // Modifier properties
    caster: CDOTA_BaseNPC = this.GetCaster()!;
    ability: CDOTABaseAbility = this.GetAbility()!;
    parent: CDOTA_BaseNPC = this.GetParent();

    // Modifier specials

    IsHidden() {
        return false;
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

    OnCreated(): void {
        if (!IsServer()) {
            return;
        }
        this.parent.AddNewModifier(this.parent, this.ability, modifier_invulnerable_custom.name, { duration: -1 });
    }

    OnDestroy(): void {
        if (!IsServer()) {
            return;
        }
        this.parent.ForceKill(false);
    }
}
