import { Settings } from "../data/game_settings";
import { registerModifier, BaseModifier } from "../libraries/dota_ts_adapter";

@registerModifier()
export class modifier_heroes_passive_stats extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    bonusSpellAmpPerAttribute = 0;
    bonusMagicalResistancePerAttribute = 0;
    bonusMoveSpeedPerAttribute = 0;
    bonusMoveSpeedMax = 0;
    maxManaDelimiter = 0;
    spellAmplification = 0;
    dotaNegativeMagicResistancePerInt = 0;
    bonusMagicalResistanceMax = 0;

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

    DeclareFunctions(): modifierfunction[] {
        return [
            ModifierFunction.MANACOST_PERCENTAGE_STACKING,
            ModifierFunction.SPELL_AMPLIFY_PERCENTAGE,
            ModifierFunction.MAGICAL_RESISTANCE_BONUS,
            ModifierFunction.MOVESPEED_BONUS_CONSTANT,
            ModifierFunction.MAGICAL_RESISTANCE_DIRECT_MODIFICATION
        ];
    }

    GetModifierIgnoreMovespeedLimit(): 0 | 1 {
        return 1;
    }

    override OnCreated(): void {
        if (!IsServer()) {
            return;
        }
        this.dotaNegativeMagicResistancePerInt =
            GameRules.GetGameModeEntity().GetCustomAttributeDerivedStatValue(AttributeDerivedStats.INTELLIGENCE_MAGIC_RESIST) * -1;
        this.bonusSpellAmpPerAttribute = Settings.client.dota_attribute_spell_ampification_per_intelligence;
        this.bonusMagicalResistancePerAttribute = Settings.client.dota_attribute_magic_resistance_per_strength;
        this.bonusMoveSpeedPerAttribute = Settings.client.dota_attribute_move_speed_per_agility;
        this.bonusMoveSpeedMax = Settings.client.dota_attribute_move_speed_max;
        this.maxManaDelimiter = Settings.server.percentage_manacustom_increase_from_spell_amplify_delimiter * -1;
        this.bonusMagicalResistanceMax = Settings.client.dota_attribute_magic_resistance_per_strength_max;
        this.spellAmplification = this.parent.GetSpellAmplification(false);

        this.SetHasCustomTransmitterData(true);
        this.StartIntervalThink(0.05);
    }

    OnIntervalThink(): void {
        this.spellAmplification = this.parent.GetSpellAmplification(false);
        this.SendBuffRefreshToClients();
        this.StartIntervalThink(1);
    }

    GetModifierPercentageManacostStacking(kv: ModifierAbilityEvent): number {
        if (!kv.ability || Settings.server.percentage_manacustom_exceptions[kv.ability.GetAbilityName()]) {
            return 0;
        }

        return this.maxManaDelimiter * this.spellAmplification;
    }

    GetModifierSpellAmplify_Percentage(): number {
        return (this.parent as CDOTA_BaseNPC_Hero).GetIntellect(false) * this.bonusSpellAmpPerAttribute;
    }

    GetModifierMagicalResistanceBonus(): number {
        return math.min(
            (this.parent as CDOTA_BaseNPC_Hero).GetStrength() * this.bonusMagicalResistancePerAttribute,
            this.bonusMagicalResistanceMax
        );
    }

    GetModifierMagicalResistanceDirectModification(): number {
        return this.dotaNegativeMagicResistancePerInt * (this.parent as CDOTA_BaseNPC_Hero).GetIntellect(false);
    }

    GetModifierMoveSpeedBonus_Constant(): number {
        return (this.parent as CDOTA_BaseNPC_Hero).GetAgility() * this.bonusMoveSpeedPerAttribute;
    }

    AddCustomTransmitterData() {
        return {
            bonusSpellAmpPerAttribute: this.bonusSpellAmpPerAttribute,
            bonusMagicalResistancePerAttribute: this.bonusMagicalResistancePerAttribute,
            bonusMagicalResistanceMax: this.bonusMagicalResistanceMax,
            bonusMoveSpeedPerAttribute: this.bonusMoveSpeedPerAttribute,
            bonusMoveSpeedMax: this.bonusMoveSpeedMax,
            maxManaDelimiter: this.maxManaDelimiter,
            spellAmplification: this.spellAmplification,
            dotaNegativeMagicResistancePerInt: this.dotaNegativeMagicResistancePerInt
        };
    }

    HandleCustomTransmitterData(data: ReturnType<this["AddCustomTransmitterData"]>): void {
        (this.bonusSpellAmpPerAttribute = data.bonusSpellAmpPerAttribute),
            (this.bonusMagicalResistancePerAttribute = data.bonusMagicalResistancePerAttribute),
            (this.bonusMagicalResistanceMax = data.bonusMagicalResistanceMax),
            (this.bonusMoveSpeedPerAttribute = data.bonusMoveSpeedPerAttribute),
            (this.bonusMoveSpeedMax = data.bonusMoveSpeedMax),
            (this.maxManaDelimiter = data.maxManaDelimiter),
            (this.spellAmplification = data.spellAmplification),
            (this.dotaNegativeMagicResistancePerInt = data.dotaNegativeMagicResistancePerInt);
    }
}
