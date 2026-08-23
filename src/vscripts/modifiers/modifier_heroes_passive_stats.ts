import { HeroesData } from "../common/data/heroes_data";
import { registerModifier, BaseModifier } from "../libraries/dota_ts_adapter";
import { modifier_incapacitated_state } from "./modifier_incapacitated_state";

@registerModifier()
export class modifier_heroes_passive_stats extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC_Hero = this.GetParent() as CDOTA_BaseNPC_Hero;
    dotaNegativeMagicResistancePerInt = 0;
    bonusMagicalResistanceMax = 0;
    bonusMana = 0;
    bonusHealth = 0;
    countFalls = 0;

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
        return [
            ModifierFunction.MOVESPEED_BONUS_CONSTANT,
            ModifierFunction.MAGICAL_RESISTANCE_DIRECT_MODIFICATION,
            ModifierFunction.MANA_BONUS,
            ModifierFunction.HEALTH_BONUS,
            ModifierFunction.ON_DEATH,
            ModifierFunction.INCOMING_DAMAGE_CONSTANT,
            ModifierFunction.MIN_HEALTH,
            ModifierFunction.ON_RESPAWN
        ];
    }

    GetModifierIncomingDamageConstant(event: ModifierAttackEvent): number {
        if (IsClient()) {
            return 0;
        }

        if (event.target != this.parent || event.target.GetTeam() == DotaTeam.BADGUYS) {
            return 0;
        }

        if (event.attacker.GetTeam() == DotaTeam.BADGUYS && event.target.HasModifier(modifier_incapacitated_state.name) == true) {
            return -event.damage;
        }

        if (
            event.damage >= event.target.GetHealth() &&
            event.target.HasModifier(modifier_incapacitated_state.name) == false &&
            (!(this.countFalls % 2 === 0) || this.countFalls == 0)
        ) {
            this.countFalls++;
            event.target.Heal(1200, undefined);
            event.target.AddNewModifier(event.target, undefined, modifier_incapacitated_state.name, { duration: -1 });
            return event.damage;
        }
        return 0;
    }

    OnRespawn(event: ModifierUnitEvent): void {
        if (event.unit != this.parent || event.unit.GetTeam() == DotaTeam.BADGUYS) {
            return;
        }
        const entities = Entities.FindAllByName("spawn_hunters");
        FindClearSpaceForUnit(event.unit, entities[0].GetAbsOrigin(), true);
    }

    GetMinHealth(): number {
        return this.parent.GetTeam() == DotaTeam.GOODGUYS
            ? this.parent.HasModifier(modifier_incapacitated_state.name) == false && (!(this.countFalls % 2 === 0) || this.countFalls == 0)
                ? 1
                : -1
            : -1;
    }

    GetModifierManaBonus(): number {
        return this.bonusMana;
    }

    GetModifierHealthBonus(): number {
        return this.bonusHealth;
    }

    GetModifierIgnoreMovespeedLimit(): 0 | 1 {
        return 1;
    }

    CheckState(): Partial<Record<modifierstate, boolean>> {
        return {
            [ModifierState.NO_HEALTH_BAR]: this.parent.GetTeam() == DotaTeam.GOODGUYS ? false : true,
            [ModifierState.NO_HEALTH_BAR_FOR_ENEMIES]: this.parent.GetTeam() == DotaTeam.GOODGUYS ? false : true,
            [ModifierState.NO_HEALTH_BAR_FOR_OTHER_PLAYERS]: this.parent.GetTeam() == DotaTeam.GOODGUYS ? false : true
        };
    }

    override OnCreated(): void {
        this.OnRefresh();
        if (!IsServer()) {
            return;
        }
        ListenToGameEvent("dota_player_gained_level", (event) => this.OnPlayerGainedLevel(event), undefined);
        CustomGameEventManager.RegisterListener("start_evolution", (_, event) => {
            const hero = PlayerResource.GetSelectedHeroEntity(event.PlayerID);
            if (hero != undefined) {
                if (hero.GetTeam() != DotaTeam.BADGUYS) {
                    return;
                }
                hero.AddNewModifier(this.caster, undefined, "modifier_pangolier_gyroshell", { duration: 9 });
                hero.StartGestureWithPlaybackRate(GameActivity.DOTA_FLAIL, 0.3);
                hero.SetAbilityPoints(5 - this.parent.GetLevel());
            }
        });
        CustomGameEventManager.RegisterListener("end_evolution", (_, event) => {
            const hero = PlayerResource.GetSelectedHeroEntity(event.PlayerID);
            if (hero != undefined) {
                if (hero.GetTeam() != DotaTeam.BADGUYS) {
                    return;
                }
                hero.RemoveGesture(GameActivity.DOTA_FLAIL);
                if (hero.GetAbilityPoints() > 0) {
                    const currentPoints = hero.GetAbilityPoints();
                    for (let i = 0; i < currentPoints; i++) {
                        const ability = hero.GetAbilityByIndex(RandomInt(0, 3));
                        if (ability != undefined) {
                            if (ability.GetMaxLevel() != ability.GetLevel()) {
                                hero.UpgradeAbility(ability);
                            }
                        }
                    }
                }

                if (IsServer()) {
                    hero.SetModelScale(this.parent.GetModelScale() + 0.3);
                }
            }
        });
        this.dotaNegativeMagicResistancePerInt =
            GameRules.GetGameModeEntity().GetCustomAttributeDerivedStatValue(AttributeDerivedStats.INTELLIGENCE_MAGIC_RESIST) * -1;
        if (this.parent.GetTeam() == DotaTeam.BADGUYS) {
            this.parent.SetBaseManaRegen(5);
            this.parent.SetMana(0);
        } else {
            this.parent.SetBaseHealthRegen(0);
            this.parent.SetBaseManaRegen(40);
        }
    }

    override OnRefresh(): void {
        if (!IsServer()) {
            return;
        }
        this.bonusMana =
            (this.parent.GetTeamNumber() == DotaTeam.GOODGUYS
                ? 550
                : (HeroesData["monster"]["npc_dota_hero_primal_beast"].stats.shild as number[])[this.parent.GetLevel() - 1]) - 75;
        this.bonusHealth =
            (this.parent.GetTeamNumber() == DotaTeam.GOODGUYS
                ? 1600
                : (HeroesData["monster"]["npc_dota_hero_primal_beast"].stats.health as number[])[this.parent.GetLevel() - 1]) - 120;

        this.SetHasCustomTransmitterData(true);
        this.StartIntervalThink(0.05);
        this.parent.CalculateGenericBonuses();
        this.SendBuffRefreshToClients();
    }

    private OnPlayerGainedLevel(kv: DotaPlayerGainedLevelEvent) {
        const hero = PlayerResource.GetSelectedHeroEntity(kv.player_id);

        if (hero == undefined) {
            return;
        }

        if (hero == this.parent) this.OnRefresh();
        if (!IsServer()) {
            return;
        }
        if (this.parent.GetTeam() == DotaTeam.BADGUYS) {
            CustomGameEventManager.Send_ServerToPlayer(hero.GetPlayerOwner(), "show_button_evolution", {});
        }
    }

    OnDeath(kv: ModifierInstanceEvent): void {
        if (kv.unit.GetUnitName() == "npc_dota_evolution_points") {
            return;
        }

        if (kv.unit == this.parent || kv.attacker != this.parent || kv.unit.IsRealHero() || kv.unit.IsWard()) {
            return;
        }

        if (kv.attacker.GetTeam() != DotaTeam.BADGUYS) {
            return;
        }

        const unit = CreateUnitByName("npc_dota_evolution_points", kv.unit.GetAbsOrigin(), true, undefined, undefined, DotaTeam.CUSTOM_5);

        unit.SetForwardVector(kv.unit.GetForwardVector());

        switch (kv.unit.GetLevel()) {
            case 1:
                unit.SetBaseMaxHealth(1);
                unit.SetMaxHealth(1);
                unit.SetHealth(1);
                unit.SetDeathXP(1);
                break;
            case 2:
                unit.SetBaseMaxHealth(2);
                unit.SetMaxHealth(2);
                unit.SetHealth(2);
                unit.SetDeathXP(2);
                break;
            case 3:
                unit.SetBaseMaxHealth(3);
                unit.SetMaxHealth(3);
                unit.SetHealth(3);
                unit.SetDeathXP(3);
                break;
            case 4:
                unit.SetBaseMaxHealth(4);
                unit.SetMaxHealth(4);
                unit.SetHealth(4);
                unit.SetDeathXP(4);
                break;
        }
    }

    OnIntervalThink(): void {
        this.SendBuffRefreshToClients();
        this.StartIntervalThink(1);
    }

    GetModifierMagicalResistanceDirectModification(): number {
        return this.dotaNegativeMagicResistancePerInt * (this.parent as CDOTA_BaseNPC_Hero).GetIntellect(false);
    }

    AddCustomTransmitterData() {
        return {
            bonusMana: this.bonusMana,
            bonusHealth: this.bonusHealth,
            dotaNegativeMagicResistancePerInt: this.dotaNegativeMagicResistancePerInt
        };
    }

    HandleCustomTransmitterData(data: ReturnType<this["AddCustomTransmitterData"]>): void {
        this.bonusMana = data.bonusMana;
        this.bonusHealth = data.bonusHealth;
        this.dotaNegativeMagicResistancePerInt = data.dotaNegativeMagicResistancePerInt;
    }
}
