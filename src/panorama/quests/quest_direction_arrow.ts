import { QuestID } from "../common/data/quests";
import { QuestDirectionData, QuestDirectionType } from "../common/quests/common";

// eslint-disable-next-line no-var
var Quests = GameUI.CustomUIConfig().Quests;
// eslint-disable-next-line no-var
var DotaHUD = GameUI.CustomUIConfig().DotaHUD;

class QuestDirectionArrow {
    private _questId!: QuestID;
    private _arrowPanel: Panel | undefined;
    private _rootPanel: Panel;
    private _type!: QuestDirectionType;

    private CalculateArrowPosition() {
        const wp = this._rootPanel.WorldPanel;
        if (wp) {
            if (this._questId == undefined) {
                const data = wp.GetData<QuestDirectionData>();
                this._questId = data.questId;
                this._type = data.type;
                if (this._type == QuestDirectionType.ARROW) {
                    this._arrowPanel = $("#QuestDirectionArrow");
                    this.SetupOnEdgePanel(data);
                } else {
                    this.SetupOnScreenPanel(data);
                }
            }
            const isOnEdge = wp.IsOnEdge();
            if (isOnEdge) {
                if (this._arrowPanel != undefined) {
                    const sw = DotaHUD.GetScreenWidth();
                    const sh = DotaHUD.GetScreenHeight();
                    const ang =
                        (-1 * Math.atan2(this._rootPanel.actualxoffset - sw / 2, this._rootPanel.actualyoffset - sh / 2) * 180) / Math.PI;
                    this._arrowPanel.style.transform = "rotateZ(" + ang.toFixed(1) + "deg);";
                }
            }
            this._rootPanel.SetHasClass("OnEdge", isOnEdge);
        }
        $.Schedule(0.25, () => this.CalculateArrowPosition());
    }

    private SetupOnEdgePanel(data: QuestDirectionData) {
        const edgeTooltip = $("#EdgeQuestTooltip") as LabelPanel;
        edgeTooltip.text = Quests.GetLocalizationForQuestAction(data.action);
    }

    private SetupOnScreenPanel(data: QuestDirectionData) {
        const questNameLabel = $("#QuestName") as LabelPanel;
        questNameLabel.text = Quests.GetLocalizationForQuestName(this._questId);
        const questActionDescription = $("#QuestActionDescription") as LabelPanel;
        questActionDescription.text = Quests.GetLocalizationForQuestAction(data.action);
    }

    constructor() {
        this._rootPanel = $.GetContextPanel();
        this.CalculateArrowPosition();
    }
}

new QuestDirectionArrow();
