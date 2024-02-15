import { reloadable } from "./libraries/tstl-utils";
import { IsDOTA_BaseNPC_Hero, IsDOTA_BaseNPC } from "./libraries/dota_ts_adapter";
import { HTTPRequests } from "./libraries/HTTP_requests";

import "./game_settings";
import "./libraries/require_addon_game_mode";
import "./override/require_addon_game_mode";
import "./ui/require";
import "./modifiers/require";
import "./tests/require";
import { Filters } from "./filters/require";

declare global {
    interface CDOTAGameRules {
        Addon: GameMode;
    }
}

interface GameModePlayer extends CDOTA_BaseNPC_Hero {
    _onPlayerHeroChangedFirstTime: boolean | undefined;
}

@reloadable
export class GameMode {
    modifiers: string[] = [];
    public static Precache(this: void, context: CScriptPrecacheContext) {
        PrecacheResource(PrecacheType.SOUNDFILE, "soundevents/custom/game_sounds_bosses.vsndevts", context);
        PrecacheResource(PrecacheType.SOUNDFILE, "soundevents/custom/game_sounds_items.vsndevts", context);
        PrecacheResource(PrecacheType.SOUNDFILE, "soundevents/custom/game_sounds_debug_panel.vsndevts", context);
        PrecacheResource(PrecacheType.SOUNDFILE, "soundevents/custom/heroes/base/game_sounds_base.vsndevts", context);

        CustomEvents.RunEventByName(CustomEvent.CUSTOM_EVENT_ON_ADDON_PRECACHE, {
            context: context
        });
    }

    public static Activate(this: void) {
        GameRules.Addon = new GameMode();
    }

    constructor() {
        this.Initialize();
    }

    private Initialize() {
        const gme = GameRules.GetGameModeEntity();
        GameSettings.LoadSettings(gme);
        Filters.Init(gme);
        this.ListenToGameEvents();
    }

    private ListenToGameEvents() {
        ListenToGameEvent("game_rules_state_change", () => this.OnGameRulesStateChange(), undefined);
        ListenToGameEvent("dota_player_gained_level", (event) => this.OnPlayerGainedLevel(event), undefined);
        ListenToGameEvent("dota_player_learned_ability", (event) => this.OnPlayerLearnedAbility(event), undefined);
        ListenToGameEvent("dota_player_pick_hero", (event) => this.OnPlayerPickedHero(event), undefined);
        ListenToGameEvent("npc_spawned", (event) => this.OnNPCSpawned(event), undefined);
        CustomEvents.RegisterEventHandler(CustomEvent.CUSTOM_EVENT_ON_PLAYER_HERO_CHANGED, (data) => {
            this.OnPlayerHeroChanged(data as CustomEventPlayerHeroChangedEvent);
        });
    }

    private OnPlayerHeroChanged(data: CustomEventPlayerHeroChangedEvent) {
        const hero = data.hero;

        if (!IsDOTA_BaseNPC_Hero(hero)) {
            return;
        }

        if ((hero as GameModePlayer)._onPlayerHeroChangedFirstTime) {
            return;
        }

        const heroStartingLevel = GameSettings.GetSettingValueAsNumber("hero_start_level");

        for (let i = 1; i < heroStartingLevel; i++) {
            hero.HeroLevelUp(false);
        }
        for (const [_, abilityName] of GameSettings.GetSettingValueAsTable("heroes_first_spawn_abilities_to_add")) {
            hero.AddAbility(abilityName);
        }

        for (const [_, modifierName] of GameSettings.GetSettingValueAsTable("heroes_first_spawn_modifiers_to_add")) {
            hero.AddNewModifier(hero, undefined, modifierName, {
                duration: -1
            });
        }

        const SteamID = tostring(PlayerResource.GetSteamID(hero.GetPlayerOwnerID()));
        HTTPRequests.CheckThePlayerDonate(SteamID, hero);

        (hero as GameModePlayer)._onPlayerHeroChangedFirstTime = true;
    }

