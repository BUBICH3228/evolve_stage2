import { BaseAbility, registerAbility } from "../../../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../../../libraries/dota_ts_adapter";

@registerAbility()
export class griffin_harpoon_gun extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();
    pfx!: ParticleID;

    Spawn(): void {
        if (!IsServer()) {
            return;
        }
        this.SetLevel(1);
    }

    override OnSpellStart(): void {
        const target = this.GetCursorTarget();
        if (target == undefined) {
            return;
        }
        target.AddNewModifier(this.caster, this, modifier_griffin_harpoon_gun.name, {
            duration: this.GetSpecialValueFor("duration") * (1 - target.GetStatusResistance())
        });
        const direction = ((target.GetAbsOrigin() - this.GetCaster().GetAbsOrigin()) as Vector).Normalized();

        direction.z = 0;

        this.pfx = ParticleManager.CreateParticle(
            "particles/units/heroes/hero_rattletrap/rattletrap_hookshot.vpcf",
            ParticleAttachment.CUSTOMORIGIN,
            this.caster
        );

        ParticleManager.SetParticleControlEnt(
            this.pfx,
            0,
            this.GetCaster(),
            ParticleAttachment.POINT_FOLLOW,
            ParticleAttachmentLocation.WEAPON,
            this.GetCaster().GetAbsOrigin(),
            true
        );

        ParticleManager.SetParticleControl(this.pfx, 2, Vector(this.GetSpecialValueFor("speed"), 0, 0));
        ParticleManager.SetParticleControl(this.pfx, 3, Vector(this.GetSpecialValueFor("duration"), 0, 0));
        Timers.CreateTimer(0.1, () => {
            ParticleManager.SetParticleControl(this.pfx, 1, target.GetAbsOrigin());
            return 0.1;
        });
    }
}

@registerModifier()
export class modifier_griffin_harpoon_gun extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    moveSpeedLimit!: number;
    slowMovespeedAlly!: number;
    slow_movespeedEnemy!: number;
    maxRadiusChain!: number;
    damage!: number;

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
    override RemoveOnDeath() {
        return true;
    }

    override OnCreated(): void {
        this.OnRefresh();
        if (!IsServer()) {
            return;
        }
        ApplyDamage({
            victim: this.parent,
            attacker: this.caster,
            damage: this.damage * (1 + this.caster.GetSpellAmplification(false)),
            ability: this.ability,
            damage_type: this.ability.GetAbilityDamageType(),
            damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION
        });
        this.StartIntervalThink(FrameTime());
    }

    OnIntervalThink(): void {
        const meOrigin = this.caster.GetAbsOrigin();
        const targetOrigin = this.parent.GetAbsOrigin();

        this.parent.SetBaseMoveSpeed;

        const meDirection = Vector(meOrigin.x - targetOrigin.x, meOrigin.y - targetOrigin.y, 0);
        const meDistance = Math.sqrt(meDirection.x * meDirection.x + meDirection.y * meDirection.y);
        const meNormalizedDirection = Vector(meDirection.x / meDistance, meDirection.y / meDistance, 0);

        const targetDirection = Vector(targetOrigin.x - meOrigin.x, targetOrigin.y - meOrigin.y, 0);
        const targetDistance = Math.sqrt(targetDirection.x * targetDirection.x + targetDirection.y * targetDirection.y);
        const targetNormalizedDirection = Vector(targetDirection.x / targetDistance, targetDirection.y / targetDistance, 0);

        const targetPullSpeed = this.parent.GetBaseMoveSpeed() * this.slow_movespeedEnemy;
        const mePullSpeed = this.caster.GetBaseMoveSpeed() * this.slowMovespeedAlly;
        const targetAdjustedPullSpeed = targetPullSpeed * FrameTime();
        const meAdjustedPullSpeed = mePullSpeed * FrameTime();
        if (CalculateDistance(meOrigin, targetOrigin) >= this.maxRadiusChain) {
            const newMeOrigin = Vector(
                meOrigin.x + targetNormalizedDirection.x * meAdjustedPullSpeed,
                meOrigin.y + targetNormalizedDirection.y * meAdjustedPullSpeed,
                meOrigin.z
            );
            if (CalculateDistance(newMeOrigin, targetOrigin) > this.parent.GetHullRadius()) {
                this.caster.SetAbsOrigin(newMeOrigin);
            }
        }

        const newTargetOrigin = Vector(
            targetOrigin.x + meNormalizedDirection.x * targetAdjustedPullSpeed,
            targetOrigin.y + meNormalizedDirection.y * targetAdjustedPullSpeed,
            targetOrigin.z
        );
        if (CalculateDistance(meOrigin, newTargetOrigin) > this.caster.GetHullRadius()) {
            this.parent.SetAbsOrigin(newTargetOrigin);
        }
    }

    override OnRefresh(): void {
        this.slowMovespeedAlly = this.ability.GetSpecialValueFor("slow_movespeed_ally") / 100;
        this.slow_movespeedEnemy = this.ability.GetSpecialValueFor("slow_movespeed_enemy") / 100;
        this.maxRadiusChain = this.ability.GetSpecialValueFor("max_radius_chain");
        this.damage = this.ability.GetSpecialValueFor("damage");
    }
}
