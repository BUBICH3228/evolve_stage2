import { QuestID } from "../common/data/quests";
import { pathToHasQuestParticle } from "../common/quests/common";

// eslint-disable-next-line no-var
var Quests = GameUI.CustomUIConfig().Quests;

interface QuestNpcWithParticle {
    particle: ParticleID;
    unitName: string;
    entityIndex: EntityIndex;
}

interface QuestNpcsWithParticle {
    [key: string]: QuestNpcWithParticle;
}

class QuestsMarkers {
    private _timerInterval = 1;
    private _npcsWithMarkers: QuestNpcsWithParticle = {};
    private _isTimerStarted = false;

    constructor() {
        Quests.ListenToLocalPlayerQuestsChangedEvent(() => this.OnQuestsDataChanged());
    }

    private OnTimer() {
        this.TryAddMarkersToNpcs();
        $.Schedule(this._timerInterval, () => this.OnTimer());
    }

    private OnQuestsDataChanged() {
        this.TryAddMarkersToNpcs();
        if (!this._isTimerStarted) {
            this.OnTimer();
            this._isTimerStarted = true;
        }
    }

    private TryClearQuestMarkForEntityIndex(entityIndex: EntityIndex, unitName: string, npcQuestsIds: QuestID[]) {
        if (this._npcsWithMarkers[entityIndex] != undefined && this._npcsWithMarkers[entityIndex].unitName != unitName) {
            this.DeleteMarkerForEntityIndex(entityIndex);
            return;
        }

        if (!this.IsPlayerCanTakeAnyQuests(npcQuestsIds)) {
            this.DeleteMarkerForEntityIndex(entityIndex);
            return;
        }
    }

    private IsPlayerCanTakeAnyQuests(npcQuests: QuestID[]) {
        const npcQuestsCount = npcQuests.length;
        let possibleNpcQuestsCount = npcQuestsCount;

        npcQuests.forEach((questId) => {
            if (!Quests.IsPlayerCanTakeQuest(questId)) {
                possibleNpcQuestsCount--;
            }
        });

        return possibleNpcQuestsCount > 0;
    }

    private DeleteMarkerForEntityIndex(entityIndex: EntityIndex) {
        if (this._npcsWithMarkers[entityIndex] != undefined) {
            const particle = this._npcsWithMarkers[entityIndex].particle;
            Particles.DestroyParticleEffect(particle, true);
            Particles.ReleaseParticleIndex(particle);
            delete this._npcsWithMarkers[entityIndex];
        }
    }

    private IsValidEntityIndexForMark(entityIndex: EntityIndex, unitName: string) {
        if (this._npcsWithMarkers[entityIndex] != undefined) {
            return this._npcsWithMarkers[entityIndex].unitName != unitName;
        }

        return true;
    }

    private TryAddMarkersToNpcs() {
        const npcsWithQuests = Quests.GetNpcsWithAvailableQuests();

        const entitiesIndexes = Entities.GetAllEntities();

        for (const entityIndex of entitiesIndexes) {
            const npcName = Entities.GetUnitName(entityIndex);
            if (
                npcsWithQuests[npcName] != undefined &&
                this.IsValidEntityIndexForMark(entityIndex, npcName) &&
                this.IsPlayerCanTakeAnyQuests(npcsWithQuests[npcName])
            ) {
                this.DeleteMarkerForEntityIndex(entityIndex);
                const particle = Particles.CreateParticle(pathToHasQuestParticle, ParticleAttachment.OVERHEAD_FOLLOW, entityIndex);
                this._npcsWithMarkers[entityIndex] = {
                    particle: particle,
                    unitName: npcName,
                    entityIndex: entityIndex
                };
            }
        }

        for (const [_, data] of Object.entries(this._npcsWithMarkers)) {
            this.TryClearQuestMarkForEntityIndex(data.entityIndex, Entities.GetUnitName(data.entityIndex), npcsWithQuests[data.unitName]);
        }
    }
}

new QuestsMarkers();
