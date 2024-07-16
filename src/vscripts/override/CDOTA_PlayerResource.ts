import { Utility } from "../libraries/utility";

export {};

declare global {
    interface CDOTA_PlayerResource {
        GetPlayerColor(playerID: PlayerID): Vector;
        SendCustomErrorMessageToPlayer(playerID: PlayerID, localizationKey: string): void;
        ReplacePlayerHero(playerID: PlayerID, heroName: string, restoreExp: boolean, callback?: () => void): void;
        GetLastPlayerSelectedUnit(playerID: PlayerID): CDOTA_BaseNPC | undefined;
    }
}

const PlayerColors: Record<PlayerID, Vector> = {
    "-1": Vector(255, 255, 255),
    0: Vector(51, 117, 255),
    1: Vector(102, 255, 191),
    2: Vector(191, 0, 191),
    3: Vector(243, 240, 11),
    4: Vector(255, 107, 0),
    5: Vector(254, 134, 194),
    6: Vector(161, 180, 71),
    7: Vector(101, 217, 247),
    8: Vector(0, 131, 33),
    9: Vector(164, 105, 0),
    10: Vector(255, 255, 255),
    11: Vector(255, 255, 255),
    12: Vector(255, 255, 255),
    13: Vector(255, 255, 255),
    14: Vector(255, 255, 255),
    15: Vector(255, 255, 255),
    16: Vector(255, 255, 255),
    17: Vector(255, 255, 255),
    18: Vector(255, 255, 255),
    19: Vector(255, 255, 255),
    20: Vector(255, 255, 255),
    21: Vector(255, 255, 255),
    22: Vector(255, 255, 255),
    23: Vector(255, 255, 255)
};

CDOTA_PlayerResource.GetPlayerColor = function (playerID: PlayerID): Vector {
    return PlayerColors[playerID];
};

CDOTA_PlayerResource.SendCustomErrorMessageToPlayer = function (playerID: PlayerID, localizationKey: string): void {
    const player = PlayerResource.GetPlayer(playerID) as CDOTAPlayerController;

    CustomGameEventManager.Send_ServerToPlayer(player, "mountain_dota_hud_show_hud_error", {
        message: localizationKey
    });
};

interface ReplacePlayerHeroItem {
    name: string;
    cooldown: number;
    currentCharges: number;
    secondaryCharges: number;
    valuelessCharges: number;
}

function _ReplacePlayerHero(playerID: PlayerID, heroName: string, restoreExp: boolean, callback?: () => void) {
    PrecacheUnitByNameAsync(
        heroName,
        () => {
            const playerGold = PlayerResource.GetGold(playerID);
            let playerHeroExp = 0;
            const playerHero = PlayerResource.GetSelectedHeroEntity(playerID);
            const player = PlayerResource.GetPlayer(playerID);

            if (playerHero == undefined || playerHero.IsNull()) {
                Utility.Debug_PrintError("Attempt to replace hero for player without hero. Player ID = ", playerID);
                return;
            }

            if (player == undefined) {
                Utility.Debug_PrintError("Attempt to replace hero for invalid player. Player ID = ", playerID);
                return;
            }

            playerHeroExp = playerHero.GetCurrentXP();

            const playerItems = new Map<number, ReplacePlayerHeroItem>();

            const LAST_INVENTORY_ITEM = 16;
            for (let i = 0; i <= LAST_INVENTORY_ITEM; i++) {
                const itemInSlot = playerHero.GetItemInSlot(i);
                if (itemInSlot != undefined && itemInSlot.IsNull() == false) {
                    playerItems.set(i, {
                        name: itemInSlot.GetAbilityName(),
                        cooldown: itemInSlot.GetCooldownTimeRemaining(),
                        currentCharges: itemInSlot.GetCurrentCharges(),
                        secondaryCharges: itemInSlot.GetSecondaryCharges(),
                        valuelessCharges: itemInSlot.GetValuelessCharges()
                    });

                    itemInSlot.Destroy();
                }
            }

            for (const modifier of playerHero.FindAllModifiers()) {
                modifier.Destroy();
            }

            const newHero = PlayerResource.ReplaceHeroWithNoTransfer(playerID, heroName, 0, 0);

            if (restoreExp == true) {
                newHero.AddExperience(playerHeroExp, ModifyXpReason.UNSPECIFIED, false, true);
            }

            newHero.SetGold(playerGold, true);

            for (const [_, playerItem] of playerItems) {
                const item = CreateItem(playerItem.name, player, player) as CDOTA_Item;
                const itemInPlayerInventory = newHero.AddItem(item);

                if (itemInPlayerInventory != undefined) {
                    itemInPlayerInventory.StartCooldown(playerItem.cooldown);
                    itemInPlayerInventory.SetCurrentCharges(playerItem.currentCharges);
                    itemInPlayerInventory.SetSecondaryCharges(playerItem.secondaryCharges);
                    itemInPlayerInventory.ModifyNumValuelessCharges(playerItem.valuelessCharges);
                }
            }

            if (playerHero != undefined && playerHero.IsNull() == false && playerHero != newHero) {
                CustomEvents.RunEventByName(CustomEvent.CUSTOM_EVENT_ON_PRE_PLAYER_HERO_CHANGED, {
                    hero: playerHero
                });
                UTIL_Remove(playerHero);
            }

            CustomEvents.RunEventByName(CustomEvent.CUSTOM_EVENT_ON_PLAYER_HERO_CHANGED, {
                hero: newHero
            });

            if (callback != undefined) {
                callback();
            }
        },
        playerID
    );
}

CDOTA_PlayerResource.ReplacePlayerHero = function (playerID: PlayerID, heroName: string, restoreExp: boolean, callback?: () => void): void {
    let player = PlayerResource.GetPlayer(playerID);

    if (player == undefined) {
        Timers.CreateTimer(1, () => {
            player = PlayerResource.GetPlayer(playerID);
            if (player == undefined) {
                return 1;
            } else {
                _ReplacePlayerHero(playerID, heroName, restoreExp, callback);
            }
        });
    } else {
        _ReplacePlayerHero(playerID, heroName, restoreExp, callback);
    }
};

CDOTA_PlayerResource.GetLastPlayerSelectedUnit = function (playerID: PlayerID): CDOTA_BaseNPC | undefined {
    return Selection.GetPlayerLastSelectedUnit(playerID);
};
