import { BaseAbility, registerAbility } from "../../../libraries/dota_ts_adapter";
import { registerModifier, BaseModifier } from "../../../libraries/dota_ts_adapter";

@registerAbility()
export class wraith_king_vampiric_aura_custom extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC = this.GetCaster();
    unitTable: CDOTA_BaseNPC[] = [];
    ability!: CDOTABaseAbility;

    GetIntrinsicModifierName(): string {
        return modifier_wraith_king_vampiric_aura_custom.name;
    }

    override OnSpellStart(): void {
        const point = this.caster.GetAbsOrigin();

        if (this.unitTable.length == 0 && this.GetIntrinsicModifier()!.GetStackCount() > 0) {
            const unit = CreateUnitByName(
                "npc_wraith_king_skeleton_warrior_custom",
                (point + RandomVector(RandomInt(50, 100))) as Vector,
                true,
                this.caster,
                this.caster,
                this.caster.GetTeamNumber()
            );
            unit.AddNewModifier(this.caster, this, modifier_wraith_king_skeleton_warrior_custom_buff.name, { duration: -1 });
            this.unitTable.push(unit);
        }

        this.unitTable.forEach((unit) => {
            const modifier = this.GetIntrinsicModifier();
            if (modifier != undefined) {
                unit.SetControllableByPlayer(this.caster.GetPlayerOwnerID(), true);
                unit.SetBaseMaxHealth(this.GetSpecialValueFor("health_per_stack") * modifier.GetStackCount());
                unit.SetMaxHealth(this.GetSpecialValueFor("health_per_stack") * modifier.GetStackCount());
                unit.SetHealth(this.GetSpecialValueFor("health_per_stack") * modifier.GetStackCount());
                unit.SetBaseHealthRegen((unit.GetMaxHealth() * this.GetSpecialValueFor("heal_and_mana_regeneration_pct")) / 100);

                unit.SetMaxMana(this.GetSpecialValueFor("mana_per_stack") * modifier.GetStackCount());
                unit.SetMana(this.GetSpecialValueFor("mana_per_stack") * modifier.GetStackCount());
                unit.SetBaseManaRegen((unit.GetMaxMana() * this.GetSpecialValueFor("heal_and_mana_regeneration_pct")) / 100);

                unit.SetBaseDamageMin(this.GetSpecialValueFor("damage_per_stack") * modifier.GetStackCount());
                unit.SetBaseDamageMax(this.GetSpecialValueFor("damage_per_stack") * modifier.GetStackCount());

                unit.SetBaseMoveSpeed(math.min(300 + this.GetSpecialValueFor("movespeed_per_stack") * modifier.GetStackCount(), 1000));

                unit.SetPhysicalArmorBaseValue(this.GetSpecialValueFor("armor_per_stack") * modifier.GetStackCount());
            }

            if (!this.caster.HasTalent("talent_wraith_king_vampiric_aura_custom_additional_ability")) {
                return;
            }

            const abilityCaster = this.caster.FindAbilityByName("wraith_king_mortal_strike_custom");

            if (abilityCaster != undefined) {
                if (this.ability == undefined) {
                    this.ability = unit.AddAbility(abilityCaster.GetAbilityName());
                    this.ability.SetLevel(abilityCaster.GetLevel());
                } else {
                    this.ability.SetLevel(abilityCaster.GetLevel());
                }
            }
        });
    }
}