    private OnNPCSpawned(kv: NpcSpawnedEvent) {
        const npc = EntIndexToHScript(kv.entindex);

        if (!IsDOTA_BaseNPC(npc)) {
            return;
        }

        if (!(npc.IsTempestDouble() || npc.IsIllusion())) {
            return;
        }

        const owner = npc.GetPlayerOwner().GetAssignedHero();
        npc.SetTeam(owner.GetTeam());

        for (const modifier of owner.FindAllModifiers()) {
            const stacks = modifier.GetStackCount();

            if (stacks > 0) {
                const addedModifier = npc.AddNewModifier(owner, undefined, modifier.GetName(), {});

                if (addedModifier != undefined) {
                    addedModifier.SetStackCount(stacks);
                }
            }
        }
    }

    private OnPlayerPickedHero(kv: DotaPlayerPickHeroEvent) {
        const hero = EntIndexToHScript(kv.heroindex);

        if (hero == undefined || !IsDOTA_BaseNPC_Hero(hero)) {
            return;
        }

        CustomEvents.RunEventByName(CustomEvent.CUSTOM_EVENT_ON_PLAYER_HERO_CHANGED, {
            hero: hero
        });
    }

    private OnPlayerLearnedAbility(kv: DotaPlayerLearnedAbilityEvent) {
        const hero = PlayerResource.GetSelectedHeroEntity(kv.PlayerID);

        if (hero == undefined) {
            return;
        }

        // 7.30 mess fix?
        hero.SetSpendedAbilityPoints(hero.GetSpendedAbilityPoints() + 1);
    }

    private OnPlayerGainedLevel(kv: DotaPlayerGainedLevelEvent) {
        const hero = PlayerResource.GetSelectedHeroEntity(kv.player_id);

        if (hero == undefined) {
            return;
        }

        let maxPossibleAbilityPoints = 0;

        for (let i = 0; i < hero.GetAbilityCount(); i++) {
            const ability = hero.GetAbilityByIndex(i);

            if (ability != undefined) {
                maxPossibleAbilityPoints += ability.GetMaxLevel() - ability.GetLevel();
            }
        }

        let newAbilityPoints = hero.GetLevel() - hero.GetSpendedAbilityPoints();
        newAbilityPoints = math.min(newAbilityPoints, maxPossibleAbilityPoints);
        hero.SetAbilityPoints(newAbilityPoints);
    }

    private OnGameRulesStateChange() {
        const newState = GameRules.State_Get();
        if (newState == GameState.GAME_IN_PROGRESS) {
            this.FixDotaTowersInvulnerablity();
        }
        if (newState > GameState.HERO_SELECTION && newState < GameState.PRE_GAME) {
            for (
                let PlayerID = 0 as PlayerID;
                PlayerID <
                PlayerResource.GetPlayerCountForTeam(GameSettings.GetSettingValueAsTeamNumber("players_team")) +
                    PlayerResource.GetPlayerCountForTeam(GameSettings.GetSettingValueAsTeamNumber("enemies_team"));
                PlayerID++
            ) {
                if (!PlayerResource.HasSelectedHero(PlayerID)) {
                    if (!PlayerResource.IsBroadcaster(PlayerID)) {
                        const player = PlayerResource.GetPlayer(PlayerID);
                        if (player == undefined) {
                            return;
                        }
                        player.SetSelectedHero("npc_dota_hero_wisp");
                        PlayerResource.SetHasRandomed(PlayerID);
                        PlayerResource.SetCanRepick(PlayerID, false);
                    }
                }
            }
        }
    }

    private FixDotaTowersInvulnerablity() {
        for (const entity of Entities.FindAllByClassname("npc_dota_building")) {
            const tower = entity as CDOTA_BaseNPC;
            tower.RemoveModifierByName("modifier_invulnerable");
            tower.RemoveModifierByName("modifier_tower_truesight_aura");
        }
    }

    public OnScriptReload() {
        //print("Script reloaded!");
    }
}
