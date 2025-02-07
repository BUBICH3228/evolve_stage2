import { Settings } from "../data/game_settings";
import { registerModifier, BaseModifier } from "../libraries/dota_ts_adapter";
import { reloadable } from "../libraries/tstl-utils";
import { modifier_invulnerable_custom } from "../modifiers/modifier_invulnerable_custom";
/* eslint-disable @typescript-eslint/no-explicit-any */
@reloadable
export class DebugPanel {
    private static SteamIds: { [key: string]: boolean } = {};
    private static _dummies: { [key: number]: any } = {};
    private static _dummyDamageData: { [key: number]: any } = {};
    private static _wtfToggle: { [key: number]: any } = {};
    private static _gameModePreGameStateReached = false;

    constructor() {
        this.Initialize();
    }

    Initialize() {
        if (!IsServer()) {
            return;
        }

        const steamIds: number[] = Settings.server.debug_panel_steam_ids;
        for (const steamId of steamIds) {
            DebugPanel.SteamIds[steamId.toString()] = true;
        }

        DebugPanel.RegisterPanoramaListeners();
        ListenToGameEvent("game_rules_state_change", () => DebugPanel.OnGameRulesStateChange(), undefined);
    }

    private static RegisterPanoramaListeners() {
        CustomGameEventManager.RegisterListener("debug_panel_state_for_player", (_, event) => this.OnStateRequest(event));
        CustomGameEventManager.RegisterListener("debug_panel_create_dummy", (_, event) => this.OnCreateDummyRequest(event));
        CustomGameEventManager.RegisterListener("debug_panel_reset_dummy", (_, event) => this.OnResetDummyRequest(event));
        CustomGameEventManager.RegisterListener("debug_panel_reload_kv", (_, event) => this.OnReloadKVRequest(event));
        CustomGameEventManager.RegisterListener("debug_panel_increase_hero_level", (_, event) => this.OnIncreaseHeroLevelRequest(event));
        CustomGameEventManager.RegisterListener("debug_panel_toggle_scepter", (_, event) => this.OnScepterRequest(event));
        CustomGameEventManager.RegisterListener("debug_panel_toggle_shard", (_, event) => this.OnShardRequest(event));
        CustomGameEventManager.RegisterListener("debug_panel_toggle_invulnerable", (_, event) => this.OnInvulnerableRequest(event));
        CustomGameEventManager.RegisterListener("debug_panel_toggle_grave", (_, event) => this.OnGraveRequest(event));
        CustomGameEventManager.RegisterListener("debug_panel_reset_hero", (_, event) => this.OnResetHeroRequest(event));
        CustomGameEventManager.RegisterListener("debug_panel_restore", (_, event) => this.OnRestoreRequest(event));
        CustomGameEventManager.RegisterListener("debug_panel_respawn_hero", (_, event) => this.OnRespawnHeroRequest(event));
        CustomGameEventManager.RegisterListener("debug_panel_kill", (_, event) => this.OnKillRequest(event));
        CustomGameEventManager.RegisterListener("debug_panel_set_gold", (_, event) => this.OnSetGoldRequest(event));
        CustomGameEventManager.RegisterListener("debug_panel_refresh_abilities_and_items", (_, event) =>
            this.OnRefreshAbilitiesAndItemsRequest(event)
        );
        CustomGameEventManager.RegisterListener("debug_panel_wtf", (_, event) => this.OnWTFRequest(event));
        CustomGameEventManager.RegisterListener("debug_panel_set_time_scale", (_, event) => this.OnSetTimescaleRequest(event));
        CustomGameEventManager.RegisterListener("debug_panel_spawn_rune", (_, event) => this.OnSpawnRuneRequest(event));
        CustomGameEventManager.RegisterListener("debug_panel_set_hero", (_, event) => this.OnSetHeroRequest(event));
        CustomGameEventManager.RegisterListener("debug_panel_run_tests", (_, event) => this.OnRunTestsRequest(event));
    }

    private static OnStateRequest(kv: any): void {
        const playerID = kv.PlayerID;
        this.RestorePanelForPlayer(playerID);
    }

