import { AICore, CDOTA_BaseNPC_AICore, GenericAIBehavior } from "./ai_core";

declare let thisEntity: CDOTA_BaseNPC;

function Spawn() {
    if (!IsServer()) {
        return;
    }

    if (thisEntity == undefined) {
        return;
    }

    AICore.Init(thisEntity as CDOTA_BaseNPC_AICore, AILineRadiantBehavior);
}

getfenv(1).Spawn = Spawn;

export class AILineRadiantBehavior extends GenericAIBehavior {
    IsCanRetreatToSpawnPosition() {
        return false;
    }

    IsCanRespondToHelpCall() {
        return true;
    }

    IsCanAdjustPathToGoal() {
        return true;
    }

    IsCompletelyForgetAboutInvisibleEnemies() {
        return true;
    }

    OnInit(thisEntity: CDOTA_BaseNPC) {
        const waypoint = Entities.FindByName(undefined, "wavePathGoodGuys1");
        AICore.SetInitialGoalEntity(thisEntity as CDOTA_BaseNPC_AICore, waypoint);
    }
}
