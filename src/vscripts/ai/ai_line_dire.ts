import { AICore, CDOTA_BaseNPC_AICore, GenericAIBehavior } from "./ai_core";

declare let thisEntity: CDOTA_BaseNPC;

function Spawn() {
    if (!IsServer()) {
        return;
    }

    if (thisEntity == undefined) {
        return;
    }

    AICore.Init(thisEntity as CDOTA_BaseNPC_AICore, AILineDireBehavior);
}

getfenv(1).Spawn = Spawn;

export class AILineDireBehavior extends GenericAIBehavior {
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
        const waypoint = Entities.FindByName(undefined, "wavePathBadGuys1");
        AICore.SetInitialGoalEntity(thisEntity as CDOTA_BaseNPC_AICore, waypoint);
    }
}
