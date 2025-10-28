# Terminal Sound Effects

This directory contains sound effects for the terminal application.

For Contributors:
Replace the sound logic in alien theme with these copyrightfree original sounds.

## Required Sound Files

### Alien/Nostromo Theme
- `alien-boot.mp3` - MU/TH/UR 6000 system startup sound (low mechanical hum with beeps)
- `alien-keypress.mp3` - Mechanical keyboard click (clacky, industrial)
- `alien-beep.mp3` - System acknowledgment beep (short, electronic)
- `alien-error.mp3` - Error/warning tone (ominous, low frequency)

### Default Terminal
- `terminal-boot.mp3` - Standard terminal startup chime
- `keypress.mp3` - Subtle keyboard click
- `beep.mp3` - Classic system bell sound

### Retro/Apple-II Theme
- `retro-boot.mp3` - CRT monitor warmup sound (electrical hum)
- `retro-keypress.mp3` - Mechanical switch click

## Sound Sources

### For Alien Sounds (Free Resources):
1. **Freesound.org** - Search for:
   - "mechanical keyboard"
   - "computer beep"
   - "synthesizer tone"
   - "spaceship computer"

2. **Recommended Specific Sounds**:
   - Use low-frequency (80-120Hz) tones for alien-boot
   - Sharp, clicky sounds for alien-keypress
   - Single beep 440Hz for alien-beep
   - Warning klaxon or low tone for alien-error

### Creating Your Own (Free Tools):
- **Audacity** (Free audio editor)
- **LMMS** (Free music production)
- **BeepBox** (Online synthesizer)

## Format Requirements
- Format: MP3
- Bitrate: 128kbps or higher
- Sample Rate: 44.1kHz
- Duration: 
  - Boot sounds: 2-4 seconds
  - Keypress: 0.05-0.1 seconds
  - Beeps: 0.2-0.5 seconds
  - Errors: 0.5-1 second

## Implementation Status
✅ SoundService.js created with full API
✅ Terminal integration ready
⏳ Sound files need to be downloaded/created
⏳ Test with actual audio files

## Usage in Code
```javascript
// Play boot sound
soundService.playBootSound('alien');

// Play keypress (quiet)
soundService.playKeypressSound('alien');

// Toggle sounds on/off
soundService.toggle();
```

## Attribution
When using sounds from Freesound.org, add credits to the footer or about section.
