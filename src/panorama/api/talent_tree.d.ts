declare interface CustomUIConfig {
    TalentTree: TalentTree;
}

declare interface TalentTree {
    ConvertBranchNameToEnumValue: (branchName: string) => number;
    GetBranchSelected: (branchId: number) => boolean;
    SetBranchSelected: (branchId: number, state: boolean) => void;
    GetBranchAvailable: (branchId: number) => boolean;
    SetBranchAvailable: (branchId: number, state: boolean) => void;
    GetBranchPanel: (branchId: number) => Panel;
    SetBranchPanel: (branchId: number, panel: Panel) => void;
    GetTalentNameForHero: (hero: EntityIndex, branchId: number) => string;
    IsTalentOfHeroHasDescription: (hero: EntityIndex, branchId: number) => boolean;
    SetupTalentDescriptionLabel: (hero: EntityIndex, branchId: number, label: Panel) => void;
    IsHeroCanLearnTalent: (hero: EntityIndex, branchId: number) => boolean;
    IsHeroHaveTalent: (hero: EntityIndex, branchId: number) => boolean;
    IsAnyTalentCanBeLearned: (hero: EntityIndex) => boolean;
    SetTalentTreeWindow: (window: Panel) => void;
    IsMouseOverTalentTreeWindow: () => boolean;
    IsTalentTreeWindowOpened: () => boolean;
    ToggleTalentTreeWindow: () => void;
    CloseTalentTreeWindow: () => void;
    OpenTalentTreeWindow: () => void;
    ListenToLocalPlayerTalentTreeChangedEvent: (callback: () => void) => void;
}

// eslint-disable-next-line no-var
declare var TalentTree: TalentTree;
