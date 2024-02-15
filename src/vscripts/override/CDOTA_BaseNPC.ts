import { generic_channel_custom } from "../abilities/units/generic_channel";

export {};
declare global {
    interface CDOTA_BaseNPC {
        SetInitialWaypoint(cornerName: string): void;
        HasShard(): boolean;
        BeginChannel(
            time: number,
            target: CDOTA_BaseNPC,
            icon: string,
            castRange: number,
            callbackStart?: () => void,
            callbackThink?: (interval: number) => void,
            callbackFinish?: (interrupted: boolean) => void
        ): void;
        IsBoss(): boolean;
        GetCountRelics(): number;
        PerformLifesteal(target: CDOTA_BaseNPC, amount: number, event: ModifierAttackEvent): void;
        PerformSpellLifesteal(target: CDOTA_BaseNPC, ability: CDOTABaseAbility, amount: number, event: ModifierInstanceEvent): void;
        SetIsCustomStatsModifierJustAdded(state: boolean): void;
        IsCustomStatsModifierJustAdded(): boolean;
        AddCustomStatsModifier(): CDOTA_Buff | undefined;
        GetCustomStatsModifier(): CDOTA_Buff | undefined;
        /**
         * Добавляет модифаер юниту, учитывая смерть. Если мёртв и не удалён (IsNull), то будет ждать респауна. В случае успешного добавления модифаера вызывает callback
         */
        AddNewModifierSafe(
            caster: CDOTA_BaseNPC | undefined,
            ability: CDOTABaseAbility | undefined,
            modifierName: string,
            modifierTable: AddNewModifierProperties | undefined,
            callback?: (modifier: CDOTA_Buff | undefined) => void
        ): void;
    }
}