    private static OnRunTestsRequest(kv: any) {
        const playerID = kv.PlayerID;
        if (!this.IsPlayerAllowedToExecuteCommand(playerID)) {
            return;
        }
        CustomGameEventManager.Send_ServerToPlayer(
            PlayerResource.GetPlayer(playerID) as CDOTAPlayerController,
            "debug_panel_run_tests_response",
            {
                data: UnitTests.ExecuteTestsForPlayer()
            } as never
        );
    }

    private static OnCreateDummyRequest(kv: any) {
        const playerID = kv.PlayerID;
        if (!this.IsPlayerAllowedToExecuteCommand(playerID)) {
            return;
        }

        if (DebugPanel._dummies[playerID] && !DebugPanel._dummies[playerID].IsNull()) {
            UTIL_Remove(DebugPanel._dummies[playerID]);
        }

        const playerHero = PlayerResource.GetSelectedHeroEntity(playerID) as CDOTA_BaseNPC;
        DebugPanel._dummies[playerID] = CreateUnitByName(
            this.GetDummyUnitName(),
            playerHero.GetAbsOrigin(),
            true,
            playerHero,
            playerHero,
            DotaTeam.BADGUYS
        );

        DebugPanel._dummies[playerID].AddNewModifier(DebugPanel._dummies[playerID], null, modifier_debug_panel_dummy.name, {
            duration: -1
        });

        DebugPanel._dummies[playerID].StartGesture(GameActivity.DOTA_SPAWN);
    }

    private static OnResetDummyRequest(kv: any) {
        const playerID = kv.PlayerID;
        if (!this.IsPlayerAllowedToExecuteCommand(playerID)) {
            return;
        }

        DebugPanel._dummyDamageData[playerID] = DebugPanel._dummyDamageData[playerID] || {};
        DebugPanel._dummyDamageData[playerID]._dummyTotalDamage = 0;
        DebugPanel._dummyDamageData[playerID]._dummyDPS = 0;
        DebugPanel._dummyDamageData[playerID]._dummyLastHit = 0;
        DebugPanel._dummyDamageData[playerID]._dummyResetTime = 0;
        DebugPanel._dummyDamageData[playerID]._dummyStartTime = 0;
        this.ReportDummyStats(playerID);
    }

    private static OnReloadKVRequest(kv: any) {
        const playerID = kv.PlayerID;
        if (!this.IsPlayerAllowedToExecuteCommand(playerID)) {
            return;
        }
        GameRules.Playtesting_UpdateAddOnKeyValues();
    }

    private static OnSetHeroRequest(kv: any) {
        const playerID = kv.PlayerID;
        if (!this.IsPlayerAllowedToExecuteCommand(playerID)) {
            return;
        }

        const id = Number(kv.id);
        if (!id) {
            Debug_PrintError("DebugPanel:OnSetHeroRequest id argument missing or invalid. Wtf?");
            return;
        }

        const heroName = DOTAGameManager.GetHeroUnitNameByID(id);
        if (!heroName) {
            PlayerResource.SendCustomErrorMessageToPlayer(playerID, "Invalid or disabled hero");
            return;
        }

        PlayerResource.ReplacePlayerHero(playerID, heroName, false, () => {
            CustomGameEventManager.Send_ServerToPlayer(
                PlayerResource.GetPlayer(playerID) as CDOTAPlayerController,
                "debug_panel_set_hero_response",
                {} as never
            );
        });
    }

    private static OnSpawnRuneRequest(kv: any) {
        const playerID = kv.PlayerID;
        if (!this.IsPlayerAllowedToExecuteCommand(playerID)) {
            return;
        }

        const rune = Number(kv.rune);
        if (!rune) {
            Debug_PrintError("DebugPanel:OnSpawnRuneRequest rune argument missing or invalid. Wtf?");
            return;
        }

        const entIndex = Number(kv.unit);
        if (!entIndex) {
            Debug_PrintError("DebugPanel:OnSpawnRuneRequest unit argument missing or invalid. Wtf?");
            return;
        }

        const playerHero = EntIndexToHScript(entIndex as EntityIndex);
        if (!playerHero) {
            return;
        }

        CreateRune(playerHero.GetAbsOrigin(), rune);
    }

