import { BaseAbility, registerAbility } from "../../../../libraries/dota_ts_adapter";

@registerAbility()
export class goliath_base_attack extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();

    Spawn(): void {
        if (!IsServer()) {
            return;
        }

        this.SetLevel(this.caster.GetLevel());
        this.OnToggle();
    }

    OnHeroLevelUp(): void {
        this.SetLevel(this.caster.GetLevel());
    }

    OnToggle(): void {
        if (!IsServer()) {
            return;
        }

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
