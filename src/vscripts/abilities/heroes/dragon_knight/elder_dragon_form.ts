import { BaseAbility, registerAbility, BaseModifier, registerModifier } from "../../../libraries/dota_ts_adapter";

@registerAbility()
export class dragon_knight_elder_dragon_form_custom extends BaseAbility {
    // Ability properties
    private caster: CDOTA_BaseNPC_Hero = this.GetCaster() as CDOTA_BaseNPC_Hero;
    private dragonTransformParticles!: string[];

    public dragonAttackSounds!: string[];

    public dragonProjectileNames!: string[];

    public pathToDragonModel!: string;

    constructor() {
        super();
        this.SetupPathToToAssets();
    }

    SetupPathToToAssets() {
        if (this.pathToDragonModel != undefined) {
            return;
        }

        this.pathToDragonModel = "models/heroes/dragon_knight/dragon_knight_dragon.vmdl";

        this.dragonAttackSounds = [
            "Hero_DragonKnight.ElderDragonShoot1.Attack",
            "Hero_DragonKnight.ElderDragonShoot2.Attack",
            "Hero_DragonKnight.ElderDragonShoot3.Attack",
            "Hero_DragonKnight.ElderDragonShoot3.Attack"
        ];
        this.dragonTransformParticles = [
            "particles/units/heroes/hero_dragon_knight/dragon_knight_transform_green.vpcf",
            "particles/units/heroes/hero_dragon_knight/dragon_knight_transform_red.vpcf",
            "particles/units/heroes/hero_dragon_knight/dragon_knight_transform_blue.vpcf",
            "particles/units/heroes/hero_dragon_knight/dragon_knight_transform_black.vpcf"
        ];

        this.dragonProjectileNames = [
            "particles/units/heroes/hero_dragon_knight/dragon_knight_elder_dragon_corrosive.vpcf",
            "particles/units/heroes/hero_dragon_knight/dragon_knight_elder_dragon_fire.vpcf",
            "particles/units/heroes/hero_dragon_knight/dragon_knight_elder_dragon_frost.vpcf",
            "particles/units/heroes/hero_dragon_knight/dragon_knight_elder_dragon_attack_black.vpcf"
        ];
    }

    override Precache(context: CScriptPrecacheContext): void {
        this.SetupPathToToAssets();

        for (const particle of this.dragonTransformParticles) {
            PrecacheResource(PrecacheType.PARTICLE, ParticleManager.GetParticleReplacement(particle, this.caster), context);
        }

        for (const particle of this.dragonProjectileNames) {
            PrecacheResource(PrecacheType.PARTICLE, ParticleManager.GetParticleReplacement(particle, this.caster), context);
        }

        PrecacheResource(PrecacheType.MODEL, this.pathToDragonModel, context);
    }

    OnToggleWithTalent(): void {
        const modifier = this.caster.FindModifierByName(modifier_dragon_knight_elder_dragon_form_custom.name);

        this.EndCooldown();

        if (modifier == undefined) {
            this.caster.AddNewModifier(this.caster, this, modifier_dragon_knight_elder_dragon_form_custom.name, { duration: -1 });
            this.StartCooldown(1);
        } else {
            modifier.Destroy();
            this.UseResources(false, false, false, true);
        }

        this.PlayDragonEffects();
    }

    override GetCooldown(level: number): number {
        if (this.caster.HasTalent("talent_dragon_knight_elder_dragon_form_toggle")) {
            return this.GetSpecialValueFor("talent_toggle_cooldown");
        }

        return super.GetCooldown(level);
    }

    override OnSpellStart(): void {
        if (this.caster.HasTalent("talent_dragon_knight_elder_dragon_form_toggle")) {
            this.OnToggleWithTalent();
            return;
        }

        this.caster.AddNewModifier(this.caster, this, modifier_dragon_knight_elder_dragon_form_custom.name, {
            duration: this.GetSpecialValueFor("duration")
        });

        this.PlayDragonEffects();
    }

    override OnInventoryContentsChanged() {
        if (!IsServer()) {
            return;
        }
        if (this.caster.HasScepter()) {
            this.TryUpgradeDragonLevel();
        }
    }

