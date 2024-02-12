import { BaseModifier, registerModifier } from "../libraries/dota_ts_adapter";

interface shildData {
    PhysicalDamageBlock?: number;
    MagicalDamageBlock?: number;
    AllDamageBlock?: number;
}

@registerModifier()
export class modifier_shild_custom extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    magicalDamageBlock = 0;
    allDamageBlock = 0;
    physicalDamageBlock = 0;

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
        return [
            ModifierFunction.INCOMING_PHYSICAL_DAMAGE_CONSTANT,
            ModifierFunction.INCOMING_SPELL_DAMAGE_CONSTANT,
            ModifierFunction.INCOMING_DAMAGE_CONSTANT
        ];
    }

    GetModifierIncomingPhysicalDamageConstant(kv: ModifierAttackEvent): number {
        if (this.physicalDamageBlock == 0) {
            return 0;
        }

        const armor = this.parent.GetPhysicalArmorValue(false);
        const dotaDecline = (0.058 * armor) / (1 + 0.058 * math.abs(armor));
        kv.damage = kv.damage / (1 - dotaDecline);

        let damageMult = 1 - armor / (100 + math.abs(armor));

        if (armor < 0) {
            damageMult = 2 - damageMult;
        }

        kv.damage = kv.damage * damageMult;

        if (!IsServer()) {
            return this.physicalDamageBlock;
        }

        if (kv.damage > this.physicalDamageBlock) {
            this.Destroy();
            return -this.physicalDamageBlock;
        } else {
            this.physicalDamageBlock -= kv.damage;
            this.SendBuffRefreshToClients();
            return -kv.damage;
        }
    }

    GetModifierIncomingSpellDamageConstant(kv: ModifierAttackEvent): number {
        if (this.magicalDamageBlock == 0) {
            return 0;
        }

        if (!IsServer()) {
            return this.magicalDamageBlock;
        }

        if (kv.damage > this.magicalDamageBlock) {
            this.Destroy();
            return -this.magicalDamageBlock;
        } else {
            this.magicalDamageBlock -= kv.damage;
            this.SendBuffRefreshToClients();
            return -kv.damage;
        }
    }

    GetModifierIncomingDamageConstan(kv: ModifierAttackEvent): number {
        if (this.allDamageBlock == 0) {
            return 0;
        }

        if (kv.damage_type == DamageTypes.PHYSICAL) {
            const armor = this.parent.GetPhysicalArmorValue(false);
            const dotaDecline = (0.058 * armor) / (1 + 0.058 * math.abs(armor));
            kv.damage = kv.damage / (1 - dotaDecline);

            let damageMult = 1 - armor / (100 + math.abs(armor));

            if (armor < 0) {
                damageMult = 2 - damageMult;
            }

            kv.damage = kv.damage * damageMult;
        }

        if (!IsServer()) {
            return this.allDamageBlock;
        }

        if (kv.damage > this.allDamageBlock) {
            this.Destroy();
            return -this.allDamageBlock;
        } else {
            this.allDamageBlock -= kv.damage;
            this.SendBuffRefreshToClients();
            return -kv.damage;
        }
    }

    override OnCreated(kv: shildData): void {
        this.OnRefresh(kv);
    }

    OnRefresh(kv: shildData): void {
        if (kv.PhysicalDamageBlock != undefined) {
            this.physicalDamageBlock = math.min(kv.PhysicalDamageBlock + this.physicalDamageBlock, 2000000);
        }
        if (kv.MagicalDamageBlock != undefined) {
            this.magicalDamageBlock = math.min(kv.MagicalDamageBlock + this.magicalDamageBlock, 2000000);
        }
        if (kv.AllDamageBlock != undefined) {
            this.allDamageBlock = math.min(kv.AllDamageBlock + this.allDamageBlock, 4000000);
        }
        if (!IsServer()) {
            return;
        }
        this.SetHasCustomTransmitterData(true);
        this.StartIntervalThink(0.1);
    }

    OnIntervalThink(): void {
        this.allDamageBlock += 0.1;
        this.SendBuffRefreshToClients();
        this.allDamageBlock -= 0.1;
    }

    AddCustomTransmitterData() {
        return {
            physicalDamageBlock: this.physicalDamageBlock,
            magicalDamageBlock: this.magicalDamageBlock,
            allDamageBlock: this.allDamageBlock
        };
    }

    HandleCustomTransmitterData(data: ReturnType<this["AddCustomTransmitterData"]>): void {
        this.physicalDamageBlock = data.physicalDamageBlock;
        this.magicalDamageBlock = data.magicalDamageBlock;
        this.allDamageBlock = data.allDamageBlock;
    }
}
