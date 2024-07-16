import { BaseAbility, registerAbility } from "../../../../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../../../../libraries/dota_ts_adapter";
import { Utility } from "../../../../libraries/utility";

@registerAbility()
export class goliath_base_attack extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();
    private v = Vector(0, 0, 0);
    Precache(context: CScriptPrecacheContext): void {
        PrecacheResource(PrecacheType.PARTICLE, "particles/custom/units/heroes/hunters/planet_shild.vpcf", context);
    }

    Spawn(): void {
        if (!IsServer()) {
            return;
        }

        this.SetLevel(this.caster.GetLevel());
        this.UpdateDamageAndAttackSpeed();

        //Timers.CreateTimer(0, () => {
        //    this.v = this.caster.GetAbsOrigin();
        //    CreateModifierThinker(
        //        this.caster,
        //        this,
        //        modifierThinker_test.name,
        //        { duration: 50 },
        //        this.v,
        //        this.caster.GetTeamNumber(),
        //        false
        //    );
        //    return 50;
        //});
    }

    Sp(): Vector {
        return this.v;
    }
    OnHeroLevelUp(): void {
        if (!IsServer()) {
            return;
        }
        this.SetLevel(this.caster.GetLevel());
        this.UpdateDamageAndAttackSpeed();
        this.caster.SetMaxHealth(120 * this.caster.GetLevel());
    }

    OnToggle(): void {
        if (!IsServer()) {
            return;
        }

        this.UpdateDamageAndAttackSpeed();
    }

    UpdateDamageAndAttackSpeed() {
        if (this.GetToggleState() == false) {
            this.caster.SetBaseDamageMax(this.GetSpecialValueFor("quick_attack_damage"));
            this.caster.SetBaseDamageMin(this.GetSpecialValueFor("quick_attack_damage"));
            this.caster.SetBaseAttackTime(this.GetSpecialValueFor("quick_attack_rate"));
        } else {
            this.caster.SetBaseDamageMax(this.GetSpecialValueFor("slow_attack_damage"));
            this.caster.SetBaseDamageMin(this.GetSpecialValueFor("slow_attack_damage"));
            this.caster.SetBaseAttackTime(this.GetSpecialValueFor("slow_attack_rate"));
        }
    }
}

@registerModifier()
export class modifierThinker_test extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: goliath_base_attack = this.GetAbility()! as goliath_base_attack;
    private parent: CDOTA_BaseNPC = this.GetParent();

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
        return true;
    }

    override OnCreated(): void {
        if (!IsServer()) {
            return;
        }
        const pfx = ParticleManager.CreateParticle(
            "particles/custom/units/heroes/hunters/planet_shild.vpcf",
            ParticleAttachment.ABSORIGIN,
            this.caster
        );
        ParticleManager.SetParticleControl(pfx, 0, this.caster.GetAbsOrigin());
        ParticleManager.SetParticleControl(pfx, 1, Vector(1700, 1700, 1700));
        ParticleManager.DestroyAndReleaseParticle(pfx, 50, false);
        AddFOWViewer(DotaTeam.BADGUYS, this.parent.GetAbsOrigin(), 1700, 50, false);
    }

    IsAura(): boolean {
        return true;
    }

    GetAuraSearchFlags(): UnitTargetFlags {
        return UnitTargetFlags.NONE;
    }

    GetAuraSearchTeam(): UnitTargetTeam {
        return UnitTargetTeam.BOTH;
    }

    GetAuraSearchType(): UnitTargetType {
        return UnitTargetType.HERO;
    }

    GetAuraRadius(): number {
        return 1700;
    }

    GetModifierAura(): string {
        return modifier_test.name;
    }

    GetAuraDuration(): number {
        return FrameTime();
    }
}

@registerModifier()
export class modifier_test extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: goliath_base_attack = this.GetAbility()! as goliath_base_attack;
    private parent: CDOTA_BaseNPC = this.GetParent();
    inside = true;
    moveSpeedLimit!: number;

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
    override RemoveOnDeath() {
        return true;
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.MOVESPEED_LIMIT];
    }

    OnIntervalThink() {
        const center_of_field = this.ability.Sp();

        //Solves for the target's distance from the border of the field (negative is inside, positive is outside)
        const distance = ((this.parent.GetAbsOrigin() - center_of_field) as Vector).Length2D();
        const distance_from_border = distance - 1700;

        const parentDirection = ((this.parent.GetAbsOrigin() - this.ability.Sp()) as Vector).Normalized();
        if (
            this.GetWallAngel(parentDirection) <= 90 &&
            distance_from_border <= 0 &&
            math.abs(distance_from_border) <= math.max(this.parent.GetHullRadius(), 50)
        ) {
            this.parent.InterruptMotionControllers(true);
            this.moveSpeedLimit = -1;
        } else {
            this.moveSpeedLimit = 0;
        }
    }

    GetWallAngel(parentDirection: Vector): number {
        const angel = VectorToAngles(parentDirection).y;
        const parentAngel = this.parent.GetAnglesAsVector().y;
        const wallAngel = math.abs(AngleDiff(angel, parentAngel));
        return wallAngel;
    }

    GetModifierMoveSpeed_Limit(): number {
        if (!IsServer()) {
            return 0;
        }

        return this.moveSpeedLimit;
    }

    override OnCreated(): void {
        if (!IsServer()) {
            return;
        }
        if (Utility.CalculateDistance(this.ability.Sp(), this.parent.GetAbsOrigin()) > 1700) {
            this.inside = false;
        }
        this.StartIntervalThink(FrameTime());
    }
}
