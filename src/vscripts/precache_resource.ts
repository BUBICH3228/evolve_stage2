/* eslint-disable @typescript-eslint/no-unused-vars */
function PrecacheAllResource(context: CScriptPrecacheContext) {
    //Sound
    PrecacheResource(PrecacheType.SOUNDFILE, "soundevents/custom/game_sounds_bosses.vsndevts", context);
    PrecacheResource(PrecacheType.SOUNDFILE, "soundevents/custom/game_sounds_items.vsndevts", context);
    PrecacheResource(PrecacheType.SOUNDFILE, "soundevents/custom/game_sounds_debug_panel.vsndevts", context);
    PrecacheResource(PrecacheType.SOUNDFILE, "soundevents/custom/game_sounds_abilities.vsndevts", context);
    PrecacheResource(PrecacheType.SOUNDFILE, "soundevents/custom/heroes/base/game_sounds_base.vsndevts", context);

    //Particle
    PrecacheResource(PrecacheType.PARTICLE, "particles/custom/units/aoe_cast.vpcf", context);
    PrecacheResource(PrecacheType.PARTICLE, "particles/custom/units/electrical_bundle.vpcf", context);
    PrecacheResource(
        PrecacheType.PARTICLE,
        "particles/econ/items/bloodseeker/bloodseeker_crownfall_immortal/bloodseeker_crownfall_immortal_ruptureg.vpcf",
        context
    );
    PrecacheResource(
        PrecacheType.PARTICLE,
        "particles/econ/items/bloodseeker/bloodseeker_ti7/bloodseeker_ti7_thirst_owner_ground.vpcf",
        context
    );
    //Model
    PrecacheResource(PrecacheType.MODEL, "models/props_gameplay/dummy/dummy.vmdl", context);
    PrecacheResource(PrecacheType.MODEL, "models/heroes/oracle/crystal_ball.vmdl", context);
    PrecacheResource(PrecacheType.MODEL, "models/creeps/ancient_giant_skeleton/ancient_giant_skeleton.vmdl", context);

    const heroesList = LoadKeyValues("scripts/npc/npc_heroes_custom.txt");
    const unitsList = LoadKeyValues("scripts/npc/npc_units_custom.txt");

    for (const k in heroesList) {
        if (k != "Version") {
            PrecacheUnitByNameSync(k, context, undefined);
        }
    }

    for (const k in unitsList) {
        if (k != "Version") {
            PrecacheUnitByNameSync(k, context, undefined);
        }
    }
    CustomEvents.RunEventByName(CustomEvent.CUSTOM_EVENT_ON_ADDON_PRECACHE, {
        context: context
    });
}
