/// <reference path="api.d.ts" />
/// <reference path="css.d.ts" />
/// <reference path="events.generated.d.ts" />
/// <reference path="panels.d.ts" />
/// <reference path="stack-trace-api.d.ts" />

type EntityIndex = number & { _entityIndex: never };
type AbilityEntityIndex = EntityIndex & { _abilityEntityIndex: never };
type ItemEntityIndex = AbilityEntityIndex & { _itemEntityIndex: never };

type ScheduleID = number & { readonly __tag__: 'ScheduleID' };
type NetTableListenerID = number & { readonly __tag__: 'NetTableListenerID' };
type GameEventListenerID = number & { readonly __tag__: 'GameEventListenerID' };
type UnhandledEventListenerID = number & { readonly __tag__: 'UnhandledEventListenerID' };

type BuffID = number & { readonly __tag__: 'BuffID' };
type ParticleID = number & { readonly __tag__: 'ParticleID' };
type HeroID = number & { readonly __tag__: 'HeroID' };