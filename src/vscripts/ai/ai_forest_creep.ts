import { AICore, CDOTA_BaseNPC_AICore } from "./ai_core";
import { GenericAIBehavior } from "./generic_ai_behavior";

declare let thisEntity: CDOTA_BaseNPC;

function Spawn() {
    if (!IsServer()) {
        return;
    }

    if (thisEntity == undefined) {
        return;
    }
    AICore.Init(thisEntity as CDOTA_BaseNPC_AICore, new AIForestCreepBehavior());
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