    private static OnSetTimescaleRequest(kv: any) {
        const playerID = kv.PlayerID;
        if (!this.IsPlayerAllowedToExecuteCommand(playerID)) {
            return;
        }

        const value = Number(kv.value);
        if (!value) {
            Debug_PrintError("DebugPanel:OnSetTimescaleRequest value argument missing or invalid. Wtf?");
            return;
        }

        Convars.SetFloat("host_timescale", value);
    }

    private static OnWTFRequest(kv: any) {
        const playerID = kv.ID;
        if (!this.IsPlayerAllowedToExecuteCommand(playerID)) {
            return;
        }

        const playerHero = PlayerResource.GetSelectedHeroEntity(playerID);
        if (!playerHero) {
            PlayerResource.SendCustomErrorMessageToPlayer(playerID, "Player hero is required");
            return;
        }

        if (this.IsWtfToggled(playerID)) {
            UTIL_Remove(DebugPanel._wtfToggle[playerID]);
            DebugPanel._wtfToggle[playerID] = null;
        } else {
            DebugPanel._wtfToggle[playerID] = CreateModifierThinker(
                playerHero,
                undefined,
                modifier_debug_panel_free_spells_aura.name,
                { duration: -1, playerID: playerID },
                Vector(0, 0, 0),
                playerHero.GetTeamNumber(),
                false
            );
        }
    }

    private static OnRefreshAbilitiesAndItemsRequest(kv: any) {
        const playerID = kv.PlayerID;
        if (!this.IsPlayerAllowedToExecuteCommand(playerID)) {
            return;
        }

        const entIndex = Number(kv.unit);
        if (!entIndex) {
            Debug_PrintError("DebugPanel:OnRespawnHeroRequest unit argument missing or invalid. Wtf?");
            return;
        }

        const playerHero = EntIndexToHScript(entIndex as EntityIndex);
        if (!playerHero) {
            return;
        }

        this.RemoveAllCooldownForUnit(playerHero, true);
    }

    private static OnSetGoldRequest(kv: any) {
        const playerID = kv.PlayerID;
        if (!this.IsPlayerAllowedToExecuteCommand(playerID)) {
            return;
        }

        const gold = Number(kv.gold);
        if (!gold) {
            Debug_PrintError("DebugPanel:OnSetGoldRequest gold argument missing or invalid. Wtf?");
            return;
        }

        const eventData = {
            player_id_const: kv.PlayerID,
            gold: gold,
            reliable: 1,
            reason_const: 10
        };

        if (gold === 0) {
            eventData.gold = -100000000000;
        }

        CustomEvents.RunEventByName(CustomEvent.CUSTOM_EVENT_ON_PRE_PLAYER_GAIN_GOLD, eventData);
    }

    private static OnKillRequest(kv: any) {
        const playerID = kv.PlayerID;
        if (!this.IsPlayerAllowedToExecuteCommand(playerID)) {
            return;
        }

        const entIndex = Number(kv.unit);
        if (!entIndex) {
            Debug_PrintError("DebugPanel:OnRespawnHeroRequest unit argument missing or invalid. Wtf?");
            return;
        }

        const playerHero = EntIndexToHScript(entIndex as EntityIndex) as CDOTA_BaseNPC;
        if (!playerHero) {
            return;
        }

        const player = PlayerResource.GetSelectedHeroEntity(playerID);

        if (!player) {
            PlayerResource.SendCustomErrorMessageToPlayer(playerID, "Can't respawn non hero units");
            return;
        }

        playerHero.Kill(undefined, player);
    }

    private static OnRespawnHeroRequest(kv: any) {
        const playerID = kv.PlayerID;
        if (!this.IsPlayerAllowedToExecuteCommand(playerID)) {
            return;
        }

        const entIndex = Number(kv.unit);
        if (!entIndex) {
            Debug_PrintError("DebugPanel:OnRespawnHeroRequest unit argument missing or invalid. Wtf?");
            return;
        }

        const playerHero = EntIndexToHScript(entIndex as EntityIndex);
        if (!playerHero) {
            return;
        }

        const player = PlayerResource.GetSelectedHeroEntity(playerID);

        if (!player) {
            PlayerResource.SendCustomErrorMessageToPlayer(playerID, "Can't respawn non hero units");
            return;
        }

        player.RespawnHero(false, false);
    }

