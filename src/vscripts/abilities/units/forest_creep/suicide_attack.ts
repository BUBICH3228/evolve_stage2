import { BaseAbility, registerAbility } from "../../../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../../../libraries/dota_ts_adapter";

@registerAbility()
export class suicide_attack extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();

    GetIntrinsicModifierName(): string {
        return modifier_suicide_attack.name;
    }
}

@registerModifier()
export class modifier_suicide_attack extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    damage!: number;
    targetTeam!: UnitTargetTeam;
    targetType!: UnitTargetType;
    targetFlags!: UnitTargetFlags;
    damageTable!: {
        victim: CDOTA_BaseNPC;
        attacker: CDOTA_BaseNPC;
        damage: number;
        ability: CDOTABaseAbility;
        damage_type: DamageTypes;
        damage_flags: DamageFlag;
    };
    radius!: number;
    chance!: number;

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

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.ON_DEATH];
    }

    override OnCreated(): void {
        this.OnRefresh();

        if (!IsServer()) {
            return;
        }
        this.targetTeam = this.ability.GetAbilityTargetTeam();
        this.targetType = this.ability.GetAbilityTargetType();
        this.targetFlags = this.ability.GetAbilityTargetFlags();

        this.damageTable = {
            victim: this.caster,
            attacker: this.caster,
            damage: 0,
            ability: this.ability,
            damage_type: this.ability.GetAbilityDamageType(),
            damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION
        };
    }

    override OnRefresh(): void {
        this.damage = this.ability.GetSpecialValueFor("damage_pct_per_max_health") / 100;
        this.radius = this.ability.GetSpecialValueFor("radius");
        this.chance = this.ability.GetSpecialValueFor("chance");
    }

    OnDeath(kv: ModifierInstanceEvent): void {
        if (kv.unit != this.parent) {
            return;
        }

        if (RandomInt(1, 100) > this.chance) {
            return;
        }

        const enemies = FindUnitsInRadius(
            this.parent.GetTeamNumber(),
            this.parent.GetAbsOrigin(),
            undefined,
            this.radius,
            this.targetTeam,
            this.targetType,
            this.targetFlags,
            FindOrder.ANY,
            false
        );

        enemies.forEach((target) => {
            const damage = this.damage * target.GetMaxHealth() * (this.parent.GetSpellAmplification(false) + 1);
            this.damageTable.victim = target;
            this.damageTable.damage = damage;
            ApplyDamage(this.damageTable);
        });

        const pfx = ParticleManager.CreateParticle(
            "particles/units/heroes/hero_techies/techies_blast_off.vpcf",
            ParticleAttachment.WORLDORIGIN,
            this.parent
        );
        ParticleManager.SetParticleControl(pfx, 0, this.parent.GetAbsOrigin());
        ParticleManager.DestroyAndReleaseParticle(pfx);
    }
}