    override OnUpgrade(): void {
        if (!IsServer()) {
            return;
        }
        this.TryUpgradeDragonLevel();
    }

    private TryUpgradeDragonLevel() {
        const modifier = this.caster.FindModifierByName(
            modifier_dragon_knight_elder_dragon_form_custom.name
        ) as modifier_dragon_knight_elder_dragon_form_custom;

        modifier?.OnRefresh();
    }

    private PlayDragonEffects() {
        const pfx = ParticleManager.CreateParticle(
            this.dragonTransformParticles[this.GetLevelForEffects()],
            ParticleAttachment.ABSORIGIN_FOLLOW,
            this.caster
        );
        ParticleManager.SetParticleControlEnt(
            pfx,
            1,
            this.caster,
            ParticleAttachment.ABSORIGIN_FOLLOW,
            ParticleAttachmentLocation.HITLOC,
            Vector(0, 0, 0),
            true
        );
        ParticleManager.DestroyAndReleaseParticle(pfx);
        EmitSoundOn("Hero_DragonKnight.ElderDragonForm", this.caster);
    }

    public GetLevelForEffects() {
        const abilityLevelConverted = this.GetLevel() - 1;

        if (this.caster.HasScepter()) {
            const blackDragonMinLevel = 3;
            return blackDragonMinLevel;
        } else {
            const blueDragonMinLevel = 2;
            return math.min(blueDragonMinLevel, abilityLevelConverted);
        }
    }
}

@registerModifier()
export class modifier_dragon_knight_elder_dragon_form_custom extends BaseModifier {
    // Modifier properties
    private ability: dragon_knight_elder_dragon_form_custom = this.GetAbility()! as dragon_knight_elder_dragon_form_custom;
    private parent: CDOTA_BaseNPC_Hero = this.GetParent() as CDOTA_BaseNPC_Hero;
    duration!: number;
    bonusMovementSpeed!: number;
    bonusAttackRange!: number;
    corrosiveDuration!: number;
    splashRadius!: number;
    splashDamagePct!: number;
    frostDuration!: number;
    bonusMagicResistance!: number;
    bonusModelScale!: number;
    talent_breathe_fire_cooldown!: number;
    talentMaxHpPctToSelfDamage!: number;
    talentSelfDamageInterval!: number;
    corrosiveTargetTeam!: UnitTargetTeam;
    corrosiveTargetType!: UnitTargetType;
    corrosiveTargetFlags!: UnitTargetFlags;
    splashTargetTeam!: UnitTargetTeam;
    splashTargetType!: UnitTargetType;
    splashTargetFlags!: UnitTargetFlags;
    frostTargetTeam!: UnitTargetTeam;
    frostTargetType!: UnitTargetType;
    frostTargetFlags!: UnitTargetFlags;
    splashDamageTable!: ApplyDamageOptions;
    talentSelfDamageTable!: ApplyDamageOptions;
    currentTalentDamageTimer!: number;
    thinkInterval = 0.1;
    bonusStatusResistance!: number;
    bonusStrengthPct!: number;

    // Modifier specials

