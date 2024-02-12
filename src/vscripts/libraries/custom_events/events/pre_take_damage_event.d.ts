interface CustomEventPreTakeDamageEvent {
    attacker: CDOTA_BaseNPC;
    victim: CDOTA_BaseNPC;
    inflictor?: CDOTABaseAbility;
    damage_type: DamageTypes;
    damage: number;
}
