import { QuestID, QuestsList } from "../common/data/quests";
import { QuestAction } from "../common/quests/actions/quest_action";
import { QuestActionToPlayerQuestAction, questNpcInteractionRange } from "../common/quests/common";

// eslint-disable-next-line no-var
var Quests = GameUI.CustomUIConfig().Quests;

class QuestsWindow {
    private _mainWindow: Panel = $("#MainWindow");
    private _questNameLabel: LabelPanel = $("#QuestName") as LabelPanel;
    private _questDescriptionLabel: LabelPanel = $("#QuestDescription") as LabelPanel;
    private _questActionsContainer: Panel = $("#QuestActionsContainer");
    private _questItemsRewardsContainer: Panel = $("#QuestItemRewardContainer");
    private _questGoldRewardLabel: LabelPanel = $("#QuestGoldRewardLabel") as LabelPanel;
    private _questGoldRewardContainer: Panel = $("#QuestGoldReward");
    private _questExperienceRewardContainer: Panel = $("#QuestExperienceReward");
    private _questExperienceRewardLabel: LabelPanel = $("#QuestExperienceRewardLabel") as LabelPanel;
    private _questItemRewardContainer: Panel = $("#QuestItemRewardContainer");
    private _currentAvailableQuests: QuestID[] = [];
    private _currentDisplayedQuestId?: QuestID;
    private _lastInteractedQuestNpc?: EntityIndex;
    private _rightArrowButton: Panel = $("#RightArrow");
    private _leftArrowButton: Panel = $("#LeftArrow");
    private _currentQuestArrowIndex = 0;

    constructor() {
        GameEvents.Subscribe("quests_quest_npc_selected", (event) => this.OnPlayerInteractedWithNpc(event));
        this.SetupCloseWindowButton();
        this.SetupQuestAcceptButton();
        this.SetupArrowButtons();
    }

    private OnPlayerInteractedWithNpc(event: QuestNpcSelectedEvent) {
        const selectedUnitName = Entities.GetUnitName(event.entity_index);
        const npcsWithQuests = Quests.GetNpcsWithAvailableQuests();
        this._currentAvailableQuests = npcsWithQuests[selectedUnitName] ?? [];
        this.FillWindowForQuests(this._currentAvailableQuests[0]);

        this._lastInteractedQuestNpc = event.entity_index;
    }

    private FillWindowForQuests(questId?: QuestID) {
        if (questId == undefined) {
            return;
        }

        this._mainWindow.SetHasClass("ArrowsHidden", this._currentAvailableQuests.length <= 1);

        const quest = QuestsList[questId];

        this._questNameLabel.text = Quests.GetLocalizationForQuestName(questId);
        this._questDescriptionLabel.text = Quests.GetLocalizationForQuestDescription(questId);
        this._questActionsContainer.RemoveAndDeleteChildren();
        for (const [_, action] of Object.entries(quest.actions)) {
            this.CreateQuestActionPanel(action);
        }

        if (quest.rewards != undefined) {
            if (quest.rewards.gold != undefined) {
                this._questGoldRewardContainer.SetHasClass("RewardDisabled", false);
                this._questGoldRewardLabel.text = quest.rewards.gold.toString();
            }

            if (quest.rewards.heroExperience != undefined) {
                this._questExperienceRewardContainer.SetHasClass("RewardDisabled", false);
                this._questExperienceRewardLabel.text = quest.rewards.heroExperience.toString();
            }

            this._questItemRewardContainer.RemoveAndDeleteChildren();

            if (quest.rewards.items != undefined) {
                this._questItemsRewardsContainer.SetHasClass("RewardDisabled", false);
                for (const itemName of quest.rewards.items) {
                    this.CreateItemRewardPanel(itemName);
                }
            }
        } else {
            this._questGoldRewardContainer.SetHasClass("RewardDisabled", true);
            this._questItemsRewardsContainer.SetHasClass("RewardDisabled", true);
            this._questExperienceRewardContainer.SetHasClass("RewardDisabled", true);
        }
        this._currentDisplayedQuestId = questId;
        this.StartCheckingDistanceToNpc();
        this.ShowWindow(true);
    }

