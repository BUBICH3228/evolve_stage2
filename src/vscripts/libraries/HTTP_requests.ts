import { modifier_emblem_donate } from "../modifiers/modifier_emblem_donate";
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
let webkey = GetDedicatedServerKeyV2("web");
if (webkey == "Invalid_NotOnDedicatedServer") {
    webkey = "TestServerKey";
}

export class HTTPRequests {
    static PlayerTopTable = {};
    constructor() {
        this.Initialize();
    }

    private Initialize() {
        ListenToGameEvent("game_rules_state_change", () => this.OnGameRulesStateChange(), undefined);
        CustomGameEventManager.RegisterListener("create_top_table", (_, event) => {
            const player = PlayerResource.GetPlayer(event.PlayerID);
            if (player == undefined) {
                return;
            }
            CustomGameEventManager.Send_ServerToPlayer(player, "load_top_table", {
                data: HTTPRequests.PlayerTopTable,
                SteamID64: PlayerResource.GetSteamID(event.PlayerID)
            });
        });
    }

    private OnGameRulesStateChange() {
        const newState = GameRules.State_Get();

        if (newState == GameState.PRE_GAME) {
            Timers.CreateTimer(0, () => {
                HTTPRequests.LoadTopTable();
                return 150;
            });
        }
    }

    public static LoadTopTable(): void {
        const req = CreateHTTPRequestScriptVM("GET", "http://91.240.86.56:3000/api/TopLoad");
        req.SetHTTPRequestGetOrPostParameter("key", webkey);
        req.Send((res) => {
            HTTPRequests.PlayerTopTable = json.decode(res.Body);
        });
    }

    public static SaveTopTable(data: any): void {
        if (GameRules.IsCheatMode() == true || GetMapName() == "test_map") {
            return;
        }
        const req = CreateHTTPRequestScriptVM("GET", "http://91.240.86.56:3000/api/TopSave");
        req.SetHTTPRequestGetOrPostParameter("key", webkey);
        req.SetHTTPRequestGetOrPostParameter("data", json.encode(data));
        req.Send((res) => {
            print(res.Body);
        });
    }

    public static CheckThePlayerDonate(SteamID: string, hero: CDOTA_BaseNPC): void {
        const req = CreateHTTPRequestScriptVM("GET", "http://91.240.86.56:3000/api/Donateload");
        req.SetHTTPRequestGetOrPostParameter("key", webkey);
        req.Send((res) => {
            for (const [_, v] of Object.entries(json.decode(res.Body)[0])) {
                const SqlDate = tostring(v["EndDate"]).slice(2, 10).split("-");
                const date = GetSystemDate().split("/");
                const month = date[0],
                    day = date[1],
                    year = date[2];
                const month1 = SqlDate[1],
                    day1 = SqlDate[2],
                    year1 = SqlDate[0];
                if (v["SteamID"] == SteamID && year < year1) {
                    hero.AddNewModifier(hero, undefined, modifier_emblem_donate.name, {
                        duration: -1,
                        EffectName: v["EffectName"]
                    });
                } else if (v["SteamID"] == SteamID && year == year1) {
                    if (month < month1) {
                        hero.AddNewModifier(hero, undefined, modifier_emblem_donate.name, {
                            duration: -1,
                            EffectName: v["EffectName"]
                        });
                    } else if (month == month1) {
                        if (day <= day1) {
                            hero.AddNewModifier(hero, undefined, modifier_emblem_donate.name, {
                                duration: -1,
                                EffectName: v["EffectName"]
                            });
                        }
                    }
                }
            }
        });
    }
}

if (IsServer()) {
    new HTTPRequests();
}
