/* Offline voice coach. Uses the local Windows voices through the Web Speech API;
   network voices are skipped so cues keep working without internet. */
let chosen: SpeechSynthesisVoice | undefined
function voice() {
  if (chosen) return chosen
  const all = speechSynthesis.getVoices()
  chosen = all.find(v => v.localService && /^en[-_]US/i.test(v.lang)) ?? all.find(v => v.localService && v.lang.startsWith('en')) ?? all.find(v => v.localService)
  return chosen
}
if (typeof speechSynthesis !== 'undefined') speechSynthesis.addEventListener?.('voiceschanged', () => { chosen = undefined })

export function speak(text: string, enabled = true, interrupt = true) {
  if (!enabled || typeof speechSynthesis === 'undefined' || !text) return
  try {
    if (interrupt) speechSynthesis.cancel()
    const line = new SpeechSynthesisUtterance(text)
    const v = voice()
    if (v) line.voice = v
    line.rate = 1.05
    line.pitch = 1
    speechSynthesis.speak(line)
  } catch { /* Visual cues remain available. */ }
}
export function hush() {
  try { if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel() } catch { /* ignore */ }
}
export function spokenDose(reps: string) {
  return reps
    .replace(/\s*\/\s*(leg|side|arm|foot)/g, ' per $1')
    .replace(/(\d)\s*s\b/g, '$1 seconds')
    .replace(/(\d)\s*min\b/g, '$1 minutes')
    .replace(/×/g, 'by')
    .replace(/–/g, ' to ')
    .replace(/^(\d+)$/, '$1 reps')
}
