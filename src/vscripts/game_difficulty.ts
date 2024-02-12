import { Difficulties } from "./common/data/game_difficulty";
import { HTTPRequests } from "./libraries/HTTP_requests";
import { modifier_game_difficulty_stunlock_aura } from "./modifiers/modifier_game_difficulty_stunlock_aura";

export class GameDifficulty {
    public static _difficultyScalings: { [key: number]: any };
    public static _isDifficultySelected: boolean;
    public static _difficulty: number;
    public static _stunlockGuy: CDOTA_BaseNPC | undefined;
    static modifiers: string[] = [];
    constructor() {
        GameDifficulty.Initialize();
    }

    public static Initialize() {
        //Не забывайте менять это значение также в панораме в game_difficulty.js
        GameDifficulty._difficulty = 1;
        GameDifficulty.ParseSettings();
        GameDifficulty.RegisterEventListeners();
        GameDifficulty.RegisterPanoramaListeners();
        GameDifficulty.SpawnStunlockGuy();
        CustomEvents.RegisterEventHandler(CustomEvent.CUSTOM_EVENT_ON_RELOAD_KV, () => {
            GameDifficulty.ParseSettings();
        });
        CustomEvents.RegisterEventHandler(CustomEvent.CUSTOM_EVENT_ON_DIFFICULTY_SELECTED, () => {
            GameDifficulty.RemoveStunlockGuy();
            GameDifficulty.OnDifficultySelected(true);
        });
    }
    static OnDifficultySelected(isFirstSpawn: boolean) {
        if (isFirstSpawn == true) {
            const array = Object.entries(GameSettings.GetSettingValueAsTable("heroes_difficulty_debuff"));
            for (let countCycles = 1; countCycles <= GameDifficulty.GetCurrentDifficultyCountDebuffsForHero(); countCycles++) {
                GameDifficulty.modifiers.push(array.splice(0, 1)[0][1] as string);
            }
        }
        const heroes = HeroList.GetAllHeroes();
        if (heroes.length == 0) {
            Timers.CreateTimer(0.25, () => {
                GameDifficulty.OnDifficultySelected(false);
            });
            return;
        }

        heroes.forEach((hero) => {
            for (const modifierName of GameDifficulty.modifiers) {
                hero.AddNewModifier(hero, undefined, modifierName, {
                    duration: -1
                });
            }
        });
    }

    public static ParseSettings() {
        GameDifficulty._difficultyScalings = {};

        GameDifficulty._difficultyScalings = Difficulties.difficulties;
    }

    public static RegisterEventListeners() {
        ListenToGameEvent("game_rules_state_change", () => GameDifficulty.OnGameRulesStateChange(), undefined);
    }

    public static RegisterPanoramaListeners() {
        CustomGameEventManager.RegisterListener("game_difficulty_set_difficulty", (_, event) =>
            GameDifficulty.OnHostSelectedGameDifficulty(event)
        );
    }

    public static OnGameRulesStateChange() {
        const newState = GameRules.State_Get();
        if (newState == GameState.PRE_GAME) {
            PlayerTables.CreateTable("game_difficulty", {}, true);
            GameDifficulty.SetIsDifficultySelected(false);
        }
        if (newState == GameState.GAME_IN_PROGRESS && GameDifficulty.IsDifficultySelected() == false) {
            GameDifficulty.SetIsDifficultySelected(true);
        }
    }

    public static OnHostSelectedGameDifficulty(kv: any) {
        const playerID = kv.PlayerID as PlayerID;
        if (!playerID) {
            return;
        }

        const player = PlayerResource.GetPlayer(playerID);
        if (!player) {
            return;
        }

        if (GameRules.PlayerHasCustomGameHostPrivileges(player) == false) {
            return;
        }
        if (GameDifficulty.IsDifficultyCanBeChanged() == false) {
            return;
        }
        if (GameDifficulty.IsDifficultySelected() == true) {
            return;
        }

        GameDifficulty.SetDifficulty(kv.difficulty);
        GameDifficulty.SetIsDifficultySelected(true);
    }

