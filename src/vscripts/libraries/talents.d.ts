declare interface Talents {
    GetAbilitySpecialValueAfterTalentsModifiers(
        hero: CDOTA_BaseNPC,
        abilityName: string,
        specialName: string,
        baseSpecialValue: number
    ): number;
    IsTalentLearned(hero: CDOTA_BaseNPC, talentName: string): boolean;
}

declare let Talents: Talents;
