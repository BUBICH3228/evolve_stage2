declare interface CustomUIConfig {
    GameDifficulty: GameDifficulty;
}

declare interface GameDifficulty {
    GetDifficultyImage: (difficulty: GameDifficultyType) => string;
    GetDifficultyTooltip: (difficulty: GameDifficultyType) => string;
    GetCurrentDifficulty: () => GameDifficultyType;
    IsSelected: () => boolean;
    ListenToGameDifficultyChangedEvent: (callback: () => void) => void;
}

// eslint-disable-next-line no-var
declare var GameDifficulty: GameDifficulty;