    public static SetIsDifficultySelected(state: boolean) {
        GameDifficulty._isDifficultySelected = state;

        PlayerTables.SetTableValue("game_difficulty", "is_selected", state);

        if (state == true) {
            CustomEvents.RunEventByName(CustomEvent.CUSTOM_EVENT_ON_DIFFICULTY_SELECTED, {});
        }
    }

    public static IsDifficultySelected(): boolean {
        if (GameDifficulty._isDifficultySelected != undefined) {
            return GameDifficulty._isDifficultySelected;
        }
        return false;
    }

    public static GetDifficulty(): number {
        return GameDifficulty._difficulty;
    }

    public static SetDifficulty(value: number) {
        GameDifficulty._difficulty = value;

        PlayerTables.SetTableValue("game_difficulty", "selected_difficulty", value);

        CustomEvents.RunEventByName(CustomEvent.CUSTOM_EVENT_ON_DIFFICULTY_CHANGED, {});
    }

    public static IsDifficultyCanBeChanged(): boolean {
        return GameRules.GetDOTATime(false, true) < 0;
    }

    public static SpawnStunlockGuy(): void {
        const heroes = HeroList.GetAllHeroes();

        if (heroes.length == 0) {
            Timers.CreateTimer(0.25, () => {
                GameDifficulty.SpawnStunlockGuy();
            });
            return;
        }
        GameDifficulty._stunlockGuy = CreateModifierThinker(
            heroes[1],
            undefined,
            modifier_game_difficulty_stunlock_aura.name,
            {
                duration: -1
            },
            Vector(0, 0, 0),
            DotaTeam.GOODGUYS,
            false
        );
    }

    public static RemoveStunlockGuy() {
        Timers.CreateTimer(0.05, () => {
            if (GameDifficulty._stunlockGuy != undefined) {
                UTIL_Remove(GameDifficulty._stunlockGuy);
                GameDifficulty._stunlockGuy = undefined;
            } else {
                return 0.05;
            }
        });
    }

    public static GetCurrentDifficultyMaxHealthRatio(): number {
        const difficulty = GameDifficulty.GetDifficulty();
        return GameDifficulty._difficultyScalings[difficulty]["max_health_bonus_pct"] / 100 || 1;
    }

    public static GetCurrentDifficultyAttackDamageRatio(): number {
        const difficulty = GameDifficulty.GetDifficulty();
        return GameDifficulty._difficultyScalings[difficulty]["attack_damage_bonus_pct"] / 100 || 1;
    }

    public static GetCurrentDifficultySpellAmplificationRatio(): number {
        const difficulty = GameDifficulty.GetDifficulty();
        return GameDifficulty._difficultyScalings[difficulty]["spell_amp_bonus_pct"] / 100 || 1;
    }

    public static GetCurrentDifficultyGoldRatio(): number {
        const difficulty = GameDifficulty.GetDifficulty();
        return GameDifficulty._difficultyScalings[difficulty]["bonus_gold_pct"] / 100 || 1;
    }

    public static GetCurrentDifficultyXPRatio(): number {
        const difficulty = GameDifficulty.GetDifficulty();
        return GameDifficulty._difficultyScalings[difficulty]["bonus_XP_pct"] / 100 || 1;
    }

    public static GetCurrentDifficultyBossesRespawnTime(): number {
        const difficulty = GameDifficulty.GetDifficulty();
        return GameDifficulty._difficultyScalings[difficulty]["spawn_farm_bosses_respawn_time"] || 1;
    }

    public static GetCurrentDifficultyTowerUpgradeTime(): number {
        const difficulty = GameDifficulty.GetDifficulty();
        return GameDifficulty._difficultyScalings[difficulty]["tower_upgrade_time"] || 1;
    }

    public static GetCurrentDifficultyCountDebuffsForHero(): number {
        const difficulty = GameDifficulty.GetDifficulty();
        return GameDifficulty._difficultyScalings[difficulty]["count_debuffs_for_hero"] || 1;
    }