    override IsHidden() {
        return false;
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

    override DeclareFunctions(): ModifierFunction[] {
        return [
            ModifierFunction.MOVESPEED_BONUS_CONSTANT,
            ModifierFunction.ATTACK_RANGE_BONUS,
            ModifierFunction.ON_ATTACK_LANDED,
            ModifierFunction.MAGICAL_RESISTANCE_BONUS,
            ModifierFunction.MODEL_CHANGE,
            ModifierFunction.MODEL_SCALE,
            ModifierFunction.PROJECTILE_NAME,
            ModifierFunction.TRANSLATE_ATTACK_SOUND,
            ModifierFunction.STATUS_RESISTANCE_STACKING,
            ModifierFunction.MOUNTAIN_STATS_STRENGTH_BONUS_PERCENTAGE
        ];
    }

    override GetModifierBonusStats_Strength_Percentage(): number {
        return this.bonusStrengthPct;
    }

    override GetModifierStatusResistanceStacking(): number {
        return this.bonusStatusResistance;
    }

    override GetModifierMoveSpeedBonus_Constant() {
        return this.bonusMovementSpeed;
    }

    override GetModifierMagicalResistanceBonus() {
        return this.bonusMagicResistance;
    }

    override GetModifierAttackRangeBonus() {
        return this.bonusAttackRange;
    }

    override GetModifierModelChange() {
        return this.ability.pathToDragonModel;
    }

    override GetModifierModelScale() {
        return this.bonusModelScale;
    }

    override GetAttackSound() {
        return this.ability.dragonAttackSounds[this.ability.GetLevelForEffects()];
    }

    override GetModifierProjectileName() {
        return this.ability.dragonProjectileNames[this.ability.GetLevelForEffects()];
    }

    override OnCreated(): void {
        this.OnRefresh();

        if (!IsServer()) {
            return;
        }

        this.corrosiveTargetTeam = this.ability.GetAbilityTargetTeam(1);
        this.corrosiveTargetType = this.ability.GetAbilityTargetType(1);
        this.corrosiveTargetFlags = this.ability.GetAbilityTargetFlags(1);
        this.splashTargetTeam = this.ability.GetAbilityTargetTeam(2);
        this.splashTargetType = this.ability.GetAbilityTargetType(2);
        this.splashTargetFlags = this.ability.GetAbilityTargetFlags(2);
        this.frostTargetTeam = this.ability.GetAbilityTargetTeam(3);
        this.frostTargetType = this.ability.GetAbilityTargetType(3);
        this.frostTargetFlags = this.ability.GetAbilityTargetFlags(3);

        this.parent.SetAttackCapability(UnitAttackCapability.RANGED_ATTACK);

        this.splashDamageTable = {
            victim: this.parent,
            attacker: this.parent,
            ability: this.ability,
            damage: 0,
            damage_type: DamageTypes.PHYSICAL,
            damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION + DamageFlag.NO_SPELL_LIFESTEAL
        };

        this.talentSelfDamageTable = {
            victim: this.parent,
            attacker: this.parent,
            ability: this.ability,
            damage: 0,
            damage_type: DamageTypes.PURE,
            damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION + DamageFlag.NO_SPELL_LIFESTEAL + DamageFlag.NO_DAMAGE_MULTIPLIERS
        };

        this.currentTalentDamageTimer = 0;
        this.StartIntervalThink(this.thinkInterval);
    }

    override OnRefresh(): void {
        this.duration = this.ability.GetSpecialValueFor("duration");
        this.bonusMovementSpeed = this.ability.GetSpecialValueFor("bonus_movement_speed");
        this.bonusAttackRange = this.ability.GetSpecialValueFor("bonus_attack_range");
        this.corrosiveDuration = this.ability.GetSpecialValueFor("corrosive_breath_duration");
        this.splashRadius = this.ability.GetSpecialValueFor("splash_radius");
        this.splashDamagePct = this.ability.GetSpecialValueFor("splash_damage_percent") / 100;
        this.frostDuration = this.ability.GetSpecialValueFor("frost_duration");
        this.bonusMagicResistance = this.ability.GetSpecialValueFor("bonus_magic_resistance");
        this.bonusModelScale = this.ability.GetSpecialValueFor("model_scale");
        this.bonusStatusResistance = this.ability.GetSpecialValueFor("bonus_status_resistance");
        this.bonusStrengthPct = this.ability.GetSpecialValueFor("bonus_strength_pct");

        this.talentSelfDamageInterval = this.ability.GetSpecialValueFor("talent_dmg_interval");
        this.talentMaxHpPctToSelfDamage = this.ability.GetSpecialValueFor("talent_dmg_from_max_hp_pct") / 100;
        this.talentMaxHpPctToSelfDamage *= this.talentSelfDamageInterval;

        if (!IsServer()) {
            return;
        }

        Timers.CreateTimer(0.01, () => {
            const skinNumber = this.ability.GetLevelForEffects();
            this.parent.SetSkin(skinNumber);

            if (this.parent.HasScepter()) {
                this.parent.SetMoveCapability(UnitMoveCapability.FLY);
                this.parent.SetRenderColor(0, 0, 0);
                this.parent.NotifyWearablesOfModelChange(false);
            }
        });
    }

    override OnIntervalThink(): void {
        if (this.parent.HasScepter()) {
            GridNav.DestroyTreesAroundPoint(this.parent.GetAbsOrigin(), this.parent.GetModelRadius(), false);
        }

        if (!this.parent.HasTalent("talent_dragon_knight_elder_dragon_form_toggle") || this.GetElapsedTime() < this.duration) {
            return;
        }

        this.currentTalentDamageTimer += this.thinkInterval;

        if (this.currentTalentDamageTimer > this.talentSelfDamageInterval) {
            this.currentTalentDamageTimer = 0;
            this.talentSelfDamageTable.damage = this.parent.GetMaxHealth() * this.talentMaxHpPctToSelfDamage;
            ApplyDamage(this.talentSelfDamageTable);
        }
    }

    override OnAttackLanded(event: ModifierAttackEvent): void {
        if (event.attacker != this.parent) {
            return;
        }

        const abilityLevel = this.ability.GetLevel();
        const teamNumber = this.parent.GetTeamNumber();
        const affectedEnemies: CDOTA_BaseNPC[] = [];

        affectedEnemies.push(event.target);

        this.TryProcSplash(event, affectedEnemies, abilityLevel, teamNumber);

        this.TryProcCorrosive(affectedEnemies, abilityLevel, teamNumber);

        this.TryProcFrost(affectedEnemies, abilityLevel, teamNumber);
    }

    TryProcSplash(event: ModifierAttackEvent, affectedEnemies: CDOTA_BaseNPC[], abilityLevel: number, teamNumber: DotaTeam): void {
        if (abilityLevel < 2) {
            return;
        }

        const enemies = FindUnitsInRadius(
            teamNumber,
            event.target.GetAbsOrigin(),
            undefined,
            this.splashRadius,
            this.splashTargetTeam,
            this.splashTargetType,
            this.splashTargetFlags,
            FindOrder.ANY,
            false
        );

        this.splashDamageTable.damage = event.original_damage * this.splashDamagePct;

        for (const enemy of enemies) {
            if (enemy != event.target) {
                this.splashDamageTable.victim = enemy;
                ApplyDamage(this.splashDamageTable);
                affectedEnemies.push(enemy);
            }
        }
    }

    TryProcCorrosive(enemies: CDOTA_BaseNPC[], abilityLevel: number, teamNumber: DotaTeam): void {
        if (abilityLevel < 1) {
            return;
        }

        for (const enemy of enemies) {
            const corrosiveFilter = UnitFilter(
                enemy,
                this.corrosiveTargetTeam,
                this.corrosiveTargetType,
                this.corrosiveTargetFlags,
                teamNumber
            );
            if (corrosiveFilter == UnitFilterResult.SUCCESS) {
                enemy.AddNewModifier(this.parent, this.ability, modifier_dragon_knight_elder_dragon_form_custom_corrosive_debuff.name, {
                    duration: this.corrosiveDuration
                });
            }
        }
    }

    TryProcFrost(enemies: CDOTA_BaseNPC[], abilityLevel: number, teamNumber: DotaTeam): void {
        if (abilityLevel < 3) {
            return;
        }

        for (const enemy of enemies) {
            const frostFilter = UnitFilter(enemy, this.frostTargetTeam, this.frostTargetType, this.frostTargetFlags, teamNumber);
            if (frostFilter == UnitFilterResult.SUCCESS) {
                enemy.AddNewModifier(this.parent, this.ability, modifier_dragon_knight_elder_dragon_form_custom_frost_debuff.name, {
                    duration: this.frostDuration
                });
            }
        }
    }

    override OnDestroy(): void {
        if (!IsServer()) {
            return;
        }

        this.parent.SetAttackCapability(UnitAttackCapability.MELEE_ATTACK);
        this.parent.SetMoveCapability(UnitMoveCapability.GROUND);

        this.parent.SetRenderColor(255, 255, 255);
        this.parent.NotifyWearablesOfModelChange(true);

        EmitSoundOn("Hero_DragonKnight.ElderDragonForm.Revert", this.parent);
    }
}

@registerModifier()
export class modifier_dragon_knight_elder_dragon_form_custom_corrosive_debuff extends BaseModifier {
    private ability: dragon_knight_elder_dragon_form_custom = this.GetAbility()! as dragon_knight_elder_dragon_form_custom;
    private caster = this.ability.GetCaster()! as CDOTA_BaseNPC_Hero;
    private parent = this.GetParent();