    private static OnResetHeroRequest(kv: any) {
        const playerID = kv.PlayerID;
        if (!this.IsPlayerAllowedToExecuteCommand(playerID)) {
            return;
        }

        const entIndex = Number(kv.unit);
        if (!entIndex) {
            Debug_PrintError("DebugPanel:OnResetHeroRequest unit argument missing or invalid. Wtf?");
            return;
        }

        const playerHero = PlayerResource.GetSelectedHeroEntity(playerID);
        if (!playerHero) {
            return;
        }

        PlayerResource.ReplacePlayerHero(playerID, playerHero.GetUnitName(), false, () => {
            CustomGameEventManager.Send_ServerToPlayer(
                PlayerResource.GetPlayer(playerID) as CDOTAPlayerController,
                "debug_panel_set_hero_response",
                {} as never
            );
        });
    }

    private static OnRestoreRequest(kv: any) {
        const playerID = kv.PlayerID;
        if (!this.IsPlayerAllowedToExecuteCommand(playerID)) {
            return;
        }

        const entIndex = Number(kv.unit);
        if (!entIndex) {
            Debug_PrintError("DebugPanel:OnRestoreRequest unit argument missing or invalid. Wtf?");
            return;
        }

        const playerHero = EntIndexToHScript(entIndex as EntityIndex);
        if (!playerHero) {
            return;
        }
        const player = PlayerResource.GetSelectedHeroEntity(playerID);
        if (!player) {
            return;
        }
        if (!player.IsAlive()) {
            player.RespawnHero(false, false);
        }

        player.SetHealth(player.GetMaxHealth());
        player.SetMana(player.GetMaxMana());
        player.Purge(false, true, false, true, true);
    }

    private static OnInvulnerableRequest(kv: any) {
        const playerID = kv.PlayerID;
        if (!this.IsPlayerAllowedToExecuteCommand(playerID)) {
            return;
        }

        const entIndex = Number(kv.unit);
        if (!entIndex) {
            Debug_PrintError("DebugPanel:OnInvulnerableRequest unit argument missing or invalid. Wtf?");
            return;
        }

        const playerHero = EntIndexToHScript(entIndex as EntityIndex) as CDOTA_BaseNPC;
        if (!playerHero) {
            return;
        }

        if (!playerHero.HasModifier(modifier_invulnerable_custom.name)) {
            playerHero.AddNewModifier(playerHero, undefined, modifier_invulnerable_custom.name, { duration: -1 });
        } else {
            playerHero.RemoveModifierByName(modifier_invulnerable_custom.name);
        }
    }

    private static OnGraveRequest(kv: any) {
        const playerID = kv.PlayerID;
        if (!this.IsPlayerAllowedToExecuteCommand(playerID)) {
            return;
        }

        const entIndex = Number(kv.unit);
        if (!entIndex) {
            Debug_PrintError("DebugPanel:OnGraveRequest unit argument missing or invalid. Wtf?");
            return;
        }

        const playerHero = EntIndexToHScript(entIndex as EntityIndex) as CDOTA_BaseNPC;
        if (!playerHero) {
            return;
        }

        if (!playerHero.HasModifier(modifier_debug_panel_grave.name)) {
            playerHero.AddNewModifier(playerHero, undefined, modifier_debug_panel_grave.name, { duration: -1 });
        } else {
            playerHero.RemoveModifierByName(modifier_debug_panel_grave.name);
        }
    }

    private static OnScepterRequest(kv: any) {
        const playerID = kv.PlayerID;
        if (!this.IsPlayerAllowedToExecuteCommand(playerID)) {
            return;
        }

        const entIndex = Number(kv.unit);
        if (!entIndex) {
            Debug_PrintError("DebugPanel:OnScepterRequest unit argument missing or invalid. Wtf?");
            return;
        }

        const playerHero = EntIndexToHScript(entIndex as EntityIndex) as CDOTA_BaseNPC;
        if (!playerHero) {
            return;
        }

        if (!playerHero.HasInventory()) {
            PlayerResource.SendCustomErrorMessageToPlayer(playerID, "Can't grant scepter to unit without inventory");
            return;
        }

        const scepterModifier = playerHero.FindModifierByName("modifier_item_ultimate_scepter_consumed");
        if (!scepterModifier) {
            playerHero.AddItemByName("item_ultimate_scepter_2");
        } else {
            scepterModifier.Destroy();
        }
    }

