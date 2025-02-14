import { BaseAbility, BaseModifier, IsDOTA_BaseNPC, registerAbility, registerModifier } from "../libraries/dota_ts_adapter";

@registerAbility()
export class generic_channel_custom extends BaseAbility {
    private _isValidCast = false;
    private _icon!: string;
    private _channelTime!: number;
    private _castRange!: number;
    private _callbackStart?: () => void;
    private _callbackThink?: (this: void, thinkInterval: number) => void;
    private _callbackFinish?: (this: void, interrupted: boolean) => void;

    override GetIntrinsicModifierName(): string {
        return modifier_generic_channel_custom.name;
    }

    BeginChannel(
        time: number,
        target: CDOTA_BaseNPC | Vector,
        icon: string,
        castRange: number,
        callbackStart?: () => void,
        callbackThink?: (this: void, interval: number) => void,
        callbackFinish?: (this: void, interrupted: boolean) => void
    ) {
        const mod = this.GetIntrinsicModifier() as modifier_generic_channel_custom;

        // Some delay required since 7.32...
        Timers.CreateTimer(
            0.03,
            () => {
                this.SetActivated(true);
                mod.SetData(icon, time, castRange);
                this.SetCallbackStart(callbackStart);
                this.SetCallbackThink(callbackThink);
                this.SetCallbackFinish(callbackFinish);
                const caster = this.GetCaster();

                this.SetIsValidCast(true);

                if (IsDOTA_BaseNPC(target)) {
                    ExecuteOrderFromTable({
                        UnitIndex: caster.entindex(),
                        OrderType: UnitOrder.CAST_TARGET,
                        AbilityIndex: this.entindex(),
                        TargetIndex: target.entindex(),
                        Position: target.GetAbsOrigin(),
                        Queue: false
                    });
                } else {
                    ExecuteOrderFromTable({
                        UnitIndex: caster.entindex(),
                        OrderType: UnitOrder.CAST_POSITION,
                        AbilityIndex: this.entindex(),
                        Position: target,
                        Queue: false
                    });
                }
            },
            this
        );
    }

    override OnSpellStart() {
        const caster = this.GetCaster();

        if (!this.IsValidCast()) {
            caster.Stop();
            return;
        }

        const callback = this.GetCallbackStart();

        if (callback != undefined) {
            callback();
        }
    }

    override OnChannelThink(thinkInterval: number): void {
        const callback = this.GetCallbackThink();

        if (callback != undefined) {
            callback(thinkInterval);
        }
    }

    override OnChannelFinish(interrupted: boolean): void {
        const callback = this.GetCallbackFinish();

        if (callback != undefined) {
            callback(interrupted);
        }

        this.SetCallbackStart(undefined);
        this.SetCallbackFinish(undefined);
        this.SetCallbackThink(undefined);
        this.SetActivated(false);
        this.SetIsValidCast(false);
    }

    override GetAbilityTextureName() {
        return this._icon;
    }

    override IsHiddenAbilityCastable() {
        return true;
    }

    override GetChannelTime(): number {
        return this._channelTime;
    }

    override GetChannelAnimation() {
        return GameActivity.DOTA_GENERIC_CHANNEL_1;
    }

    override GetCastRange() {
        return this._castRange;
    }

    SetIcon(icon: string) {
        this._icon = icon;
    }

    SetChannelTime(channelTime: number) {
        this._channelTime = channelTime;
    }

    SetCastRange(castRange: number) {
        this._castRange = castRange;
    }

    SetIsValidCast(state: boolean): void {
        this._isValidCast = state;
    }

    IsValidCast(): boolean {
        return this._isValidCast;
    }

    SetCallbackStart(callback?: (this: void) => void): void {
        this._callbackStart = callback;
    }

    GetCallbackStart() {
        return this._callbackStart;
    }

    SetCallbackThink(callback?: (this: void, thinkInterval: number) => void) {
        this._callbackThink = callback;
    }

    GetCallbackThink() {
        return this._callbackThink;
    }

    SetCallbackFinish(callback?: (this: void, interrupted: boolean) => void) {
        this._callbackFinish = callback;
    }

    GetCallbackFinish() {
        return this._callbackFinish;
    }
}

@registerModifier()
export class modifier_generic_channel_custom extends BaseModifier {
    // Modifier properties
    private ability: generic_channel_custom = this.GetAbility() as generic_channel_custom;
    private parent: CDOTA_BaseNPC = this.GetParent();
    private icon?: string;
    private channelTime?: number;
    private castRange?: number;

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

    override DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.ON_ORDER];
    }

    override OnCreated(): void {
        if (!IsServer()) {
            return;
        }
        this.SetHasCustomTransmitterData(true);
    }

    override OnOrder(event: ModifierOrderEvent): void {
        if (event.unit != this.parent) {
            return;
        }

        if (
            event.order_type != UnitOrder.CAST_TARGET &&
            event.order_type != UnitOrder.CAST_POSITION &&
            event.order_type != UnitOrder.PURCHASE_ITEM &&
            event.order_type != UnitOrder.SELL_ITEM &&
            event.order_type != UnitOrder.MOVE_ITEM
        ) {
            if (event.ability != this.ability) {
                this.ability.OnChannelFinish(true);
            }
        }
    }

    SetData(icon: string, channelTime: number, castRange: number): void {
        this.icon = icon;
        this.channelTime = channelTime;
        this.castRange = castRange;
        if (this.ability != undefined) {
            this.ability.SetIcon(icon);
            this.ability.SetChannelTime(channelTime);
            this.ability.SetCastRange(castRange);
        }

        if (IsServer()) {
            this.SendBuffRefreshToClients();
        }
    }

    AddCustomTransmitterData() {
        return {
            icon: this.icon,
            channelTime: this.channelTime,
            castRange: this.castRange
        };
    }

    HandleCustomTransmitterData(data: ReturnType<this["AddCustomTransmitterData"]>): void {
        this.SetData(data.icon!, data.channelTime!, data.castRange!);
    }
}
