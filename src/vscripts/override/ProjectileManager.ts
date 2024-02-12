export {};

declare global {
    interface ProjectileManager {
        /**
         * Creates a linear projectile and returns the projectile ID.
         */
        CreateLinearProjectile(options: CreateLinearProjectileOptions): ProjectileID;
    }

    interface CreateLinearProjectileOptions {
        fProjectileSpeed: number;
    }
}

interface ProjectileManagerExtended extends ProjectileManager {
    _intrinsicModifier: CDOTA_Buff | undefined;
    _projectilesData: Map<ProjectileID, object> | undefined;
    _CreateLinearProjectileVanilla(options: CreateTrackingProjectileOptions): ProjectileID;
}

(ProjectileManager as unknown as ProjectileManagerExtended)._CreateLinearProjectileVanilla =
    (ProjectileManager as unknown as ProjectileManagerExtended)._CreateLinearProjectileVanilla ?? ProjectileManager.CreateLinearProjectile;

ProjectileManager.CreateLinearProjectile = function (projectile: CreateLinearProjectileOptions) {
    const convertedManager = this as unknown as ProjectileManagerExtended;

    if (math.abs(projectile.vVelocity.Length2D() - 0) < 0.01) {
        let fixedVelocity: Vector | undefined;

        if (projectile.Source != undefined) {
            fixedVelocity = projectile.Source.GetForwardVector();
        }

        if (fixedVelocity == undefined && projectile.Ability != undefined) {
            fixedVelocity = projectile.Ability.GetOwnerEntity().GetForwardVector();
        }
        if (fixedVelocity == undefined) {
            fixedVelocity = Vector(1, 0, 0);
        }

        if (fixedVelocity != undefined) {
            fixedVelocity = (fixedVelocity * projectile.fProjectileSpeed) as Vector;
        }

        projectile.vVelocity = fixedVelocity!;
    }

    return convertedManager._CreateLinearProjectileVanilla(projectile);
};
