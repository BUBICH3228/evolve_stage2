export {};

interface CDOTAGameRulesExtended extends CDOTAGameRules {
    Playtesting_UpdateAddOnKeyValuesVanilla(): void;
}

(CDOTAGameRules as unknown as CDOTAGameRulesExtended).Playtesting_UpdateAddOnKeyValuesVanilla =
    (CDOTAGameRules as unknown as CDOTAGameRulesExtended).Playtesting_UpdateAddOnKeyValuesVanilla ??
    CDOTAGameRules.Playtesting_UpdateAddOnKeyValues;

CDOTAGameRules.Playtesting_UpdateAddOnKeyValues = function () {
    const convertedGameRules = this as unknown as CDOTAGameRulesExtended;

    CustomEvents.RunEventByName(CustomEvent.CUSTOM_EVENT_ON_RELOAD_KV, {});

    convertedGameRules.Playtesting_UpdateAddOnKeyValuesVanilla();
};
