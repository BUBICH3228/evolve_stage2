export {};

declare global {
    interface CDOTA_BaseNPC_Hero {
        GetSpendedAbilityPoints(): number;
        SetSpendedAbilityPoints(points: number): void;
    }
}

interface CDOTA_BaseNPC_HeroExtended extends CDOTA_BaseNPC_Hero {
    _spendedAbilityPoints: number | undefined;
}

CDOTA_BaseNPC_Hero.GetSpendedAbilityPoints = function () {
    const convertedHero = this as unknown as CDOTA_BaseNPC_HeroExtended;

    convertedHero._spendedAbilityPoints ??= 0;

    return convertedHero._spendedAbilityPoints;
};

CDOTA_BaseNPC_Hero.SetSpendedAbilityPoints = function (points: number) {
    const convertedHero = this as unknown as CDOTA_BaseNPC_HeroExtended;

    convertedHero._spendedAbilityPoints = points;
};
