import { BaseAbility, registerAbility } from "../../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../../libraries/dota_ts_adapter";

@registerAbility()
export class upgrade_base extends BaseAbility {
    GetIntrinsicModifierName(): string {
        return modifier_upgrade_base.name;
    }
}

@registerModifier()
export class modifier_upgrade_base extends BaseModifier {
    // Modifier properties
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    healPerInterval!: number;
    damagePerInterval!: number;
    maxArmor!: number;
    armorPerInterval!: number;

    // Modifier specials

    override IsHidden() {
        return true;
    }
    override IsPurgable() {
        return false;
    }
    override IsPurgeException() {
        return false;
    }

    override OnCreated(): void {
        this.OnRefresh();
    }

    OnRefresh(): void {
        this.healPerInterval = this.ability.GetSpecialValueFor("heal_per_interval");
        this.damagePerInterval = this.ability.GetSpecialValueFor("damage_per_interval");
        this.armorPerInterval = this.ability.GetSpecialValueFor("armor_per_interval");
        this.maxArmor = this.ability.GetSpecialValueFor("max_armor");
        if (!IsServer()) {
            return;
        }
        this.StartIntervalThink(0.5);
    }

    OnIntervalThink(): void {
        if (!this.ability.IsCooldownReady()) {
            return;
        }
        const currentHeal = this.parent.GetHealth();
        const currentMaxHeal = this.parent.GetMaxHealth();
        const currentDamageMax = this.parent.GetBaseDamageMax();
        const currentDamageMin = this.parent.GetBaseDamageMin();
        const currentArmor = this.parent.GetPhysicalArmorBaseValue();

        const newHeal = currentHeal + this.healPerInterval;
        const newMaxHeal = currentMaxHeal + this.healPerInterval;
        const newDamageMax = currentDamageMax + this.damagePerInterval;
        const newDamageMin = currentDamageMin + this.damagePerInterval;
        const newArmor = math.min(currentArmor + this.armorPerInterval, this.maxArmor);

        this.parent.SetBaseMaxHealth(newMaxHeal);
        this.parent.SetMaxHealth(newMaxHeal);
        this.parent.SetHealth(newHeal);
        this.parent.SetBaseDamageMin(newDamageMin);
        this.parent.SetBaseDamageMax(newDamageMax);
        this.parent.SetPhysicalArmorBaseValue(newArmor);
        this.ability.UseResources(false, false, false, true);
    }
}
