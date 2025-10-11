export class GenericAIBehavior {
    IsCanRetreatToSpawnPosition(): boolean {
        return false;
    }

    IsCanAttackFirst(): boolean {
        return false;
    }

    IsAggressiveForm(): boolean {
        return false;
    }

    /* eslint-disable @typescript-eslint/no-empty-function */
    /* eslint-disable @typescript-eslint/no-unused-vars */
    OnInit(thisEntity: CDOTA_BaseNPC): void {}
}