    private static OnShardRequest(kv: any) {
        const playerID = kv.PlayerID;
        if (!this.IsPlayerAllowedToExecuteCommand(playerID)) {
            return;
        }

        const entIndex = Number(kv.unit);
        if (!entIndex) {
            Debug_PrintError("DebugPanel:OnShardRequest unit argument missing or invalid. Wtf?");
            return;
        }

        const playerHero = EntIndexToHScript(entIndex as EntityIndex) as CDOTA_BaseNPC;
        if (!playerHero) {
            return;
        }

        if (!playerHero.HasInventory()) {
            PlayerResource.SendCustomErrorMessageToPlayer(playerID, "Can't grant shard to unit without inventory");
            return;
        }

        const shardModifier = playerHero.FindModifierByName("modifier_item_aghanims_shard");
        if (!shardModifier) {
            playerHero.AddItemByName("item_aghanims_shard");
        } else {
            shardModifier.Destroy();
        }
    }

    private static OnIncreaseHeroLevelRequest(kv: any) {
        const playerID = kv.PlayerID;
        if (!this.IsPlayerAllowedToExecuteCommand(playerID)) {
            return;
        }

        const entIndex = Number(kv.unit);
        if (!entIndex) {
            Debug_PrintError("DebugPanel:OnIncreaseHeroLevelRequest unit argument missing or invalid. Wtf?");
            return;
        }

        const playerHero = EntIndexToHScript(entIndex as EntityIndex) as CDOTA_BaseNPC;
        if (!playerHero) {
            return;
        }

        if (!playerHero.IsHero()) {
            PlayerResource.SendCustomErrorMessageToPlayer(playerID, "Can't increase level of non-hero units");
            return;
        }

        const amount = Number(kv.lvl);
        if (!amount) {
            Debug_PrintError("DebugPanel:OnIncreaseHeroLevelRequest level argument missing or invalid. Wtf?");
            return;
        }

        if (amount < 0) {
            for (let i = playerHero.GetLevel(); i <= GameRules.GetGameModeEntity().GetCustomHeroMaxLevel(); i++) {
                playerHero.HeroLevelUp(false);
            }
        } else {
            for (let i = 0; i < amount; i++) {
                playerHero.HeroLevelUp(false);
            }
        }
    }

    public static RemoveAllCooldownForUnit(unit: any, useEffect: boolean) {
        for (let i = 0; i < DOTA_MAX_ABILITIES; i++) {
            const ability = unit.GetAbilityByIndex(i);
            if (ability) {
                ability.EndCooldown();
                ability.RefreshCharges();
            }
        }

        for (let i = 0; i < DOTA_ITEM_MAX; i++) {
            const item = unit.GetItemInSlot(i);
            if (item) {
                item.EndCooldown();
                item.RefreshCharges();
            }
        }

        if (useEffect) {
            const nFXIndex = ParticleManager.CreateParticle("particles/items2_fx/refresher.vpcf", ParticleAttachment.CUSTOMORIGIN, unit);
            ParticleManager.SetParticleControlEnt(
                nFXIndex,
                0,
                unit,
                ParticleAttachment.POINT_FOLLOW,
                ParticleAttachmentLocation.HITLOC,
                Vector(0, 0, 0),
                true
            );
            ParticleManager.DestroyAndReleaseParticle(nFXIndex, 1);
            EmitSoundOn("DebugPanel.RefreshCooldowns", unit);
        }
    }

    private static IsPlayerAllowedToExecuteCommand(playerID: PlayerID) {
        if (!PlayerResource.IsValidPlayerID(playerID)) {
            return false;
        }

        if (IsInToolsMode() || GameRules.IsCheatMode() || GetMapName() === "test_map") {
            return true;
        }

        const steamID = PlayerResource.GetSteamAccountID(playerID).toString();
        if (DebugPanel.SteamIds[steamID]) {
            return true;
        }

        return false;
    }

