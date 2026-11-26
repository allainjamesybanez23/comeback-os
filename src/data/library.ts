import { circuit, cooldown, dailyMobility, days, expansion, foamRows, gripDrills, handleDrills, phases, rehabRows, sundayMobility, warmUp, type Exercise } from './comebackProgram'

/* Every built-in exercise once, by name. */
export const library = [...days.flatMap(day => day.main), ...warmUp, ...rehabRows, ...dailyMobility, ...sundayMobility, ...cooldown, ...foamRows, ...circuit, ...expansion, ...handleDrills, ...gripDrills, ...phases.flatMap(phase => phase.rows)]
  .filter((item, i, all) => all.findIndex(other => other.name === item.name) === i)
/* Progression families, easiest rung first. */
export const families: Record<string, Exercise[]> = {}
for (const item of library) if (item.family) (families[item.family] ??= []).push(item)
for (const list of Object.values(families)) list.sort((a, b) => (a.rung ?? 1) - (b.rung ?? 1))
