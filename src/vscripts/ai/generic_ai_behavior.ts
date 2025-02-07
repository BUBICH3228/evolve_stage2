export class GenericAIBehavior {
    IsCanRetreatToSpawnPosition(): boolean {
        return true;
    }

    IsCanRespondToHelpCall(): boolean {
        return true;
    }

    IsCanTargetNeutralCreeps(): boolean {
        return true;
    }

    IsCanAdjustPathToGoal(): boolean {
        return false;
    }

    IsCompletelyForgetAboutInvisibleEnemies(): boolean {
        return false;
    }
    /* eslint-disable @typescript-eslint/no-empty-function */
    /* eslint-disable @typescript-eslint/no-unused-vars */
    OnInit(thisEntity: CDOTA_BaseNPC): void {}
}