    damageTable!: ApplyDamageOptions;
    corrosiveInterval!: number | undefined;
    corrosiveDamagePerTick!: number;
    corrosiveStrToDamagePctPerTick!: number;

    override IsHidden() {
        return false;
    }
    override IsDebuff() {
        return true;
    }
    override IsPurgable() {
        return true;
    }
    override IsPurgeException() {
        return true;
    }

    override OnCreated(): void {
        this.OnRefresh();
    }

    override OnRefresh(): void {
        if (!IsServer()) {
            return;
        }

        this.corrosiveDamagePerTick = this.ability.GetSpecialValueFor("corrosive_breath_damage");
        this.corrosiveStrToDamagePctPerTick = this.ability.GetSpecialValueFor("corrosive_breath_str_to_dmg_pct") / 100;

        this.damageTable ??= {
            victim: this.parent,
            attacker: this.caster,
            ability: this.ability,
            damage: 0,
            damage_type: DamageTypes.MAGICAL,
            damage_flags: DamageFlag.NO_SPELL_AMPLIFICATION
        };

        const newCorrosiveInterval = this.ability.GetSpecialValueFor("corrosive_breath_damage_interval");
        let isFirstTime = false;

        if (this.corrosiveInterval == undefined) {
            this.corrosiveInterval = newCorrosiveInterval;
            isFirstTime = true;
        }

        if (newCorrosiveInterval < this.corrosiveInterval || isFirstTime) {
            this.corrosiveInterval = newCorrosiveInterval;
            this.StartIntervalThink(newCorrosiveInterval);
        }
    }

