import { BaseAbility, BaseModifier, registerAbility, registerModifier } from "../../../libraries/dota_ts_adapter";
import { modifier_dragon_knight_elder_dragon_form_custom } from "./elder_dragon_form";

@registerAbility()
export class dragon_knight_fireball_custom extends BaseAbility {
    public pathToParticle = "particles/units/heroes/hero_dragon_knight/dragon_knight_shard_fireball.vpcf";

    private caster: CDOTA_BaseNPC_Hero = this.GetCaster() as CDOTA_BaseNPC_Hero;

    override Precache(context: CScriptPrecacheContext): void {
        PrecacheResource(PrecacheType.PARTICLE, ParticleManager.GetParticleReplacement(this.pathToParticle, this.caster), context);
    }

    override GetCastRange(): number {
        if (this.caster.HasModifier(modifier_dragon_knight_elder_dragon_form_custom.name)) {
            return this.GetSpecialValueFor("cast_range_in_dragon_form");
        } else {
            return this.GetSpecialValueFor("cast_range_in_melee");
        }
    }

    override GetAOERadius(): number {
        return this.GetSpecialValueFor("radius");
    }

    override OnSpellStart(): void {
        const point = this.GetCursorPosition();

        CreateModifierThinker(
            this.caster,
            this,
            modifier_dragon_knight_fireball_thinker.name,
            {
                duration: this.GetSpecialValueFor("duration")
            },
            point,
            this.caster.GetTeamNumber(),
            false
        );

        EmitSoundOn("Hero_DragonKnight.Fireball.Cast", this.caster);
    }
}

@registerModifier()
export class modifier_dragon_knight_fireball_thinker extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC = this.GetCaster()!;
    private ability: dragon_knight_fireball_custom = this.GetAbility()! as dragon_knight_fireball_custom;
    private parent: CDOTA_BaseNPC = this.GetParent();
    private radius!: number;
    private linger_duration!: number;

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

    override IsAura() {
        return true;
    }

    override GetAuraSearchTeam() {
        return this.ability.GetAbilityTargetTeam();
    }

    override GetAuraSearchType() {
        return this.ability.GetAbilityTargetType();
    }

    override GetAuraSearchFlags() {
        return this.ability.GetAbilityTargetFlags();
    }

    override GetAuraRadius() {
        return this.radius;
    }

    override GetAuraDuration(): number {
        return this.linger_duration;
    }

    override GetModifierAura() {
        return modifier_dragon_knight_fireball_thinker_aura_debuff.name;
    }

    override OnCreated(kv: AddNewModifierProperties): void {
        this.OnRefresh();
        if (!IsServer()) {
            return;
        }

        const pfx = ParticleManager.CreateParticle(this.ability.pathToParticle, ParticleAttachment.WORLDORIGIN, undefined);
        ParticleManager.SetParticleControl(pfx, 0, this.parent.GetAbsOrigin());
        ParticleManager.SetParticleControl(pfx, 1, this.ability.GetCursorPosition());
        ParticleManager.SetParticleControl(pfx, 2, Vector(kv.duration, 0, 0));
        this.AddParticle(pfx, false, false, -1, false, false);
        EmitSoundOn("Hero_DragonKnight.Fireball.Target", this.parent);

        this.OnIntervalThink();
        this.StartIntervalThink(0.1);
    }

    override OnRefresh(): void {
        this.radius = this.ability.GetSpecialValueFor("radius");
        this.linger_duration = this.ability.GetSpecialValueFor("linger_duration");
    }

    override OnIntervalThink(): void {
        GridNav.DestroyTreesAroundPoint(this.parent.GetAbsOrigin(), this.radius, false);
    }

    override OnDestroy(): void {
        if (!IsServer()) {
            return;
        }

        UTIL_Remove(this.parent);
    }
}

@registerModifier()
export class modifier_dragon_knight_fireball_thinker_aura_debuff extends BaseModifier {
    // Modifier properties
    private caster: CDOTA_BaseNPC_Hero = this.GetCaster()! as CDOTA_BaseNPC_Hero;
    private ability: CDOTABaseAbility = this.GetAbility()!;
    private parent: CDOTA_BaseNPC = this.GetParent();
    private dmg_per_sec!: number;
    private str_to_dmg_per_sec!: number;
    private burn_interval!: number;
    private damageTable!: ApplyDamageOptions;

    // Modifier specials

    override IsHidden() {
        return false;
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

    override OnCreated(): void {
        this.OnRefresh();

        if (!IsServer()) {
            return;
        }

        this.damageTable = {
            victim: this.parent,
            attacker: this.caster,
            ability: this.ability,
            damage: 0,
            damage_type: this.ability.GetAbilityDamageType(),
            damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION
        };

        this.StartIntervalThink(this.burn_interval);
    }

    override OnRefresh(): void {
        this.dmg_per_sec = this.ability.GetSpecialValueFor("damage");
        this.str_to_dmg_per_sec = this.ability.GetSpecialValueFor("str_to_damage_pct") / 100;
        this.burn_interval = this.ability.GetSpecialValueFor("burn_interval");
    }

    override OnIntervalThink(): void {
        let damage = this.dmg_per_sec;
        damage = damage * (this.caster.GetSpellAmplification(false) + 1);
        damage = damage + this.caster.GetStrength() * this.str_to_dmg_per_sec;
        damage = damage * this.burn_interval;
        this.damageTable.damage = damage;

        ApplyDamage(this.damageTable);
    }
}
