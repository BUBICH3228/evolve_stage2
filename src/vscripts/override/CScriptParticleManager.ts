export {};

declare global {
    interface CScriptParticleManager {
        DestroyAndReleaseParticle(particleID: ParticleID, destroyDelay?: number, destroyImmediately?: boolean): void;
    }
}

CScriptParticleManager.DestroyAndReleaseParticle = function (
    particleID: ParticleID,
    destroyDelay?: number,
    destroyImmediately = false
): void {
    if (destroyDelay == undefined) {
        ParticleManager.DestroyParticle(particleID, destroyImmediately);
        ParticleManager.ReleaseParticleIndex(particleID);
        return;
    }

    Timers.CreateTimer(
        destroyDelay,
        () => {
            ParticleManager.DestroyParticle(particleID, destroyImmediately);
            ParticleManager.ReleaseParticleIndex(particleID);
        },
        this
    );
};
