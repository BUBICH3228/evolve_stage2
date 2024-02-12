import { QuestID } from "../common/data/quests";
import { IsPlayerQuestActionCompleted } from "../common/quests/common";
import { PlayerQuest } from "../common/quests/player_quest";

// eslint-disable-next-line no-var
var Quests = GameUI.CustomUIConfig().Quests;
// eslint-disable-next-line no-var
var Utils = GameUI.CustomUIConfig().Utils;

interface QuestActionPanel {
    panel: Panel;
    isCompleted: boolean;
    SetProgress: (progress: number) => void;
    SetVisibility: (visible: boolean) => void;
}

interface QuestPanel {
    panel: Panel;
    actions: QuestActionPanel[];
    questId: QuestID;
}

class QuestsTracker {
    private _questsPanels: Partial<Record<QuestID, QuestPanel>> = {};
    private _questTrackerRoot: Panel = $("#QuestsTracker");

    constructor() {
        this._questTrackerRoot.RemoveAndDeleteChildren();
        Quests.ListenToLocalPlayerQuestsChangedEvent(() => this.OnQuestsDataChanged());
        GameEvents.Subscribe("quests_quest_finished", (event) => {
            this.FinishAndRemoveQuest(event.quest_id as QuestID, event.abandoned);
        });
    }

    private OnQuestsDataChanged() {
        const playerQuests = Quests.GetPlayerQuests();

        if (playerQuests == undefined) {
            return;
        }

        for (const [_, quest] of Object.entries(playerQuests)) {
            if (quest != undefined) {
                this.CreateOrUpdateQuestsPanel(quest.questId, quest);
            }
        }
    }

    private CreateOrUpdateQuestsPanel(questId: QuestID, data: PlayerQuest) {
        if (this._questsPanels[questId] == undefined) {
            this.CreateQuestPanel(questId, data);
        }
        this.UpdateQuestPanel(questId, data);
    }

    private CreateQuestPanel(questId: QuestID, data: PlayerQuest) {
        const questPanel = $.CreatePanel("Panel", this._questTrackerRoot, "");

        questPanel.BLoadLayoutSnippet("QuestPanel");

        const questName = questPanel.FindChildTraverse("QuestName") as LabelPanel;

        if (questName != undefined) {
            questName.text = Quests.GetLocalizationForQuestName(questId);
        }

        const questCancelButton = questPanel.FindChildTraverse("QuestCancelButton");

        if (questCancelButton) {
            questCancelButton.SetPanelEvent("onactivate", () => {
                Game.EmitSound("Item.PickUpGemShop");
                GameEvents.SendCustomGameEventToServer("quests_quest_abandoned", {
                    quest_id: questId
                });
            });
        }

        const questActionsContainer = questPanel.FindChildTraverse("QuestActionsContainer");

        const questActionsPanels: QuestActionPanel[] = [];

        if (questActionsContainer != undefined) {
            data.actions.forEach((action) => {
                const questAction: QuestActionPanel = {
                    panel: $.CreatePanel("Panel", questActionsContainer, ""),
                    isCompleted: false,
                    SetProgress: () => {
                        $.Msg("Bubich slomal kastomku. Press F");
                    },
                    SetVisibility: (visible: boolean) => {
                        questAction.panel.SetHasClass("Visible", visible);
                    }
                };

                questAction.panel.BLoadLayoutSnippet("QuestAction");

                questAction.SetVisibility(action.requiredCompletedQuestActions.length == 0);

                const actionMaxProgress = action.maxProgress;

                const questActionLabel = questAction.panel.FindChildTraverse("QuestActionProgress") as LabelPanel;

                if (questActionLabel) {
                    questAction.SetProgress = (progress: number) => {
                        questActionLabel.text = Utils.FormatBigNumber(progress) + " / " + Utils.FormatBigNumber(actionMaxProgress);

                        if (IsPlayerQuestActionCompleted(progress, actionMaxProgress) && !questAction.isCompleted) {
                            questAction.panel.SetHasClass("Done", true);
                            Game.EmitSound("Quests.Action.Completed");
                            questAction.isCompleted = true;
                        }
                    };
                }

                const questActionDescription = questAction.panel.FindChildTraverse("QuestActionDescription") as LabelPanel;

                if (questActionDescription) {
                    questActionDescription.text = Quests.GetLocalizationForQuestAction(action);
                }

                questActionsPanels.push(questAction);
            });
        }

        this._questsPanels[questId] = {
            questId: questId,
            panel: questPanel,
            actions: questActionsPanels
        };
    }

    private UpdateQuestPanel(questId: QuestID, data: PlayerQuest) {
        const questPanel = this._questsPanels[questId];

        if (questPanel == undefined) {
            return;
        }
        data.actions.forEach((action, index) => {
            const actionPanel = questPanel.actions[index];
            actionPanel.SetProgress(action.currentProgress);
            if (action.requiredCompletedQuestActions.length > 0) {
                let isActionVisible = true;
                action.requiredCompletedQuestActions.forEach((requiredActionIndex) => {
                    const requiredAction = questPanel.actions[requiredActionIndex];
                    isActionVisible = isActionVisible && requiredAction.isCompleted;
                });
                actionPanel.SetVisibility(isActionVisible);
            }
        });
    }

    private FinishAndRemoveQuest(questId: QuestID, abandoned: number) {
        if (this._questsPanels[questId]) {
            this._questsPanels[questId]?.panel.DeleteAsync(0);
            delete this._questsPanels[questId];
            if (abandoned == 0) {
                Game.EmitSound("Quests.Completed");
            }
        }
    }
}

new QuestsTracker();
