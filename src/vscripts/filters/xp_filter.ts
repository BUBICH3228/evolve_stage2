export class XPFilter {
    static Init(gme: CDOTABaseGameMode) {
        gme.SetModifyExperienceFilter((event) => this.OnFilter(event), this);
    }

    static OnFilter(event: ModifyExperienceFilterEvent): boolean {
        const eventData = {
            attacker: EntIndexToHScript(event.hero_entindex_const) as CDOTA_BaseNPC,
            victim: EntIndexToHScript(event.source_entindex_const) as CDOTA_BaseNPC,
            reason: event.reason_const,
            experience: event.experience
        };

        if (eventData.victim.IsRealHero()) {
            event.experience = 4;
            return true;
        }

        if (eventData.attacker.GetTeam() == DotaTeam.GOODGUYS) {
            return false;
        }

        return true;
    }
}