    override OnIntervalThink(): void {
        let finalDamage = this.corrosiveDamagePerTick * (this.caster.GetSpellAmplification(false) + 1);
        finalDamage += this.corrosiveStrToDamagePctPerTick * this.caster.GetStrength();

        this.damageTable.damage = finalDamage;

        const damageDone = ApplyDamage(this.damageTable);

        SendOverheadEventMessage(undefined, OverheadAlert.BONUS_POISON_DAMAGE, this.parent, damageDone, undefined);
    }
}

@registerModifier()
export class modifier_dragon_knight_elder_dragon_form_custom_frost_debuff extends BaseModifier {
    private ability: dragon_knight_elder_dragon_form_custom = this.GetAbility()! as dragon_knight_elder_dragon_form_custom;

    movementSpeedReduction!: number;
    attackSpeedReduction!: number;

    override IsHidden() {
        return false;
    }
    override IsDebuff() {
        return true;
    }
    override IsPurgable() {
        return true;
    }
    override IsPurgeException() {
        return true;
    }

    override DeclareFunctions(): ModifierFunction[] {
        return [ModifierFunction.MOVESPEED_BONUS_CONSTANT, ModifierFunction.ATTACKSPEED_BONUS_CONSTANT];
    }

    override GetModifierMoveSpeedBonus_Constant() {
        return this.movementSpeedReduction;
    }

    override GetModifierAttackSpeedBonus_Constant() {
        return this.attackSpeedReduction;
    }

    override OnCreated(): void {
        this.OnRefresh();
    }

    override OnRefresh(): void {
        this.movementSpeedReduction = this.ability.GetSpecialValueFor("frost_ms_reduction_pct") * -1;
        this.attackSpeedReduction = this.ability.GetSpecialValueFor("frost_as_reduction") * -1;
    }
}