interface CDOTA_BaseNPCExtended extends CDOTABaseAbility {
    _genericChannelAbility: CDOTABaseAbility | undefined;
    _isCustomStatsModifierWasJustAdded: boolean | undefined;
    _customStatsModifier: CDOTA_Buff | undefined;
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
CDOTA_BaseNPC = CDOTA_BaseNPC || C_DOTA_BaseNPC;

CDOTA_BaseNPC.HasShard = function () {
    return this.HasModifier("modifier_item_aghanims_shard");
};

CDOTA_BaseNPC.GetCountRelics = function () {
    return tonumber(GetUnitKV(this.GetUnitName(), "CountDropRelic")) || 0;
};

CDOTA_BaseNPC.BeginChannel = function (
    time: number,
    target: CDOTA_BaseNPC | Vector,
    icon: string,
    castRange: number,
    callbackStart?: () => void,
    callbackThink?: (interval: number) => void,
    callbackFinish?: (interrupted: boolean) => void
) {
    const convertedNPC = this as unknown as CDOTA_BaseNPCExtended;

    convertedNPC._genericChannelAbility = convertedNPC._genericChannelAbility ?? this.AddAbility("generic_channel_custom");

    if (convertedNPC._genericChannelAbility != undefined) {
        convertedNPC._genericChannelAbility.SetLevel(convertedNPC._genericChannelAbility.GetMaxLevel());
        (convertedNPC._genericChannelAbility as generic_channel_custom).BeginChannel(
            time,
            target,
            icon,
            castRange,
            callbackStart,
            callbackThink,
            callbackFinish
        );
    } else {
        if (callbackFinish != undefined) {
            callbackFinish(false);
        }
    }
};

CDOTA_BaseNPC.IsBoss = function () {
    return tonumber(GetUnitKV(this.GetUnitName(), "IsConsideredBoss")) == 1;
};

CDOTA_BaseNPC.PerformLifesteal = function (target: CDOTA_BaseNPC, amount: number, event: ModifierAttackEvent): void {
    const eventData =
        event ??
        <ModifierAttackEvent>{
            attacker: this,
            damage: 0,
            damage_type: DamageTypes.PHYSICAL,
            damage_category: DamageCategory.ATTACK,
            damage_flags: DamageFlag.NONE,
            inflictor: undefined,
            original_damage: 0,
            ranged_attack: this.GetAttackCapability() == UnitAttackCapability.RANGED_ATTACK,
            target: target,
            no_attack_cooldown: false,
            record: -1,
            fail_type: AttackRecord.FAIL_NO
        };

    const lifestealAmp =
        1 + ModifierProperties.GetModifiersPropertyPercentageMultiplicative(this, ModifierFunction.LIFESTEAL_AMPLIFY_PERCENTAGE, eventData);

    const totalLifesteal = amount * lifestealAmp;

    if (totalLifesteal > 0) {
        const isHealingDisabled =
            ModifierProperties.GetModifiersPropertyHighestPriority(this, ModifierFunction.DISABLE_HEALING, eventData) == 1;

        if (isHealingDisabled == false) {
            const particle = ParticleManager.CreateParticle(
                "particles/generic_gameplay/generic_lifesteal.vpcf",
                ParticleAttachment.ABSORIGIN_FOLLOW,
                this
            );
            ParticleManager.DestroyAndReleaseParticle(particle, 1);

            this.Heal(totalLifesteal, undefined);
        }
    }
};

CDOTA_BaseNPC.PerformSpellLifesteal = function (
    target: CDOTA_BaseNPC,
    ability: CDOTABaseAbility,
    amount: number,
    event: ModifierInstanceEvent
): void {
    const eventData =
        event ??
        <ModifierInstanceEvent>{
            attacker: this,
            damage: 0,
            damage_type: DamageTypes.MAGICAL,
            damage_category: DamageCategory.SPELL,
            damage_flags: DamageFlag.NONE,
            inflictor: ability,
            original_damage: 0,
            ranged_attack: false,
            unit: target,
            no_attack_cooldown: false,
            record: -1,
            fail_type: AttackRecord.FAIL_NO
        };

    const lifestealAmp =
        1 +
        ModifierProperties.GetModifiersPropertyPercentageMultiplicative(
            this,
            ModifierFunction.SPELL_LIFESTEAL_AMPLIFY_PERCENTAGE,
            eventData
        );

    const totalLifesteal = amount * lifestealAmp;

    if (totalLifesteal > 0) {
        const isHealingDisabled =
            ModifierProperties.GetModifiersPropertyHighestPriority(this, ModifierFunction.DISABLE_HEALING, eventData) == 1;
        const isSpellLifestealDisabled = bit.band(eventData.damage_flags, DamageFlag.NO_SPELL_LIFESTEAL) == DamageFlag.NO_SPELL_LIFESTEAL;

        if (isHealingDisabled == false && isSpellLifestealDisabled == false) {
            const particle = ParticleManager.CreateParticle(
                "particles/items3_fx/octarine_core_lifesteal.vpcf",
                ParticleAttachment.ABSORIGIN_FOLLOW,
                this
            );
            ParticleManager.DestroyAndReleaseParticle(particle, 1);

            this.Heal(totalLifesteal, undefined);
        }
    }
};

CDOTA_BaseNPC.SetIsCustomStatsModifierJustAdded = function (state: boolean) {
    const convertedNPC = this as unknown as CDOTA_BaseNPCExtended;
    convertedNPC._isCustomStatsModifierWasJustAdded = state;
};

CDOTA_BaseNPC.IsCustomStatsModifierJustAdded = function (): boolean {
    const convertedNPC = this as unknown as CDOTA_BaseNPCExtended;

    convertedNPC._isCustomStatsModifierWasJustAdded ??= false;

    return convertedNPC._isCustomStatsModifierWasJustAdded;
};

CDOTA_BaseNPC.AddCustomStatsModifier = function (): CDOTA_Buff | undefined {
    const convertedNPC = this as unknown as CDOTA_BaseNPCExtended;

    convertedNPC._customStatsModifier = this.AddNewModifier(this, undefined, "modifier_custom_properties", { duration: -1 });

    return convertedNPC._customStatsModifier;
};

CDOTA_BaseNPC.GetCustomStatsModifier = function (): CDOTA_Buff | undefined {
    const convertedNPC = this as unknown as CDOTA_BaseNPCExtended;

    return convertedNPC._customStatsModifier;
};

CDOTA_BaseNPC.AddNewModifierSafe = function (
    caster: CDOTA_BaseNPC | undefined,
    ability: CDOTABaseAbility | undefined,
    modifierName: string,
    modifierTable: AddNewModifierProperties | undefined,
    callback?: (modifier: CDOTA_Buff | undefined) => void
): void {
    if (this.IsAlive() == true) {
        const addedModifier = this.AddNewModifier(caster, ability, modifierName, modifierTable);
        if (callback != undefined) {
            callback(addedModifier);
        }
    } else {
        Timers.CreateTimer(
            1,
            () => {
                if (this.IsNull()) {
                    return undefined;
                }

                if (this.IsAlive() == false) {
                    return 1;
                }

                const addedModifier = this.AddNewModifier(caster, ability, modifierName, modifierTable);
                if (callback != undefined) {
                    callback(addedModifier);
                }

                return undefined;
            },
            this
        );
    }
};
