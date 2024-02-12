import { BaseModifier } from "../libraries/dota_ts_adapter";
import { modifier_hero_stats } from "../modifiers/modifier_hero_stats";
import { HeroGoldFix } from "./hero_gold_fix";
import { HeroStatsTable, HeroStatsTableDisplay } from "../common/data/hero_stats";

/* eslint-disable @typescript-eslint/no-explicit-any */
export class HeroStats {
    isCalculationPoints = false;
    constructor() {
        this.Initialize();
    }

    private Initialize() {
        ListenToGameEvent("game_rules_state_change", () => this.OnGameRulesStateChange(), undefined);
        ListenToGameEvent("dota_player_gained_level", (event) => this.OnPlayerGainedLevel(event), undefined);
        CustomGameEventManager.RegisterListener("custom_hero_stats_update_panel", (_, event) =>
            this.CreateOrUpdateHeroStatsTableDisplay(event.PlayerID)
        );
        CustomEvents.RegisterEventHandler(CustomEvent.CUSTOM_EVENT_ON_PRE_PLAYER_GAIN_GOLD, (event) => {
            Timers.CreateTimer(0.05, () => {
                this.OnPlayerGainedGold(event as ModifyGoldFilterEvent);
            });
        });
        CustomGameEventManager.RegisterListener("custom_hero_stats_autofill_button_pressed", (_, event) =>
            this.OnAutofillButtonPressed(event.PlayerID)
        );
        CustomGameEventManager.RegisterListener("custom_hero_stats_change_stat", (_, event) => this.ChangeStat(event));
        CustomGameEventManager.RegisterListener("hero_gold_fix_update_table", (_, event) => {
            const data = {
                player_id_const: event.PlayerID,
                gold: 0,
                reliable: 1,
                reason_const: ModifyGoldReason.GAME_TICK
            } as ModifyGoldFilterEvent;
            this.OnPlayerGainedGold(data);
        });
    }

    private OnGameRulesStateChange() {
        const newState = GameRules.State_Get();

        if (newState == GameState.PRE_GAME) {
            CustomEvents.RegisterEventHandler(CustomEvent.CUSTOM_EVENT_ON_ORDER, (data) => this.OnOrder(data as ExecuteOrderFilterEvent));
        }
    }

    private OnOrder(kv: ExecuteOrderFilterEvent) {
        if (kv.order_type == undefined) {
            return;
        }

        for (const [_, v] of Object.entries(kv.units)) {
            const target = EntIndexToHScript(v) as CDOTA_BaseNPC;
            if (target == undefined) {
                return;
            }
            for (let index = 1; index < 5; index++) {
                if (
                    target.GetUnitName() == "npc_dota_lone_druid_bear" + index &&
                    !(kv.order_type == UnitOrder.ATTACK_TARGET || kv.order_type == UnitOrder.ATTACK_MOVE)
                ) {
                    this.UpgardeItems(target);
                }
            }
        }

        if (kv.order_type == UnitOrder.PURCHASE_ITEM || kv.order_type == UnitOrder.MOVE_ITEM) {
            const hero = PlayerResource.GetSelectedHeroEntity(kv.issuer_player_id_const);
            if (hero == undefined) {
                return;
            }
            this.UpgardeItems(hero);
        }
    }

    private OnPlayerGainedLevel(kv: DotaPlayerGainedLevelEvent) {
        const hero = PlayerResource.GetSelectedHeroEntity(kv.player_id);

        if (hero == undefined) {
            return;
        }
        HeroStatsTableDisplay.Player[kv.player_id].CountPoint += 0.1;
    }

    private OnAutofillButtonPressed(PlayerID: PlayerID) {
        if (PlayerID == undefined) {
            return;
        }

        HeroStatsTableDisplay.Player[PlayerID].AutofillButtonIsEnabled = !HeroStatsTableDisplay.Player[PlayerID].AutofillButtonIsEnabled;
        const event = {
            player_id_const: PlayerID,
            gold: 0,
            reliable: 1,
            reason_const: ModifyGoldReason.GAME_TICK
        } as ModifyGoldFilterEvent;
        this.OnPlayerGainedGold(event);
    }

