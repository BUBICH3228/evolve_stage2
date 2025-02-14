function PrecacheAllResource(context: CScriptPrecacheContext) {
    //Sound
    PrecacheResource(PrecacheType.SOUNDFILE, "soundevents/custom/game_sounds_bosses.vsndevts", context);
    PrecacheResource(PrecacheType.SOUNDFILE, "soundevents/custom/game_sounds_items.vsndevts", context);
    PrecacheResource(PrecacheType.SOUNDFILE, "soundevents/custom/game_sounds_debug_panel.vsndevts", context);
    PrecacheResource(PrecacheType.SOUNDFILE, "soundevents/custom/game_sounds_abilities.vsndevts", context);
    PrecacheResource(PrecacheType.SOUNDFILE, "soundevents/custom/heroes/base/game_sounds_base.vsndevts", context);

    //Particle
    PrecacheResource(PrecacheType.PARTICLE, "particles/custom/units/aoe_cast.vpcf", context);
    //Model
    PrecacheResource(PrecacheType.MODEL, "models/props_gameplay/dummy/dummy.vmdl", context);
    CustomEvents.RunEventByName(CustomEvent.CUSTOM_EVENT_ON_ADDON_PRECACHE, {
        context: context
    });
}
