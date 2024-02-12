import { BaseAbility, registerAbility } from "../../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../../libraries/dota_ts_adapter";

@registerAbility()
export class gold_tower extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();

    GetIntrinsicModifierName(): string {
        return modifier_gold_tower.name;
    }
}

@registerModifier()
export class modifier_gold_tower extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    timerBeforeReset = 0;
    timerBeforeBuff = 0;
    countBuff = 1;
    pfx!: ParticleID;
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
            [ModifierState.NO_HEALTH_BAR]: true,
            [ModifierState.INVULNERABLE]: true
        };
    }

    override OnCreated(): void {
        this.OnRefresh();
        if (!IsServer()) {
            return;
        }
        this.parent.AddActivityModifier("level4");
        this.StartIntervalThink(1);
    }

    OnRefresh(): void {
        if (!IsServer()) {
            return;
        }
    }

    OnIntervalThink(): void {
        if (this.ThereAreEnemies()) {
            this.timerBeforeReset++;
        } else if (this.ThereAreAllies()) {
            this.timerBeforeBuff++;
        } else {
            this.timerBeforeReset++;
        }

        if (this.timerBeforeBuff >= 60) {
            if (this.countBuff < 6) {
                this.countBuff++;
            }
            this.timerBeforeBuff = 0;
            this.timerBeforeReset = 0;
        } else if (this.timerBeforeReset >= 80) {
            if (this.countBuff >= 3) {
                this.countBuff -= 2;
            }
            this.timerBeforeReset = 0;
            this.timerBeforeBuff = 0;
        }
        this.pfx = ParticleManager.CreateParticle(
            "particles/units/heroes/hero_monkey_king/monkey_king_quad_tap_stack.vpcf",
            ParticleAttachment.OVERHEAD_FOLLOW,
            this.parent
        );
        ParticleManager.SetParticleControl(this.pfx, 0, this.parent.GetAbsOrigin());
        ParticleManager.SetParticleControl(this.pfx, 1, Vector(0, this.countBuff, 0));
        ParticleManager.DestroyAndReleaseParticle(this.pfx, 1);
        this.parent.SetMaterialGroup("dire_level" + this.countBuff);
    }

    ThereAreEnemies(): boolean {
        const enemies = FindUnitsInRadius(
            this.parent.GetTeamNumber(),
            this.parent.GetAbsOrigin(),
            undefined,
            this.parent.GetAcquisitionRange(),
            UnitTargetTeam.ENEMY,
            UnitTargetType.ALL,
            UnitTargetFlags.NONE,
            FindOrder.ANY,
            false
        );
        return enemies.length > 0;
    }

    ThereAreAllies(): boolean {
        const allies = FindUnitsInRadius(
            this.parent.GetTeamNumber(),
            this.parent.GetAbsOrigin(),
            undefined,
            this.parent.GetAcquisitionRange(),
            UnitTargetTeam.FRIENDLY,
            UnitTargetType.HERO,
            UnitTargetFlags.NONE,
            FindOrder.ANY,
            false
        ) as CDOTA_BaseNPC_Hero[];

        allies.forEach((target) => {
            const gold = 1 + this.countBuff * (1 * math.floor(GameRules.GetDOTATime(false, false) / 60) * 1.23);
            const xp = 3 + this.countBuff * (1 * math.floor(GameRules.GetDOTATime(false, false) / 60) * 1.18);
            const plaer = PlayerResource.GetPlayer(target.GetPlayerOwnerID());
            target.ModifyGold(gold, true, ModifyGoldReason.CREEP_KILL);
            SendOverheadEventMessage(plaer, OverheadAlert.GOLD, target, gold, undefined);
            target.AddExperience(xp, ModifyXpReason.CREEP_KILL, false, false);
            SendOverheadEventMessage(plaer, OverheadAlert.XP, target, xp, undefined);
        });

        return allies.length > 0;
    }
}