    private CreateQuestActionPanel(action: QuestAction) {
        const panel = $.CreatePanel("Panel", this._questActionsContainer, "");
        panel.BLoadLayoutSnippet("QuestAction");

        const convertedAction = QuestActionToPlayerQuestAction(action);

        const questActionDescriptionLabel = panel.FindChildTraverse("QuestActionDescription") as LabelPanel;
        if (questActionDescriptionLabel != null) {
            questActionDescriptionLabel.text = Quests.GetLocalizationForQuestAction(convertedAction);
        }

        const questActionProgressLabel = panel.FindChildTraverse("QuestActionProgress") as LabelPanel;
        if (questActionProgressLabel != null) {
            questActionProgressLabel.text = "0 / " + convertedAction.maxProgress;
        }
    }

    private CreateItemRewardPanel(itemName: string) {
        const panel = $.CreatePanel("DOTAItemImage", this._questItemRewardContainer, "") as ItemImage;

        if (panel != null) {
            panel.SetHasClass("QuestItemReward", true);
            panel.itemname = itemName;
        }
    }

    private StartCheckingDistanceToNpc() {
        if (this._lastInteractedQuestNpc == undefined || this.IsWindowOpened() == false) {
            return;
        }
        if (!this.IsDistanceToQuestNpcValid(this._lastInteractedQuestNpc)) {
            this.ShowWindow(false);
            return;
        }

        $.Schedule(0.25, () => this.StartCheckingDistanceToNpc());
    }

    private IsDistanceToQuestNpcValid(questNpc: EntityIndex) {
        const playerHero = Players.GetPlayerHeroEntityIndex(Players.GetLocalPlayer());
        if (playerHero < 0 || questNpc < 0) {
            return false;
        }
        return Game.Length2D(Entities.GetAbsOrigin(playerHero), Entities.GetAbsOrigin(questNpc)) < questNpcInteractionRange;
    }

    private ShowWindow(state: boolean) {
        this._mainWindow.SetHasClass("Visible", state);
        if (state == false) {
            this._lastInteractedQuestNpc = undefined;
        }
    }

    private IsWindowOpened() {
        return this._mainWindow.BHasClass("Visible");
    }

    private SetupCloseWindowButton() {
        this._mainWindow.FindChildTraverse("CancelButton")?.SetPanelEvent("onactivate", () => {
            this.ShowWindow(false);
        });
    }

    private SetupQuestAcceptButton() {
        this._mainWindow.FindChildTraverse("QuestAcceptButton")?.SetPanelEvent("onactivate", () => {
            if (this._currentDisplayedQuestId == undefined) {
                return;
            }
            GameEvents.SendCustomGameEventToServer("quests_quest_accepted", {
                quest_id: this._currentDisplayedQuestId
            });
            this.RemoveQuestFromAvailable(this._currentDisplayedQuestId);
            this._currentDisplayedQuestId = undefined;
            if (this._currentAvailableQuests.length == 0) {
                this.ShowWindow(false);
            } else {
                this.FillWindowForQuests(this._currentAvailableQuests[0]);
            }
        });
    }

    private ChangeSelectedQuest(isForwardDirection: boolean) {
        if (this._currentAvailableQuests.length == 0) {
            this.ShowWindow(false);
            return;
        }

        if (isForwardDirection) {
            this._currentQuestArrowIndex++;
            if (this._currentQuestArrowIndex >= this._currentAvailableQuests.length) {
                this._currentQuestArrowIndex = 0;
            }
        } else {
            this._currentQuestArrowIndex--;
            if (this._currentQuestArrowIndex < 0) {
                this._currentQuestArrowIndex = this._currentAvailableQuests.length - 1;
            }
        }

        this.FillWindowForQuests(this._currentAvailableQuests[this._currentQuestArrowIndex]);
    }

    private SetupArrowButtons() {
        this._leftArrowButton.SetPanelEvent("onactivate", () => {
            this.ChangeSelectedQuest(false);
        });
        this._rightArrowButton.SetPanelEvent("onactivate", () => {
            this.ChangeSelectedQuest(true);
        });
    }

    private RemoveQuestFromAvailable(questId: QuestID) {
        const index = this._currentAvailableQuests.indexOf(questId);
        if (index > -1) {
            this._currentAvailableQuests.splice(index, 1);
        }
    }
}

new QuestsWindow();