    private static OnGameRulesStateChange() {
        const newState = GameRules.State_Get();
        if (newState >= GameState.PRE_GAME && !DebugPanel._gameModePreGameStateReached) {
            for (let i = 1; i <= PlayerResource.GetPlayerCountForTeam(DotaTeam.GOODGUYS); i++) {
                const playerID = PlayerResource.GetNthPlayerIDOnTeam(DotaTeam.GOODGUYS, i);
                this.RestorePanelForPlayer(playerID);
            }
            DebugPanel._gameModePreGameStateReached = true;
        }
    }

    private static GetCurrentTimeScale() {
        return Convars.GetFloat("host_timescale") || 1;
    }

    private static IsWtfToggled(playerID: PlayerID) {
        if (DebugPanel._wtfToggle && DebugPanel._wtfToggle[playerID] !== null && !DebugPanel._wtfToggle[playerID].IsNull()) {
            return true;
        }
        return false;
    }

    private static SendDebugPanelState(playerID: PlayerID) {
        CustomGameEventManager.Send_ServerToPlayer(
            PlayerResource.GetPlayer(playerID) as CDOTAPlayerController,
            "debug_panel_state_for_player_response",
            {
                enabled: this.IsPlayerAllowedToExecuteCommand(playerID),
                wtf: this.IsWtfToggled(playerID),
                timescale: this.GetCurrentTimeScale()
            } as never
        );
    }

    private static RestorePanelForPlayer(playerID: PlayerID) {
        if (!PlayerResource.IsValidPlayer(playerID) || playerID < 0) {
            return;
        }
        if (!this.IsPlayerAllowedToExecuteCommand(playerID)) {
            return;
        }
        Timers.CreateTimer(1, () => {
            const playerHero = PlayerResource.GetSelectedHeroEntity(playerID);
            if (playerHero !== null) {
                this.SendDebugPanelState(playerID);
            }
        });
    }

    private static _ReportDamageDoneToDummy(playerID: PlayerID, kv: any): void {
        CustomGameEventManager.Send_ServerToPlayer(
            PlayerResource.GetPlayer(playerID) as CDOTAPlayerController,
            "debug_panel_dummy_on_take_damage",
            kv as never
        );
    }

    public static ReportDummyStats(playerID: PlayerID): void {
        CustomGameEventManager.Send_ServerToPlayer(
            PlayerResource.GetPlayer(playerID) as CDOTAPlayerController,
            "debug_panel_dummy_on_stats",
            {
                dummy_total_damage: DebugPanel._dummyDamageData[playerID]._dummyTotalDamage,
                dummy_dps: DebugPanel._dummyDamageData[playerID]._dummyDPS,
                dummy_last_hit: DebugPanel._dummyDamageData[playerID]._dummyLastHit
            } as never
        );
    }

    public static ReportDamageDoneToDummy(
        playerID: PlayerID,
        kv: { damage: number; damage_type: DamageTypes; inflictor: string | undefined; original_damage: number }
    ): void {
        if (!DebugPanel._dummyDamageData[playerID]) {
            DebugPanel._dummyDamageData[playerID] = {
                _dummyTotalDamage: 0,
                _dummyDPS: 0,
                _dummyLastHit: 0,
                _dummyResetTime: 0,
                _dummyStartTime: 0
            };
        }

        const data = DebugPanel._dummyDamageData[playerID];
        data._dummyTotalDamage += kv.damage;
        data._dummyLastHit = kv.damage;
        const gameTime = GameRules.GetGameTime();
        data._dummyResetTime = gameTime + 10;

        if (data._dummyStartTime === 0) {
            data._dummyStartTime = gameTime;
        }

        const timePassed = Math.max(gameTime - data._dummyStartTime, 1);
        data._dummyDPS = data._dummyTotalDamage / timePassed;

        DebugPanel.ReportDummyStats(playerID);
        DebugPanel._ReportDamageDoneToDummy(playerID, kv);
    }

    public static GetDummyUnitName(): string {
        return "npc_dota_debug_dummy";
    }

    public static IsDummy(unit: any): boolean {
        if (!unit || unit.IsNull()) {
            return false;
        }
        return unit.GetUnitName() === DebugPanel.GetDummyUnitName();
    }
}

