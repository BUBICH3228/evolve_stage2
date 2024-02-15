import { AICore } from "../ai/ai_core";

export class DamageFilter {
    static Init(gme: CDOTABaseGameMode) {
        gme.SetDamageFilter((event) => this.OnFilter(event), this);
    }

    static OnFilter(event: DamageFilterEvent): boolean {
        // Стоит сконвертить эти данные в нормальные чтобы не ебаться (eventData) и передавать её вместо event
        const eventData = {
            attacker: EntIndexToHScript(event.entindex_attacker_const) as CDOTA_BaseNPC,
            victim: EntIndexToHScript(event.entindex_victim_const) as CDOTA_BaseNPC,
            inflictor: (event.entindex_inflictor_const && EntIndexToHScript(event.entindex_inflictor_const)) || undefined,
            damage_type: event.damagetype_const,
            damage: event.damage
        };

        AICore.OnTakeDamage(eventData.victim, eventData.attacker);

        if (event.damagetype_const == DamageTypes.PHYSICAL) {
            const armor = eventData.victim.GetPhysicalArmorValue(false);
            const dotaDecline = (0.058 * armor) / (1 + 0.058 * math.abs(armor));
            event.damage = event.damage / (1 - dotaDecline);

            let damageMult = 1 - armor / (100 + math.abs(armor));

            if (armor < 0) {
                damageMult = 2 - damageMult;
            }

            event.damage = event.damage * damageMult;
        }

        const ability = event.entindex_inflictor_const && (EntIndexToHScript(event.entindex_inflictor_const) as CDOTABaseAbility);
        if (!ability) {
            CustomEvents.RunEventByName(CustomEvent.CUSTOM_EVENT_ON_PRE_TAKE_DAMAGE, eventData);
            return true;
        }

        const unit = ability.GetOwnerEntity() as CDOTA_BaseNPC;

        let spellCritModifier = undefined;

        if (!unit) {
            CustomEvents.RunEventByName(CustomEvent.CUSTOM_EVENT_ON_PRE_TAKE_DAMAGE, eventData);
            return true;
        } else {
            spellCritModifier = ModifierProperties.CalculateSpellCriticalStrikeMultiplier(unit, ability, event);
        }

        if (spellCritModifier != undefined) {
            event.damage = event.damage * spellCritModifier;
            const roundedDamage = math.floor(event.damage);
            const digits = string.len(tostring(roundedDamage)) + 1;
            const numParticle = ParticleManager.CreateParticle(
                "particles/msg_fx/msg_crit.vpcf",
                ParticleAttachment.ABSORIGIN_FOLLOW,
                EntIndexToHScript(event.entindex_victim_const)
            );
            ParticleManager.SetParticleControl(numParticle, 1, Vector(0, roundedDamage, 4));
            ParticleManager.SetParticleControl(numParticle, 2, Vector(2, digits, 0));
            ParticleManager.SetParticleControl(numParticle, 3, Vector(204, 0, 255));
            ParticleManager.DestroyAndReleaseParticle(numParticle, 2);
        }

        if (unit.GetTeamNumber() == GameSettings.GetSettingValueAsTeamNumber("players_team")) {
            CustomEvents.RunEventByName(CustomEvent.CUSTOM_EVENT_ON_PRE_TAKE_DAMAGE, eventData);
            return true;
        }

        CustomEvents.RunEventByName(CustomEvent.CUSTOM_EVENT_ON_PRE_TAKE_DAMAGE, eventData);
        return true;
    }
}