    private OnPlayerGainedGold(event: ModifyGoldFilterEvent) {
        const PlayerID = event.player_id_const;

        if (event.reason_const != ModifyGoldReason.GAME_TICK) {
            return;
        }

        if (HeroStatsTableDisplay.Player[PlayerID].AutofillButtonIsEnabled == false) {
            return;
        }
        const hero = PlayerResource.GetSelectedHeroEntity(PlayerID) as CDOTA_BaseNPC_Hero;
        const player = PlayerResource.GetPlayer(PlayerID);
        if (hero == undefined || player == undefined) {
            return;
        }

        if (this.isCalculationPoints == false) {
            Timers.CreateTimer(0, () => {
                this.isCalculationPoints = true;
                if (HeroGoldFix.HeroGoldTable.Player[PlayerID].CurrentGold >= HeroStatsTableDisplay.Player[PlayerID].CostPoint * 1.2) {
                    hero.SpendGold(HeroStatsTableDisplay.Player[PlayerID].CostPoint, ModifyGoldReason.CHEAT_COMMAND);
                    HeroStatsTableDisplay.Player[PlayerID].CountPoint++;
                    if (HeroStatsTableDisplay.Player[PlayerID].MaxCostPoint > HeroStatsTableDisplay.Player[PlayerID].CostPoint) {
                        HeroStatsTableDisplay.Player[PlayerID].CostPoint += HeroStatsTableDisplay.Player[PlayerID].IncreasePricPerPoint;
                    }
                    return 0.05;
                } else {
                    this.isCalculationPoints = false;
                }
            });
        }

        CustomGameEventManager.Send_ServerToPlayer(player, "custom_hero_stats_update_progress_bar", HeroStatsTableDisplay);
    }

    private CreateOrUpdateHeroStatsTableDisplay(PlayerID: PlayerID) {
        if (PlayerID == undefined) {
            return;
        }
        const hero = PlayerResource.GetSelectedHeroEntity(PlayerID);
        const player = PlayerResource.GetPlayer(PlayerID);
        if (hero == undefined || player == undefined) {
            return;
        }

        if (!IsServer) {
            return;
        }
        HeroStatsTableDisplay.HeroName = hero.GetUnitName();
        const bonusMagicalResistance =
            GameSettings.GetSettingValueAsNumber("dota_attribute_magic_resistance_per_strength") * hero.GetStrength();
        const bonusMagicalResistanceMax = GameSettings.GetSettingValueAsNumber("dota_attribute_magic_resistance_per_strength_max");
        const magicalResistance =
            25 +
            math.min(bonusMagicalResistance, bonusMagicalResistanceMax) /
                (1 + (math.min(bonusMagicalResistance, bonusMagicalResistanceMax) - 1) / 100);
        HeroStatsTableDisplay.PrimaryAttribute[0]["StatCount"] = hero.GetStrength();
        HeroStatsTableDisplay.PrimaryAttribute[1]["StatCount"] = hero.GetAgility();
        HeroStatsTableDisplay.PrimaryAttribute[2]["StatCount"] = hero.GetIntellect();

        HeroStatsTableDisplay.AttackAttribute[0]["StatCount"] = hero.GetAverageTrueAttackDamage(hero);
        HeroStatsTableDisplay.AttackAttribute[1]["StatCount"] = hero.GetDisplayAttackSpeed();
        HeroStatsTableDisplay.AttackAttribute[2]["StatCount"] = hero.GetBaseAttackRange();
        HeroStatsTableDisplay.AttackAttribute[3]["StatCount"] = hero.GetIdealSpeed();
        HeroStatsTableDisplay.AttackAttribute[4]["StatCount"] = hero.GetSpellAmplification(false) * 100;

        HeroStatsTableDisplay.DefenseAttribute[0]["StatCount"] = hero.GetPhysicalArmorValue(false);
        HeroStatsTableDisplay.DefenseAttribute[1]["StatCount"] = magicalResistance;
        HeroStatsTableDisplay.DefenseAttribute[2]["StatCount"] = hero.GetEvasion() * 100;
        HeroStatsTableDisplay.DefenseAttribute[3]["StatCount"] = hero.GetHealthRegen();
        HeroStatsTableDisplay.DefenseAttribute[4]["StatCount"] = hero.GetManaRegen();

        HeroStatsTableDisplay.OtherStats[0]["StatCount"] = this.GetOtherStatByName(PlayerID, "item_level");
        HeroStatsTableDisplay.OtherStats[1]["StatCount"] = this.GetOtherStatByName(PlayerID, "bonus_gold");
        HeroStatsTableDisplay.OtherStats[2]["StatCount"] = this.GetOtherStatByName(PlayerID, "bonus_exp");
        HeroStatsTableDisplay.OtherStats[3]["StatCount"] = this.GetOtherStatByName(PlayerID, "max_movespeed");
        HeroStatsTableDisplay.OtherStats[3]["StatCount"] = this.GetOtherStatByName(PlayerID, "max_attackspeed");

        CustomGameEventManager.Send_ServerToPlayer(player, "custom_hero_stats_create_or_update", HeroStatsTableDisplay);
    }

