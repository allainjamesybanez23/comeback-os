let audio: AudioContext | undefined

export function armAudio() {
  try {
    audio ??= new AudioContext()
    if (audio.state === 'suspended') void audio.resume().catch(() => undefined)
  } catch { /* The visual clock is always available. */ }
}
export function chime(frequency: number, finish = false) {
  if (!audio || audio.state !== 'running') return
  const start = audio.currentTime
  const play = (hz: number, at: number, length: number) => {
    if (!audio) return
    const tone = audio.createOscillator()
    const volume = audio.createGain()
    tone.type = 'sine'
    tone.frequency.value = hz
    volume.gain.setValueAtTime(0.001, at)
    volume.gain.exponentialRampToValueAtTime(0.18, at + 0.016)
    volume.gain.exponentialRampToValueAtTime(0.001, at + length)
    tone.connect(volume)
    volume.connect(audio.destination)
    tone.start(at)
    tone.stop(at + length + 0.015)
  }
  play(frequency, start, finish ? 0.22 : 0.11)
  if (finish) play(frequency * 1.25, start + 0.12, 0.26)
}
export function tempoTicks(value: string) {
  const tempo = value.split('-').map(Number)
  if (tempo.length !== 3 || tempo.some(number => !Number.isInteger(number) || number < 0 || number > 10)) return []
  return tempo.flatMap((seconds, phase) => Array.from({ length: seconds }, (_, tick) => ({
    tone: phase === 0 ? 365 : phase === 1 ? 560 : 820, phase: ['Lower','Pause','Drive'][phase], count: tick + 1,
  })))
}
