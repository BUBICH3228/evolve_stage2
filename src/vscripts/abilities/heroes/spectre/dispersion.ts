import { BaseAbility, registerAbility } from "../../../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../../../libraries/dota_ts_adapter";

@registerAbility()
export class spectre_dispersion_custom extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();

    GetIntrinsicModifierName(): string {
        return modifier_spectre_dispersion_custom.name;
    }

    GetCastRange(): number {
        return this.GetSpecialValueFor("max_radius");
    }
}

@registerModifier()
export class modifier_spectre_dispersion_custom extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    maxRadius!: number;
    minRadius!: number;
    damageTable!: ApplyDamageOptions;
    reflect!: number;
    multiplier!: number;

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
        return [ModifierFunction.INCOMING_DAMAGE_PERCENTAGE];
    }

    override OnCreated(): void {
        this.OnRefresh();
    }

    OnRefresh(): void {
        this.minRadius = this.ability.GetSpecialValueFor("max_radius");
        this.maxRadius = this.ability.GetSpecialValueFor("max_radius");
        this.reflect = this.ability.GetSpecialValueFor("damage_reflection_pct") / 100;
        this.multiplier = this.ability.GetSpecialValueFor("multiplier");

        if (!IsServer()) {
            return;
        }

        this.damageTable = {
            victim: this.caster,
            attacker: this.caster,
            damage: 0,
            ability: this.ability,
            damage_type: DamageTypes.NONE,
            damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION + DamageFlag.REFLECTION
        };
    }

    GetModifierIncomingDamage_Percentage(kv: ModifierAttackEvent): number {
        if (this.parent.IsIllusion()) {
            return 0;
        }
        if (this.parent.PassivesDisabled()) {
            return 0;
        }
        if (bit.band(kv.damage_flags, DamageFlag.REFLECTION) == DamageFlag.REFLECTION) {
            return 0;
        }

        const enemies = FindUnitsInRadius(
            this.caster.GetTeamNumber(),
            this.caster.GetAbsOrigin(),
            undefined,
            this.maxRadius,
            this.ability.GetAbilityTargetTeam(),
            this.ability.GetAbilityTargetType(),
            this.ability.GetAbilityTargetFlags(),
            FindOrder.ANY,
            false
        );

        enemies.forEach((target) => {
            const distance = CalculateDistance(target.GetAbsOrigin(), this.caster.GetAbsOrigin());
            let pct = (this.maxRadius - distance) / (this.maxRadius - this.minRadius);
            pct = math.min(pct, 1);

            this.damageTable.victim = target;
            this.damageTable.damage_type = kv.damage_type;
            this.damageTable.damage = kv.damage * pct * this.reflect * this.multiplier;
            ApplyDamage(this.damageTable);
        });

        return -this.reflect;
    }
}