    private GetOtherStatByName(PlayerID: PlayerID, statName: string): number {
        if (HeroStatsTable[PlayerID][statName] != undefined) {
            return HeroStatsTable[PlayerID][statName]["StatCount"];
        }
        return 0;
    }

    private ChangeStat(kv: CustomHeroStatsChangeStat) {
        if (kv.PlayerID == undefined) {
            return;
        }

        if (HeroStatsTable[kv.PlayerID][kv.StatName]["StatCount"] < kv.StatLimit) {
            if (HeroStatsTable[kv.PlayerID][kv.StatName]["StatCount"] + kv.StatPerPoint * math.floor(kv.CountPoint) > kv.StatLimit) {
                HeroStatsTableDisplay["Player"][kv.PlayerID].CountPoint -=
                    (kv.StatLimit - HeroStatsTable[kv.PlayerID][kv.StatName]["StatCount"]) / kv.StatPerPoint;
                HeroStatsTable[kv.PlayerID][kv.StatName]["StatCount"] = kv.StatLimit;
            } else {
                HeroStatsTable[kv.PlayerID][kv.StatName]["StatCount"] += kv.StatPerPoint * math.floor(kv.CountPoint);
                HeroStatsTableDisplay["Player"][kv.PlayerID].CountPoint -= math.floor(kv.CountPoint);
            }
        }

        const hero = PlayerResource.GetSelectedHeroEntity(kv.PlayerID);
        if (hero == undefined) {
            return;
        }

        if (kv.StatName == "item_level") {
            this.UpgardeItems(hero);
        }

        const modifier = hero.FindModifierByName(modifier_hero_stats.name) as BaseModifier;
        if (modifier != undefined) {
            modifier.OnRefresh({});
        }
    }

    private UpgardeItems(hero: CDOTA_BaseNPC): void {
        Timers.CreateTimer(0.5, () => {
            for (let indexSlot = 0; indexSlot <= 5; indexSlot++) {
                const item = hero.GetItemInSlot(indexSlot);
                if (item != undefined && item.IsModifiable()) {
                    if (item.IsModifiable() && HeroStatsTable[hero.GetPlayerOwnerID()].item_level != undefined) {
                        item.SetLevel(HeroStatsTable[hero.GetPlayerOwnerID()].item_level["StatCount"]);
                    }
                }
            }
        });
    }
}

if (IsServer()) {
    new HeroStats();
}
