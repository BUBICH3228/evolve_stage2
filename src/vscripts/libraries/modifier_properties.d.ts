declare type ModifierPropertiesEventData =
    | ModifierAttackEvent
    | ModifierInstanceEvent
    | ModifierPreSpellCriticalStrikeEvent
    | ModifierOrderEvent
    | ModifierAbilityEvent
    | ModifierOverrideAbilitySpecialEvent
    | ModifierAddedEvent
    | ModifierHealEvent;

declare interface ModifierProperties {
    GetModifiersPropertyHighestPriority(
        unit: CDOTA_BaseNPC,
        modifierFunction: ModifierFunction,
        eventData: ModifierPropertiesEventData
    ): number;

    GetModifiersPropertyPercentageMultiplicative(
        unit: CDOTA_BaseNPC,
        modifierFunction: ModifierFunction,
        eventData: ModifierPropertiesEventData
    ): number;

    GetModifiersPropertyHighestValue(
        unit: CDOTA_BaseNPC,
        modifierFunction: ModifierFunction,
        eventData: ModifierPropertiesEventData
    ): number;

    GetModifiersPropertyLowestValue(
        unit: CDOTA_BaseNPC,
        modifierFunction: ModifierFunction,
        eventData: ModifierPropertiesEventData
    ): number;

    GetModifiersPropertyAdditive(unit: CDOTA_BaseNPC, modifierFunction: ModifierFunction, eventData: ModifierPropertiesEventData): number;
    CalculateSpellCriticalStrikeMultiplier(unit: CDOTA_BaseNPC, ability: CDOTABaseAbility, event: DamageFilterEvent): number;
}

declare let ModifierProperties: ModifierProperties;
