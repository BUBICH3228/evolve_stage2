import { registerModifier, BaseModifier } from "../libraries/dota_ts_adapter";
import { HeroStatsTable } from "../common/data/hero_stats";

@registerModifier()
export class modifier_hero_stats extends BaseModifier {
    // Modifier properties
    private parent: CDOTA_BaseNPC_Hero = this.GetParent() as CDOTA_BaseNPC_Hero;
    bonusStrength = 0;
    bonusAgility = 0;
    bonusIntellect = 0;
    bonusDamage = 0;
    bonusSpellDamage = 0;
    bonusArmor = 0;
    bonusGold = 0;
    bonusExp = 0;
    maxMovespeed = 550;
    maxAttackSpeed = 700;

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
    override RemoveOnDeath(): boolean {
        return false;
    }

    DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.MOVESPEED_LIMIT,
            ModifierFunction.IGNORE_MOVESPEED_LIMIT,
            ModifierFunction.IGNORE_ATTACKSPEED_LIMIT,
            ModifierFunction.ON_DEATH
        ];
    }

    GetModifierMoveSpeed_Limit(): number {
        return this.maxMovespeed;
    }

    GetModifierIgnoreMovespeedLimit(): 0 | 1 {
        return 1;
    }

    OnCreated(): void {
        this.OnRefresh();
        if (!IsServer()) {
            return;
        }
        this.SetHasCustomTransmitterData(true);
        this.StartIntervalThink(0.05);
    }

    OnRefresh(): void {
        if (!IsServer()) {
            return;
        }
        this.bonusGold = HeroStatsTable[this.parent.GetPlayerOwnerID()]["bonus_gold"]["StatCount"];
        this.bonusExp = HeroStatsTable[this.parent.GetPlayerOwnerID()]["bonus_exp"]["StatCount"];
        this.maxMovespeed = HeroStatsTable[this.parent.GetPlayerOwnerID()]["max_movespeed"]["StatCount"];
        this.maxAttackSpeed = HeroStatsTable[this.parent.GetPlayerOwnerID()]["max_attackspeed"]["StatCount"];
        this.SendBuffRefreshToClients();

        const gme = GameRules.GetGameModeEntity();
        gme.SetMaximumAttackSpeed(this.maxAttackSpeed);
        gme.SetMinimumAttackSpeed(50);
    }

    OnIntervalThink(): void {
        this.SendBuffRefreshToClients();
        this.StartIntervalThink(-1);
    }

    AddCustomTransmitterData() {
        return {
            maxMovespeed: this.maxMovespeed,
            maxAttackSpeed: this.maxAttackSpeed
        };
    }

    HandleCustomTransmitterData(data: ReturnType<this["AddCustomTransmitterData"]>): void {
        this.maxMovespeed = data.maxMovespeed;
        this.maxAttackSpeed = data.maxAttackSpeed;
    }

    OnDeath(kv: ModifierInstanceEvent): void {
        const player = kv.attacker.GetOwner() as CDOTA_BaseNPC_Hero;
        if (this.parent.GetOwner() != player) {
            return;
        }
        const plaer = PlayerResource.GetPlayer(this.parent.GetPlayerOwnerID());
        this.parent.ModifyGold(this.bonusGold, true, ModifyGoldReason.CREEP_KILL);
        SendOverheadEventMessage(plaer, OverheadAlert.GOLD, this.parent, this.bonusGold, undefined);
        this.parent.AddExperience(this.bonusExp, ModifyXpReason.CREEP_KILL, false, false);
        SendOverheadEventMessage(plaer, OverheadAlert.XP, this.parent, this.bonusExp, undefined);
    }
}
