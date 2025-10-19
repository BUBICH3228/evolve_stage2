import { BaseAbility, registerAbility } from "../../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../../libraries/dota_ts_adapter";

@registerAbility()
export class rattletrap_scaner extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();

    Spawn(): void {
        if (!IsServer()) {
            return;
        }
        this.SetLevel(1);
    }

    override OnSpellStart(): void {
        const enemies = FindUnitsInRadius(
            this.caster.GetTeamNumber(),
            Vector(0, 0, 0),
            undefined,
            FIND_UNITS_EVERYWHERE,
            this.GetAbilityTargetTeam(),
            this.GetAbilityTargetType(),
            this.GetAbilityTargetFlags(),
            FindOrder.ANY,
            false
        );

        enemies.forEach((target) => {
            target.AddNewModifier(this.caster, this, modifier_rattletrap_scaner_debuff.name, {
                duration: this.GetSpecialValueFor("duration") * (1 - target.GetStatusResistance())
            });
            PlayerResource.SendCustomErrorMessageToPlayer(target.GetPlayerOwnerID(), "#rattletrap_scaner_detection_message");
        });

        this.caster.AddNewModifier(this.caster, this, modifier_rattletrap_scaner.name, { duration: this.GetSpecialValueFor("duration") });
    }
}

@registerModifier()
export class modifier_rattletrap_scaner_debuff extends BaseModifier {
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
    override RemoveOnDeath() {
        return true;
    }

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.PROVIDES_FOW_POSITION];
    }
    GetModifierProvidesFOWVision(): 0 | 1 {
        return 1;
    }

    OnCreated(): void {
        if (!IsServer()) {
            return;
        }
        GameRules.ExecuteTeamPing(this.caster.GetTeam(), this.parent.GetAbsOrigin().x, this.parent.GetAbsOrigin().y, this.caster, 0);
    }
}

@registerModifier()
export class modifier_rattletrap_scaner extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    bonusMovementSpeed!: number;

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

    DeclareFunctions(): modifierfunction[] {
        return [ModifierFunction.MOVESPEED_BONUS_PERCENTAGE];
    }

    GetModifierMoveSpeedBonus_Percentage(): number {
        return this.bonusMovementSpeed;
    }

    override OnCreated(): void {
        this.OnRefresh();
    }

    override OnRefresh(): void {
        this.bonusMovementSpeed = this.ability.GetSpecialValueFor("bonus_movement_speed");
    }
}
