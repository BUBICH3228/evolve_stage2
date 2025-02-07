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

    AICore.Init(thisEntity as CDOTA_BaseNPC_AICore, new AILineDireBehavior());
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
        const entities = Entities.FindAllByClassname("path_corner");
        for (let key = 0; key < Object.entries(entities).length; key++) {
            const entity = entities[key];
            const entityName = entity.GetName();
            const strArray = entityName.split("_");
            if (strArray[1] != undefined && strArray[1].startsWith("wavePathBadGuys1")) {
                AICore.SetInitialGoalEntity(thisEntity as CDOTA_BaseNPC_AICore, entity);
            }
        }
    }
}