@registerModifier()
export class modifier_wraith_king_vampiric_aura_custom extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    vampiric!: number;
    targetTeam!: UnitTargetTeam;
    targetType!: UnitTargetType;
    targetFlags!: UnitTargetFlags;
    maxStack!: number;
    stackPerCreep!: number;
    stackPerBoss!: number;
    stack = 0;
    maxStackPerKill!: number;

    // Modifier specials

    override IsHidden() {
        if (this.parent == this.caster) {
            return false;
        } else {
            return true;
        }
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

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.MOUNTAIN_LIFESTEAL, ModifierFunction.ON_DEATH];
    }

    GetModifierLifesteal(): number {
        return this.vampiric;
    }

    override OnCreated(): void {
        this.OnRefresh();
        if (!IsServer()) {
            return;
        }
        this.targetTeam = this.ability.GetAbilityTargetTeam(1);
        this.targetType = this.ability.GetAbilityTargetType(1);
        this.targetFlags = this.ability.GetAbilityTargetFlags(1);
    }

    override OnRefresh(): void {
        this.vampiric = this.ability.GetSpecialValueFor("vampiric_aura");
        this.maxStack = this.ability.GetSpecialValueFor("max_stack");
        this.maxStackPerKill = this.ability.GetSpecialValueFor("max_stack_per_kill");
        this.stackPerBoss = this.ability.GetSpecialValueFor("stack_per_kill_boss");
        this.stackPerCreep = this.ability.GetSpecialValueFor("stack_per_kill_creep");
    }

    OnDeath(kv: ModifierInstanceEvent): void {
        if (this.parent.GetPlayerOwnerID() != kv.attacker.GetPlayerOwnerID()) {
            return;
        }

        if (
            UnitFilter(kv.unit, this.targetTeam, this.targetType, this.targetFlags, this.caster.GetTeamNumber()) != UnitFilterResult.SUCCESS
        ) {
            return;
        }

        if (kv.unit.IsBoss()) {
            this.stack += this.stackPerBoss;
        } else {
            this.stack += this.stackPerCreep;
        }

        let newStack = 0;

        if (this.stack % 1 != 0) {
            newStack = this.stack - (this.stack % 1);
            this.stack -= newStack;
        } else {
            newStack = this.stack;
            this.stack -= newStack;
        }

        const hero = PlayerResource.GetSelectedHeroEntity(this.parent.GetPlayerOwnerID());
        if (hero == undefined) {
            return;
        }

        this.SetStackCount(math.min(this.GetStackCount() + newStack, this.maxStack + this.maxStackPerKill * hero.GetLastHits()));
    }
}

@registerModifier()
export class modifier_wraith_king_skeleton_warrior_custom_buff extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    attackSpeed!: number;

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

    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.MIN_HEALTH, ModifierFunction.ATTACKSPEED_BONUS_CONSTANT, ModifierFunction.MODEL_SCALE];
    }

    GetMinHealth(): number {
        if (
            this.parent.GetHealth() <= 2 &&
            this.parent.FindModifierByName(modifier_wraith_king_skeleton_warrior_custom_debuff.name) == undefined
        ) {
            this.parent.AddNewModifier(this.caster, this.ability, modifier_wraith_king_skeleton_warrior_custom_debuff.name, {
                duration: -1
            });
        }
        return 1;
    }

    GetModifierModelScale(): number {
        if (IsServer()) {
            const modifier = this.ability.GetIntrinsicModifier();
            if (modifier == undefined) {
                return 0;
            }
            return 0.5 * modifier.GetStackCount();
        }

        return 0;
    }

    GetModifierAttackSpeedBonus_Constant(): number {
        if (IsServer()) {
            const modifier = this.ability.GetIntrinsicModifier();
            if (modifier == undefined) {
                return 0;
            }
            return this.attackSpeed * modifier.GetStackCount();
        }

        return 0;
    }

    override OnCreated(): void {
        this.OnRefresh();
    }

    OnRefresh(): void {
        this.attackSpeed = this.ability.GetSpecialValueFor("attack_speed_per_stack");
    }
}

@registerModifier()
export class modifier_wraith_king_skeleton_warrior_custom_debuff extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();

    // Modifier specials

    override IsHidden() {
        return true;
    }
    override IsDebuff() {
        return true;
    }
    override IsPurgable() {
        return false;
    }
    override IsPurgeException() {
        return false;
    }

    CheckState(): Partial<Record<ModifierState, boolean>> {
        return {
            [ModifierState.INVULNERABLE]: true,
            [ModifierState.STUNNED]: !this.caster.HasTalent("talent_wraith_king_vampiric_aura_custom_not_stun")
        };
    }

    GetOverrideAnimation(): GameActivity {
        return GameActivity.DOTA_DISABLED;
    }

    override OnCreated(): void {
        if (!IsServer()) {
            return;
        }

        this.StartIntervalThink(0.25);
    }

    OnIntervalThink(): void {
        if (this.parent.GetHealth() == this.parent.GetMaxHealth()) {
            this.Destroy();
        }
    }
}