    public static UpgradeUnitStats(unit: CDOTA_BaseNPC) {
        const maxHealthRatio = GameDifficulty.GetCurrentDifficultyMaxHealthRatio();
        const attackDamageRatio = GameDifficulty.GetCurrentDifficultyAttackDamageRatio();
        const spellAmpRatio = GameDifficulty.GetCurrentDifficultySpellAmplificationRatio();
        const goldRatio = GameDifficulty.GetCurrentDifficultyGoldRatio();
        const xpRatio = GameDifficulty.GetCurrentDifficultyXPRatio();

        const newMaxHealth = unit.GetMaxHealth() * maxHealthRatio;
        const newAttackDamageMin = unit.GetBaseDamageMin() * attackDamageRatio;
        const newAttackDamageMax = unit.GetBaseDamageMax() * attackDamageRatio;
        const newSpellAmp = unit.GetBaseDamageMin();
        const newBonusGoldMin = unit.GetMinimumGoldBounty() * goldRatio;
        const newBonusGoldMax = unit.GetMaximumGoldBounty() * goldRatio;
        const newBonusXP = unit.GetDeathXP() * xpRatio;

        unit.SetBaseMaxHealth(newMaxHealth);
        unit.SetMaxHealth(newMaxHealth);
        unit.SetHealth(newMaxHealth);
        unit.SetBaseDamageMin(newAttackDamageMin);
        unit.SetBaseDamageMax(newAttackDamageMax);
        unit.SetMinimumGoldBounty(newBonusGoldMin);
        unit.SetMaximumGoldBounty(newBonusGoldMax);
        unit.SetDeathXP(newBonusXP);

        unit.CalculateGenericBonuses();
    }

    public static BuffUnitStats(unit: CDOTA_BaseNPC, multiplier: number) {
        const newMaxHealth = unit.GetMaxHealth() * multiplier;
        const newAttackDamageMin = unit.GetBaseDamageMin() * multiplier;
        const newAttackDamageMax = unit.GetBaseDamageMax() * multiplier;
        const newSpellAmp = unit.GetBaseDamageMin();
        const newBonusGoldMin = unit.GetMinimumGoldBounty() * multiplier;
        const newBonusGoldMax = unit.GetMaximumGoldBounty() * multiplier;
        const newBonusXP = unit.GetDeathXP() * multiplier;

        unit.SetBaseMaxHealth(newMaxHealth);
        unit.SetMaxHealth(newMaxHealth);
        unit.SetHealth(newMaxHealth);
        unit.SetBaseDamageMin(newAttackDamageMin);
        unit.SetBaseDamageMax(newAttackDamageMax);
        unit.SetMinimumGoldBounty(newBonusGoldMin);
        unit.SetMaximumGoldBounty(newBonusGoldMax);
        unit.SetDeathXP(newBonusXP);

        unit.CalculateGenericBonuses();
    }

    public static UpgradeLineUnitStats(unit: CDOTA_BaseNPC, currentShift: number) {
        const maxHealthRatio = GameDifficulty.GetCurrentDifficultyMaxHealthRatio();
        const attackDamageRatio = GameDifficulty.GetCurrentDifficultyAttackDamageRatio();

        const newMaxHealth = unit.GetMaxHealth() * (currentShift - 1) * 1.7 * maxHealthRatio;
        const newAttackDamageMin = unit.GetBaseDamageMin() * (currentShift - 1) * 1.7 * attackDamageRatio;
        const newAttackDamageMax = unit.GetBaseDamageMax() * (currentShift - 1) * 1.7 * attackDamageRatio;
        const newArmor = unit.GetPhysicalArmorBaseValue() * (currentShift - 1) * 1.7;
        const newMaxMana = unit.GetMana() * (currentShift - 1) * 1.7;

        //unit:SetBaseMagicalResistanceValue(newMagicalResistance)
        unit.SetPhysicalArmorBaseValue(newArmor);
        unit.SetBaseMaxHealth(newMaxHealth);
        unit.SetMaxHealth(newMaxHealth);
        unit.SetHealth(newMaxHealth);
        unit.SetMaxMana(newMaxMana);
        unit.SetMana(newMaxMana);
        unit.SetBaseDamageMin(newAttackDamageMin);
        unit.SetBaseDamageMax(newAttackDamageMax);

        unit.CalculateGenericBonuses();
    }
}

if (IsServer()) {
    new GameDifficulty();
}
