import { BaseItem, registerAbility } from "../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../libraries/dota_ts_adapter";

@registerAbility()
export class item_dagon_custom extends BaseItem {
    GetIntrinsicModifierName(): string {
        return modifier_item_dagon_custom.name;
    }

    GetAOERadius(): number {
        return this.GetSpecialValueFor("radius");
    }
    override OnSpellStart(): void {
        const caster = this.GetParent() as CDOTA_BaseNPC_Hero;
        const target = this.GetCursorTarget();

        if (target == undefined) {
            return;
        }

        if (target.TriggerSpellAbsorb(this)) {
            return;
        }

        const enemies = FindUnitsInRadius(
            caster.GetTeamNumber(),
            target.GetAbsOrigin(),
            undefined,
            this.GetAOERadius(),
            this.GetAbilityTargetTeam(),
            this.GetAbilityTargetType(),
            this.GetAbilityTargetFlags(),
            FindOrder.ANY,
            false
        );
        enemies.forEach((target) => {
            const pfx = ParticleManager.CreateParticle("particles/items_fx/dagon.vpcf", ParticleAttachment.RENDERORIGIN_FOLLOW, caster);
            ParticleManager.SetParticleControlEnt(
                pfx,
                0,
                caster,
                ParticleAttachment.POINT_FOLLOW,
                ParticleAttachmentLocation.ATTACK1,
                caster.GetAbsOrigin(),
                false
            );
            ParticleManager.SetParticleControlEnt(
                pfx,
                1,
                target,
                ParticleAttachment.POINT_FOLLOW,
                ParticleAttachmentLocation.HITLOC,
                target.GetAbsOrigin(),
                false
            );
            ParticleManager.SetParticleControl(pfx, 2, Vector(800, 0, 0));
            ApplyDamage({
                attacker: caster,
                victim: target,
                ability: this,
                damage_type: this.GetAbilityDamageType(),
                damage:
                    (this.GetSpecialValueFor("damage") + (this.GetLevel() - 1) * this.GetSpecialValueFor("damage_per_level")) *
                    (caster.GetSpellAmplification(false) + 1),
                damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION
            });
        });

        EmitSoundOn("DOTA_Item.Dagon.Activate", caster);
    }
}

@registerModifier()
export class modifier_item_dagon_custom extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    spellLifesteal!: number;
    bonusAgility!: number;
    bonusStrength!: number;
    bonusIntellect!: number;
    dagonSpellLifesteal!: number;

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
        return false;
    }

    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.STATS_AGILITY_BONUS,
            ModifierFunction.STATS_STRENGTH_BONUS,
            ModifierFunction.STATS_INTELLECT_BONUS,
            ModifierFunction.MOUNTAIN_SPELL_LIFESTEAL,
            ModifierFunction.ON_TAKEDAMAGE
        ];
    }

    GetModifierBonusStats_Agility(): number {
        return this.bonusAgility;
    }

    GetModifierBonusStats_Strength(): number {
        return this.bonusStrength;
    }

    GetModifierBonusStats_Intellect(): number {
        return this.bonusIntellect;
    }

    GetModifierSpellLifesteal(): number {
        return this.spellLifesteal;
    }

    override OnCreated(): void {
        this.OnRefresh();
    }

    override OnRefresh(): void {
        this.bonusAgility = this.ability.GetSpecialValueFor("bonus_all");
        this.bonusStrength = this.ability.GetSpecialValueFor("bonus_all");
        this.bonusIntellect = this.ability.GetSpecialValueFor("bonus_all");
        this.spellLifesteal = this.ability.GetSpecialValueFor("passive_spell_lifesteal");
        this.dagonSpellLifesteal = this.ability.GetSpecialValueFor("dagon_spell_lifesteal") / 100;
    }

    OnTakeDamage(kv: ModifierInstanceEvent): void {
        if (kv.attacker != this.parent) {
            return;
        }

        if (kv.inflictor != this.ability) {
            return;
        }

        this.parent.Heal(kv.damage * this.dagonSpellLifesteal, this.ability);
    }
}
