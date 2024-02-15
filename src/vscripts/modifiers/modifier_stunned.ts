import { BaseModifier, registerModifier } from "../libraries/dota_ts_adapter";

@registerModifier()
export class modifier_stunned extends BaseModifier {
    IsHidden() {
        return false;
    }
    IsDebuff() {
        return true;
    }
    IsStunDebuff() {
        return true;
    }
    IsPurgable() {
        return false;
    }
    IsPurgeException() {
        return false;
    }
    DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.OVERRIDE_ANIMATION];
    }
    CheckState(): Partial<Record<ModifierState, boolean>> {
        return {
            [ModifierState.STUNNED]: true
        };
    }

    GetEffectAttachType(): ParticleAttachment {
        return ParticleAttachment.OVERHEAD_FOLLOW;
    }

    GetOverrideAnimation(): GameActivity {
        return GameActivity.DOTA_DISABLED;
    }

    GetEffectName(): string {
        return "particles/generic_gameplay/generic_bashed_d.vpcf";
    }
}
