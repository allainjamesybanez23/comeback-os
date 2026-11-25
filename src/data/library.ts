import { circuit, cooldown, dailyMobility, days, expansion, foamRows, phases, rehabRows, sundayMobility, warmUp } from './comebackProgram'

/* Every built-in exercise once, by name. */
export const library = [...days.flatMap(day => day.main), ...warmUp, ...rehabRows, ...dailyMobility, ...sundayMobility, ...cooldown, ...foamRows, ...circuit, ...expansion, ...phases.flatMap(phase => phase.rows)]
  .filter((item, i, all) => all.findIndex(other => other.name === item.name) === i)
