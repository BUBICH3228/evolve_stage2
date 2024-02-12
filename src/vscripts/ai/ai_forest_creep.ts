import { AICore, CDOTA_BaseNPC_AICore, GenericAIBehavior } from "./ai_core";

declare let thisEntity: CDOTA_BaseNPC;

function Spawn() {
    if (!IsServer()) {
        return;
    }

    if (thisEntity == undefined) {
        return;
    }

    AICore.Init(thisEntity as CDOTA_BaseNPC_AICore, AIForestCreepBehavior);
}

getfenv(1).Spawn = Spawn;

export class AIForestCreepBehavior extends GenericAIBehavior {
    IsCanRetreatToSpawnPosition() {
        return true;
    }

    IsCanRespondToHelpCall() {
        return true;
    }

    IsCanTargetNeutralCreeps() {
        return true;
    }
}