@registerModifier()
export class modifier_debug_panel_dummy extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();

    // Modifier specials

    override IsHidden() {
        return true;
    }
    override IsPurgable() {
        return false;
    }
    override IsPurgeException() {
        return false;
    }
    DeclareFunctions(): modifierfunction[] {
        return [ModifierFunction.ON_TAKEDAMAGE, ModifierFunction.MIN_HEALTH];
    }

    CheckState(): Partial<Record<modifierstate, boolean>> {
        return { [ModifierState.STUNNED]: true };
    }

    GetMinHealth(): number {
        return 1;
    }

    OnTakeDamage(kv: ModifierInstanceEvent): void {
        if (kv.unit != this.parent) {
            return;
        }
        if (DebugPanel.IsDummy(kv.unit) == false) {
            return;
        }
        this.parent.SetHealth(this.parent.GetMaxHealth());
        if (kv.unit.GetPlayerOwnerID() != kv.attacker.GetPlayerOwnerID()) {
            return;
        }
        const playerID = kv.unit.GetPlayerOwnerID();
        DebugPanel.ReportDamageDoneToDummy(playerID, {
            damage: kv.damage,
            damage_type: kv.damage_type,
            //Hero switch pass some shit here instead of ability, idk
            inflictor: (kv.inflictor && kv.inflictor.GetAbilityName && kv.inflictor.GetAbilityName()) || undefined,
            original_damage: kv.original_damage
        });
    }
}

@registerModifier()
export class modifier_debug_panel_grave extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();

    // Modifier specials

    override IsHidden() {
        return false;
    }
    override IsDebuff() {
        return false;
    }
    GetTexture(): string {
        return "dazzle_shallow_grave";
    }
    override IsPurgable() {
        return false;
    }
    override IsPurgeException() {
        return false;
    }
    override RemoveOnDeath() {
        return false;
    }

    DeclareFunctions(): modifierfunction[] {
        return [ModifierFunction.MIN_HEALTH];
    }

    GetMinHealth(): number {
        return 1;
    }

    GetEffectAttachType(): ParticleAttachment_t {
        return ParticleAttachment.ABSORIGIN_FOLLOW;
    }

    GetEffectName(): string {
        return "particles/econ/items/dazzle/dazzle_dark_light_weapon/dazzle_dark_shallow_grave.vpcf";
    }
}

@registerModifier()
export class modifier_debug_panel_free_spells_aura extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    playerID: PlayerID = -1;

    // Modifier specials

    override IsHidden() {
        return true;
    }
    override IsDebuff() {
        return false;
    }
    override IsPurgable() {
        return false;
    }
    override IsPurgeException() {
        return false;
    }
    override RemoveOnDeath() {
        return false;
    }

    DeclareFunctions(): modifierfunction[] {
        return [ModifierFunction.ON_ABILITY_FULLY_CAST, ModifierFunction.ON_SPENT_MANA];
    }

    OnCreated(data: { playerID: PlayerID }): void {
        this.playerID = data.playerID;
        if (!IsServer()) {
            return;
        }

        const player = PlayerResource.GetSelectedHeroEntity(this.playerID);

        if (player == undefined) {
            return;
        }

        player.SetHealth(player.GetMaxHealth());
        player.SetMana(player.GetMaxMana());
        DebugPanel.RemoveAllCooldownForUnit(player, false);
    }

    OnSpentMana(kv: ModifierAbilityEvent): void {
        if (kv.unit.GetPlayerOwnerID() != this.playerID) {
            return;
        }

        if (kv.ability != undefined) {
            kv.ability.RefundManaCost();
        }
    }

    OnAbilityFullyCast(kv: ModifierAbilityEvent): void {
        if (kv.unit.GetPlayerOwnerID() != this.playerID) {
            return;
        }

        if (kv.ability != undefined) {
            kv.ability.EndCooldown();
            kv.ability.RefreshCharges();
        }
    }
}

declare global {
    // eslint-disable-next-line no-var
    var _DebugPanelInitialized: boolean;
}

if (IsServer() && !_G._DebugPanelInitialized) {
    new DebugPanel();
    _G._DebugPanelInitialized = true;
}
