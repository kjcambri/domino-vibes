import { Volume2, VolumeX } from 'lucide-react'
import { Button } from '../common/Button'
import { useAppStore } from '../../app/store'
import { playSound, unlockAudio } from '../../features/audio/soundService'
import { cn } from '../../lib/cn'

export function SoundToggleButton({ className }: { className?: string }) {
  const tableSoundEnabled = useAppStore((state) => state.tableSoundEnabled)
  const setTableSoundEnabled = useAppStore((state) => state.setTableSoundEnabled)
  const Icon = tableSoundEnabled ? Volume2 : VolumeX

  async function handleToggle() {
    const nextEnabled = !tableSoundEnabled

    setTableSoundEnabled(nextEnabled)
    await unlockAudio()

    if (nextEnabled) {
      void playSound('ready-up', { enabled: true })
    }
  }

  return (
    <Button
      aria-label={tableSoundEnabled ? 'Mute table sounds' : 'Unmute table sounds'}
      className={cn('gap-2 px-3', className)}
      onClick={handleToggle}
      title={tableSoundEnabled ? 'Mute table sounds' : 'Unmute table sounds'}
      variant="secondary"
    >
      <Icon aria-hidden="true" size={17} />
      <span className="hidden sm:inline">
        {tableSoundEnabled ? 'Sound On' : 'Muted'}
      </span>
    </Button>
  )
}
