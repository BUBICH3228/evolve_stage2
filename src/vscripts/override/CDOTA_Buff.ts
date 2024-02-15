export {};

declare global {
    interface CDOTA_Buff {
        IncrementIndependentStackCount(callback?: () => void): void;
    }
}

CDOTA_Buff.IncrementIndependentStackCount = function (callback?: () => void) {
    this.IncrementStackCount();
    Timers.CreateTimer(
        this.GetDuration(),
        () => {
            if (!this.IsNull()) {
                this.DecrementStackCount();
                this.Destroy;
                if (callback != undefined) {
                    callback();
                }
            }
        },
        this
    );
};
