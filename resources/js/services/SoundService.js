/**
 * SoundService - Handle terminal sound effects
 */
class SoundService {
    constructor() {
        this.sounds = {};
        this.enabled = this.loadPreference();
        this.volume = 0.3;
        this.audioContext = null;
        
        // Ambient noise components
        this.ambientNoiseSource = null;
        this.ambientNoiseGain = null;
        this.ambientLowHumOsc = null;
        this.ambientLowHumGain = null;
        this.ambientElectricOsc = null;
        this.ambientElectricGain = null;
        
        this.initializeSounds();
        this.initializeAudioContext();
    }

    /**
     * Initialize Web Audio API context
     */
    initializeAudioContext() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioContext = new AudioContext();
            }
        } catch (e) {
            console.warn('Web Audio API not available:', e);
        }
    }

    /**
     * Generate a beep sound using Web Audio API
     */
    generateBeep(frequency = 440, duration = 0.2, type = 'sine') {
        if (!this.audioContext || !this.enabled) return;

        try {
            // Resume audio context if suspended (for autoplay policy)
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = type;

            // Envelope for smooth sound
            const now = this.audioContext.currentTime;
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(this.volume, now + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

            oscillator.start(now);
            oscillator.stop(now + duration);
        } catch (error) {
            console.warn('Failed to generate beep:', error);
        }
    }

    /**
     * Generate Alien/Nostromo style beep (lower frequency, robotic)
     */
    generateAlienBeep() {
        if (!this.audioContext || !this.enabled) return;

        try {
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            const now = this.audioContext.currentTime;
            
            // Create a distinctive two-tone beep
            const oscillator1 = this.audioContext.createOscillator();
            const oscillator2 = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator1.connect(gainNode);
            oscillator2.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            // Low frequency harmonics for industrial feel
            oscillator1.frequency.value = 180;
            oscillator2.frequency.value = 240;
            oscillator1.type = 'square';
            oscillator2.type = 'sawtooth';

            // Quick attack, medium decay
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(this.volume * 0.8, now + 0.005);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

            oscillator1.start(now);
            oscillator2.start(now);
            oscillator1.stop(now + 0.15);
            oscillator2.stop(now + 0.15);
        } catch (error) {
            console.warn('Failed to generate alien beep:', error);
        }
    }

    /**
     * Generate retro CRT style beep
     */
    generateRetroBeep() {
        this.generateBeep(800, 0.15, 'square');
    }

    /**
     * Generate Alien/Nostromo MOTHER computer boot sound
     * Synthetic flat flute sequence: D5 then F5
     */
    generateAlienBootSound() {
        if (!this.audioContext || !this.enabled) return;

        try {
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            const now = this.audioContext.currentTime;
            
            // === Background: Heavy industrial machinery hum with metal resonance ===
            const hum = this.audioContext.createOscillator();
            const humGain = this.audioContext.createGain();
            const humFilter = this.audioContext.createBiquadFilter();
            const humDistortion = this.audioContext.createWaveShaper();
            
            // Sawtooth for more aggressive machinery sound
            hum.type = 'sawtooth';
            hum.frequency.value = 45; // Lower, more menacing
            
            // Create distortion curve for metallic grind
            const curve = new Float32Array(256);
            for (let i = 0; i < 256; i++) {
                const x = (i - 128) / 128;
                // Harsh distortion for machinery grinding
                curve[i] = Math.tanh(x * 3) * 0.8;
            }
            humDistortion.curve = curve;
            humDistortion.oversample = '4x';
            
            // Bandpass for metallic resonance
            humFilter.type = 'bandpass';
            humFilter.frequency.value = 180;
            humFilter.Q.value = 8; // High Q for metallic ring
            
            hum.connect(humDistortion);
            humDistortion.connect(humFilter);
            humFilter.connect(humGain);
            humGain.connect(this.audioContext.destination);
            
            humGain.gain.setValueAtTime(0, now);
            humGain.gain.linearRampToValueAtTime(this.volume * 0.15, now + 0.15);
            humGain.gain.setValueAtTime(this.volume * 0.15, now + 1.4);
            humGain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);
            
            hum.start(now);
            hum.stop(now + 1.6);

            // === Add servo motor whine/wind-up ===
            const servo = this.audioContext.createOscillator();
            const servoGain = this.audioContext.createGain();
            const servoFilter = this.audioContext.createBiquadFilter();
            
            servo.type = 'sawtooth';
            servo.frequency.setValueAtTime(800, now);
            servo.frequency.exponentialRampToValueAtTime(2200, now + 0.08); // Fast wind-up
            servo.frequency.setValueAtTime(2200, now + 0.08);
            servo.frequency.exponentialRampToValueAtTime(100, now + 0.2); // Wind down
            
            servoFilter.type = 'bandpass';
            servoFilter.frequency.value = 1200;
            servoFilter.Q.value = 5;
            
            servo.connect(servoFilter);
            servoFilter.connect(servoGain);
            servoGain.connect(this.audioContext.destination);
            
            servoGain.gain.setValueAtTime(0, now);
            servoGain.gain.linearRampToValueAtTime(this.volume * 0.2, now + 0.03);
            servoGain.gain.exponentialRampToValueAtTime(0.001, now + 0.23);
            
            servo.start(now);
            servo.stop(now + 0.25);

            // === D5 - Ominous tone with distortion and metallic overtones ===
            const d5Main = this.audioContext.createOscillator();
            const d5Sub = this.audioContext.createOscillator(); // Sub-harmonic for weight
            const d5Overtone = this.audioContext.createOscillator(); // Harsh overtone
            const d5Gain = this.audioContext.createGain();
            const d5SubGain = this.audioContext.createGain();
            const d5OvertoneGain = this.audioContext.createGain();
            const d5Filter = this.audioContext.createBiquadFilter();
            const d5Distortion = this.audioContext.createWaveShaper();
            
            // Main tone - square with distortion
            d5Main.type = 'square';
            d5Main.frequency.value = 587.33; // D5
            
            // Sub-harmonic for ominous weight
            d5Sub.type = 'triangle';
            d5Sub.frequency.value = 587.33 / 2; // Octave down
            
            // Harsh metallic overtone
            d5Overtone.type = 'sawtooth';
            d5Overtone.frequency.value = 587.33 * 1.5;
            
            // Aggressive distortion curve
            const d5Curve = new Float32Array(256);
            for (let i = 0; i < 256; i++) {
                const x = (i - 128) / 128;
                d5Curve[i] = Math.tanh(x * 4) * 0.9; // More aggressive
            }
            d5Distortion.curve = d5Curve;
            d5Distortion.oversample = '4x';
            
            // Lowpass with resonance for metallic character
            d5Filter.type = 'lowpass';
            d5Filter.frequency.setValueAtTime(3000, now + 0.05);
            d5Filter.frequency.exponentialRampToValueAtTime(600, now + 0.18); // Sweep for çiuuw
            d5Filter.frequency.setValueAtTime(600, now + 0.75);
            d5Filter.Q.value = 6; // High resonance for metallic ring
            
            // Connect main signal through distortion and filter
            d5Main.connect(d5Distortion);
            d5Distortion.connect(d5Filter);
            d5Filter.connect(d5Gain);
            
            // Connect sub and overtone
            d5Sub.connect(d5SubGain);
            d5SubGain.connect(d5Gain);
            d5Overtone.connect(d5OvertoneGain);
            d5OvertoneGain.connect(d5Gain);
            
            d5Gain.connect(this.audioContext.destination);
            
            // Main envelope - more aggressive attack
            d5Gain.gain.setValueAtTime(0, now + 0.05);
            d5Gain.gain.linearRampToValueAtTime(this.volume * 0.45, now + 0.07);
            d5Gain.gain.setValueAtTime(this.volume * 0.45, now + 0.73);
            d5Gain.gain.linearRampToValueAtTime(0, now + 0.78);
            
            // Sub harmonic envelope
            d5SubGain.gain.setValueAtTime(this.volume * 0.15, now + 0.05);
            d5SubGain.gain.setValueAtTime(this.volume * 0.15, now + 0.73);
            d5SubGain.gain.linearRampToValueAtTime(0, now + 0.78);
            
            // Overtone envelope - fades in for scariness
            d5OvertoneGain.gain.setValueAtTime(0, now + 0.05);
            d5OvertoneGain.gain.linearRampToValueAtTime(this.volume * 0.12, now + 0.25);
            d5OvertoneGain.gain.setValueAtTime(this.volume * 0.12, now + 0.73);
            d5OvertoneGain.gain.linearRampToValueAtTime(0, now + 0.78);
            
            d5Main.start(now + 0.05);
            d5Main.stop(now + 0.78);
            d5Sub.start(now + 0.05);
            d5Sub.stop(now + 0.78);
            d5Overtone.start(now + 0.05);
            d5Overtone.stop(now + 0.78);

            // === F5 - Short mechanical pulse with impact ===
            // Starts at 0.75s (half of original 1.5s timing)
            setTimeout(() => {
                const f5Main = this.audioContext.createOscillator();
                const f5Sub = this.audioContext.createOscillator();
                const f5Impact = this.audioContext.createOscillator(); // Metallic click
                const f5Gain = this.audioContext.createGain();
                const f5SubGain = this.audioContext.createGain();
                const f5ImpactGain = this.audioContext.createGain();
                const f5Filter = this.audioContext.createBiquadFilter();
                const f5Distortion = this.audioContext.createWaveShaper();
                
                f5Main.type = 'square';
                f5Main.frequency.value = 698.46; // F5
                
                // Sub for weight
                f5Sub.type = 'triangle';
                f5Sub.frequency.value = 698.46 / 2;
                
                // Metallic impact click
                f5Impact.type = 'square';
                f5Impact.frequency.value = 4000;
                
                // Harsh distortion
                const f5Curve = new Float32Array(256);
                for (let i = 0; i < 256; i++) {
                    const x = (i - 128) / 128;
                    f5Curve[i] = Math.tanh(x * 5) * 0.95;
                }
                f5Distortion.curve = f5Curve;
                f5Distortion.oversample = '4x';
                
                f5Filter.type = 'lowpass';
                f5Filter.frequency.value = 1800;
                f5Filter.Q.value = 5;
                
                f5Main.connect(f5Distortion);
                f5Distortion.connect(f5Filter);
                f5Filter.connect(f5Gain);
                f5Sub.connect(f5SubGain);
                f5SubGain.connect(f5Gain);
                f5Impact.connect(f5ImpactGain);
                f5ImpactGain.connect(f5Gain);
                f5Gain.connect(this.audioContext.destination);
                
                const t = this.audioContext.currentTime;
                
                // Aggressive punch
                f5Gain.gain.setValueAtTime(0, t);
                f5Gain.gain.linearRampToValueAtTime(this.volume * 0.5, t + 0.01);
                f5Gain.gain.setValueAtTime(this.volume * 0.5, t + 0.23);
                f5Gain.gain.linearRampToValueAtTime(0, t + 0.26);
                
                // Sub envelope
                f5SubGain.gain.setValueAtTime(this.volume * 0.18, t);
                f5SubGain.gain.setValueAtTime(this.volume * 0.18, t + 0.23);
                f5SubGain.gain.linearRampToValueAtTime(0, t + 0.26);
                
                // Impact click - very short
                f5ImpactGain.gain.setValueAtTime(this.volume * 0.25, t);
                f5ImpactGain.gain.exponentialRampToValueAtTime(0.001, t + 0.015);
                
                f5Main.start(t);
                f5Main.stop(t + 0.27);
                f5Sub.start(t);
                f5Sub.stop(t + 0.27);
                f5Impact.start(t);
                f5Impact.stop(t + 0.015);
            }, 750); // Half of original 1500ms

        } catch (error) {
            console.warn('Failed to generate alien boot sound:', error);
        }
    }

    /**
     * Generate retro CRT boot sound (warmup hum)
     */
    generateRetroBootSound() {
        if (!this.audioContext || !this.enabled) return;

        try {
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            const now = this.audioContext.currentTime;
            
            // CRT warmup with frequency sweep
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(15000, now);
            oscillator.frequency.exponentialRampToValueAtTime(100, now + 1.5);
            
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(this.volume * 0.2, now + 0.3);
            gainNode.gain.setValueAtTime(this.volume * 0.2, now + 1.2);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 1.8);
            
            oscillator.start(now);
            oscillator.stop(now + 1.8);
        } catch (error) {
            console.warn('Failed to generate retro boot sound:', error);
        }
    }

    /**
     * Generate standard terminal boot chime
     */
    generateDefaultBootSound() {
        if (!this.audioContext || !this.enabled) return;

        try {
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            const now = this.audioContext.currentTime;
            
            // Pleasant startup chord
            [440, 554.37, 659.25].forEach((freq, index) => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                
                osc.connect(gain);
                gain.connect(this.audioContext.destination);
                
                osc.type = 'sine';
                osc.frequency.value = freq;
                
                const delay = index * 0.05;
                gain.gain.setValueAtTime(0, now + delay);
                gain.gain.linearRampToValueAtTime(this.volume * 0.3, now + delay + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.4);
                
                osc.start(now + delay);
                osc.stop(now + delay + 0.4);
            });
        } catch (error) {
            console.warn('Failed to generate default boot sound:', error);
        }
    }

    /**
     * Generate typing sound for Alien theme (mechanical keyboard with solenoid)
     * Simulates heavy mechanical switches with metallic resonance
     */
    generateAlienKeypress() {
        if (!this.audioContext || !this.enabled) return;

        try {
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            const now = this.audioContext.currentTime;
            
            // === Key Down Phase ===
            // Initial impact - sharp metallic click
            const impactOsc = this.audioContext.createOscillator();
            const impactGain = this.audioContext.createGain();
            const impactFilter = this.audioContext.createBiquadFilter();
            
            impactOsc.type = 'square';
            impactOsc.frequency.value = 2200 + Math.random() * 300; // Slight variation per key
            
            impactFilter.type = 'bandpass';
            impactFilter.frequency.value = 2400;
            impactFilter.Q.value = 3;
            
            impactOsc.connect(impactFilter);
            impactFilter.connect(impactGain);
            impactGain.connect(this.audioContext.destination);
            
            // Very sharp attack for mechanical feel
            impactGain.gain.setValueAtTime(this.volume * 0.25, now);
            impactGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
            
            impactOsc.start(now);
            impactOsc.stop(now + 0.015);
            
            // === Switch Contact - Lower frequency component ===
            const switchOsc = this.audioContext.createOscillator();
            const switchGain = this.audioContext.createGain();
            
            switchOsc.type = 'sawtooth';
            switchOsc.frequency.value = 180 + Math.random() * 40;
            
            switchOsc.connect(switchGain);
            switchGain.connect(this.audioContext.destination);
            
            switchGain.gain.setValueAtTime(0, now);
            switchGain.gain.linearRampToValueAtTime(this.volume * 0.15, now + 0.003);
            switchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
            
            switchOsc.start(now);
            switchOsc.stop(now + 0.025);
            
            // === Spring Resonance - Metallic ring ===
            const springOsc = this.audioContext.createOscillator();
            const springGain = this.audioContext.createGain();
            const springFilter = this.audioContext.createBiquadFilter();
            
            springOsc.type = 'sine';
            springOsc.frequency.value = 4800 + Math.random() * 400; // High metallic frequency
            
            springFilter.type = 'bandpass';
            springFilter.frequency.value = 5000;
            springFilter.Q.value = 8; // Very narrow resonance
            
            springOsc.connect(springFilter);
            springFilter.connect(springGain);
            springGain.connect(this.audioContext.destination);
            
            springGain.gain.setValueAtTime(0, now + 0.005);
            springGain.gain.linearRampToValueAtTime(this.volume * 0.08, now + 0.008);
            springGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
            
            springOsc.start(now + 0.005);
            springOsc.stop(now + 0.04);
            
        } catch (error) {
            console.warn('Failed to generate alien keypress:', error);
        }
    }

    /**
     * Start continuous Eb5 tone for alien cat command (line typing)
     * Returns oscillator and gain nodes so they can be stopped when line is complete
     */
    startAlienCatLineTone() {
        if (!this.audioContext || !this.enabled) return null;

        try {
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            const now = this.audioContext.currentTime;
            
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            osc.type = 'sine';
            osc.frequency.value = 622.25; // Eb5
            
            filter.type = 'bandpass';
            filter.frequency.value = 622.25;
            filter.Q.value = 12;
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.audioContext.destination);
            
            // Fade in quickly
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(this.volume * 0.15, now + 0.05);
            
            osc.start(now);
            
            return { osc, gain };
        } catch (error) {
            console.warn('Failed to start alien cat line tone:', error);
            return null;
        }
    }

    /**
     * Stop the continuous Eb5 tone with fade out
     */
    stopAlienCatLineTone(nodes) {
        if (!nodes || !this.audioContext) return;

        try {
            const now = this.audioContext.currentTime;
            
            // Fade out quickly
            nodes.gain.gain.cancelScheduledValues(now);
            nodes.gain.gain.setValueAtTime(nodes.gain.gain.value, now);
            nodes.gain.gain.linearRampToValueAtTime(0, now + 0.05);
            
            nodes.osc.stop(now + 0.05);
        } catch (error) {
            console.warn('Failed to stop alien cat line tone:', error);
        }
    }

    /**
     * Play A4 tone for alien cat command
     */
    playAlienCatA4(duration = 0.2) {
        if (!this.audioContext || !this.enabled) return;

        try {
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            const now = this.audioContext.currentTime;
            
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            osc.type = 'sine';
            osc.frequency.value = 440.00; // A4
            
            filter.type = 'bandpass';
            filter.frequency.value = 440.00;
            filter.Q.value = 12;
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.audioContext.destination);
            
            // Quick beep
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(this.volume * 0.2, now + 0.02);
            gain.gain.setValueAtTime(this.volume * 0.2, now + duration - 0.02);
            gain.gain.linearRampToValueAtTime(0, now + duration);
            
            osc.start(now);
            osc.stop(now + duration);
        } catch (error) {
            console.warn('Failed to play alien cat A4:', error);
        }
    }

    /**
     * Play Db5 tone for alien cat command
     */
    playAlienCatDb5(duration = 0.1) {
        if (!this.audioContext || !this.enabled) return;

        try {
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            const now = this.audioContext.currentTime;
            
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            osc.type = 'sine';
            osc.frequency.value = 554.37; // Db5
            
            filter.type = 'bandpass';
            filter.frequency.value = 554.37;
            filter.Q.value = 12;
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.audioContext.destination);
            
            // Quick beep
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(this.volume * 0.2, now + 0.02);
            gain.gain.setValueAtTime(this.volume * 0.2, now + duration - 0.02);
            gain.gain.linearRampToValueAtTime(0, now + duration);
            
            osc.start(now);
            osc.stop(now + duration);
        } catch (error) {
            console.warn('Failed to play alien cat Db5:', error);
        }
    }

    /**
     * Play F5 beep for alien cat command (line break)
     */
    playAlienCatLineBreak(duration = 0.1) {
        if (!this.audioContext || !this.enabled) return;

        try {
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            const now = this.audioContext.currentTime;
            
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            osc.type = 'sine';
            osc.frequency.value = 698.46; // F5
            
            filter.type = 'bandpass';
            filter.frequency.value = 698.46;
            filter.Q.value = 12;
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.audioContext.destination);
            
            // Quick beep
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(this.volume * 0.2, now + 0.02);
            gain.gain.setValueAtTime(this.volume * 0.2, now + duration - 0.02);
            gain.gain.linearRampToValueAtTime(0, now + duration);
            
            osc.start(now);
            osc.stop(now + duration);
        } catch (error) {
            console.warn('Failed to play alien cat line break:', error);
        }
    }

    /**
     * Generate typing sound for retro theme (mechanical typewriter)
     */
    generateRetroKeypress() {
        if (!this.audioContext || !this.enabled) return;

        try {
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            const now = this.audioContext.currentTime;
            
            // Typewriter-style click
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            
            osc.type = 'square';
            osc.frequency.value = 2000 + Math.random() * 500; // Slight variation
            
            gain.gain.setValueAtTime(this.volume * 0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.015);
            
            osc.start(now);
            osc.stop(now + 0.015);
        } catch (error) {
            console.warn('Failed to generate retro keypress:', error);
        }
    }

    /**
     * Generate typing sound for default theme (soft click)
     */
    generateDefaultKeypress() {
        if (!this.audioContext || !this.enabled) return;

        try {
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            const now = this.audioContext.currentTime;
            
            // Soft keyboard click
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            
            osc.type = 'sine';
            osc.frequency.value = 800;
            
            gain.gain.setValueAtTime(this.volume * 0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.01);
            
            osc.start(now);
            osc.stop(now + 0.01);
        } catch (error) {
            console.warn('Failed to generate default keypress:', error);
        }
    }

    /**
     * Generate Tab key sound (different from regular keypress)
     * Alien theme: Heavier mechanical shift
     */
    generateTabSound(theme = 'default') {
        if (!this.audioContext || !this.enabled) return;

        try {
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            const now = this.audioContext.currentTime;
            
            if (theme === 'alien') {
                // Alien: Heavier mechanical TAB with carriage-like sound
                // Initial heavy impact
                const impact = this.audioContext.createOscillator();
                const impactGain = this.audioContext.createGain();
                const impactFilter = this.audioContext.createBiquadFilter();
                
                impact.type = 'sawtooth';
                impact.frequency.value = 150;
                impactFilter.type = 'lowpass';
                impactFilter.frequency.value = 600;
                impactFilter.Q.value = 2;
                
                impact.connect(impactFilter);
                impactFilter.connect(impactGain);
                impactGain.connect(this.audioContext.destination);
                
                impactGain.gain.setValueAtTime(this.volume * 0.35, now);
                impactGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                
                impact.start(now);
                impact.stop(now + 0.08);
                
                // Mechanical slide/shift sound
                const slide = this.audioContext.createOscillator();
                const slideGain = this.audioContext.createGain();
                const slideFilter = this.audioContext.createBiquadFilter();
                
                slide.type = 'square';
                slideFilter.type = 'bandpass';
                slideFilter.frequency.value = 1200;
                slideFilter.Q.value = 4;
                
                slide.connect(slideFilter);
                slideFilter.connect(slideGain);
                slideGain.connect(this.audioContext.destination);
                
                slide.frequency.setValueAtTime(800, now + 0.01);
                slide.frequency.exponentialRampToValueAtTime(1400, now + 0.06);
                
                slideGain.gain.setValueAtTime(0, now + 0.01);
                slideGain.gain.linearRampToValueAtTime(this.volume * 0.2, now + 0.02);
                slideGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                
                slide.start(now + 0.01);
                slide.stop(now + 0.08);
                
            } else {
                // Default: Higher pitched tab sound
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                osc.connect(gain);
                gain.connect(this.audioContext.destination);
                osc.type = 'triangle';
                osc.frequency.value = 1200;
                gain.gain.setValueAtTime(this.volume * 0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
                osc.start(now);
                osc.stop(now + 0.04);
            }
        } catch (error) {
            console.warn('Failed to generate tab sound:', error);
        }
    }

    /**
     * Generate Enter key sound
     * Alien theme: Authoritative command confirmation
     */
    generateEnterSound(theme = 'default') {
        if (!this.audioContext || !this.enabled) return;

        try {
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            const now = this.audioContext.currentTime;
            
            if (theme === 'alien') {
                // Alien: Authoritative two-tone confirmation
                // Low frequency component - command received
                const lowOsc = this.audioContext.createOscillator();
                const lowGain = this.audioContext.createGain();
                
                lowOsc.type = 'square';
                lowOsc.frequency.value = 220;
                lowOsc.connect(lowGain);
                lowGain.connect(this.audioContext.destination);
                
                lowGain.gain.setValueAtTime(this.volume * 0.3, now);
                lowGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
                
                lowOsc.start(now);
                lowOsc.stop(now + 0.12);
                
                // High frequency component - command confirmed
                const highOsc = this.audioContext.createOscillator();
                const highGain = this.audioContext.createGain();
                
                highOsc.type = 'sine';
                highOsc.frequency.value = 660;
                highOsc.connect(highGain);
                highGain.connect(this.audioContext.destination);
                
                highGain.gain.setValueAtTime(0, now + 0.04);
                highGain.gain.linearRampToValueAtTime(this.volume * 0.25, now + 0.045);
                highGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
                
                highOsc.start(now + 0.04);
                highOsc.stop(now + 0.12);
                
            } else {
                // Default: Satisfying confirmation
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                osc.connect(gain);
                gain.connect(this.audioContext.destination);
                osc.type = 'sine';
                osc.frequency.value = 660;
                gain.gain.setValueAtTime(this.volume * 0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
                osc.start(now);
                osc.stop(now + 0.08);
            }
        } catch (error) {
            console.warn('Failed to generate enter sound:', error);
        }
    }

    /**
     * Generate command success sound
     */
    generateSuccessSound(theme = 'default') {
        if (!this.audioContext || !this.enabled) return;

        try {
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            const now = this.audioContext.currentTime;
            
            // Pleasant ascending tone
            [440, 554, 659].forEach((freq, index) => {
                setTimeout(() => {
                    const osc = this.audioContext.createOscillator();
                    const gain = this.audioContext.createGain();
                    osc.connect(gain);
                    gain.connect(this.audioContext.destination);
                    osc.type = 'sine';
                    osc.frequency.value = freq;
                    const t = this.audioContext.currentTime;
                    gain.gain.setValueAtTime(this.volume * 0.15, t);
                    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
                    osc.start(t);
                    osc.stop(t + 0.15);
                }, index * 80);
            });
        } catch (error) {
            console.warn('Failed to generate success sound:', error);
        }
    }

    /**
     * Initialize sound library
     */
    initializeSounds() {
        this.sounds = {
            // Alien/Nostromo sounds
            alienBoot: {
                url: '/sounds/alien-boot.mp3',
                description: 'MU/TH/UR system startup'
            },
            alienKeypress: {
                url: '/sounds/alien-keypress.mp3',
                description: 'Mechanical keyboard click'
            },
            alienBeep: {
                url: '/sounds/alien-beep.mp3',
                description: 'System beep'
            },
            alienError: {
                url: '/sounds/alien-error.mp3',
                description: 'Error tone'
            },
            
            // Default terminal sounds
            terminalBoot: {
                url: '/sounds/terminal-boot.mp3',
                description: 'Terminal startup'
            },
            keypress: {
                url: '/sounds/keypress.mp3',
                description: 'Keyboard click'
            },
            beep: {
                url: '/sounds/beep.mp3',
                description: 'Bell sound'
            },
            
            // Retro sounds
            retroBoot: {
                url: '/sounds/retro-boot.mp3',
                description: 'CRT warmup'
            },
            retroKeypress: {
                url: '/sounds/retro-keypress.mp3',
                description: 'Mechanical switch'
            }
        };
    }

    /**
     * Play a sound effect
     */
    play(soundName, options = {}) {
        if (!this.enabled) return;
        
        const sound = this.sounds[soundName];
        if (!sound) {
            console.warn(`Sound not found: ${soundName}`);
            return;
        }

        // Try to load audio file, fallback to generated sound
        try {
            const audio = new Audio(sound.url);
            audio.volume = options.volume || this.volume;
            
            audio.play().catch(err => {
                // File not found or autoplay blocked - use generated sound
                console.debug('Audio file not available, using generated sound');
                this.playFallbackSound(soundName);
            });
        } catch (error) {
            console.warn('Failed to play sound, using fallback:', error);
            this.playFallbackSound(soundName);
        }
    }

    /**
     * Play fallback generated sound when audio files are unavailable
     */
    playFallbackSound(soundName) {
        if (soundName.includes('alien')) {
            this.generateAlienBeep();
        } else if (soundName.includes('retro')) {
            this.generateRetroBeep();
        } else {
            this.generateBeep(440, 0.2, 'sine');
        }
    }

    /**
     * Play boot sound based on theme
     */
    playBootSound(theme = 'default') {
        if (!this.enabled) return;
        
        switch(theme) {
            case 'alien':
                this.generateAlienBootSound();
                break;
            case 'retro':
            case 'apple-ii':
                this.generateRetroBootSound();
                break;
            case 'tron':
            case 'cyberpunk':
                this.generateDefaultBootSound();
                break;
            default:
                this.generateDefaultBootSound();
        }
    }

    /**
     * Play keypress sound based on theme
     */
    playKeypressSound(theme = 'default') {
        if (!this.enabled) return;
        
        switch(theme) {
            case 'alien':
                this.generateAlienKeypress();
                break;
            case 'retro':
            case 'apple-ii':
                this.generateRetroKeypress();
                break;
            case 'hacker':
            case 'matrix':
                // Rapid, digital sound for hacker themes
                this.generateBeep(1500, 0.008, 'square');
                break;
            default:
                this.generateDefaultKeypress();
        }
    }

    /**
     * Play system beep
     */
    playBeep(theme = 'default') {
        if (theme === 'alien') {
            this.generateAlienBeep();
        } else if (theme === 'retro' || theme === 'apple-ii') {
            this.generateRetroBeep();
        } else {
            this.generateBeep(440, 0.2, 'sine');
        }
    }

    /**
     * Play error sound
     */
    playError(theme = 'default') {
        if (theme === 'alien') {
            this.generateBeep(120, 0.3, 'square'); // Low warning tone
        } else {
            this.generateBeep(200, 0.25, 'sawtooth');
        }
    }

    /**
     * Start continuous ambient static for alien theme
     * Multi-layered atmospheric soundscape with tape hiss, electrical hum, and interference
     */
    startAmbientStatic() {
        if (!this.audioContext || !this.enabled || this.ambientNoiseSource) return;

        try {
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            // === LAYER 1: High-Frequency Tape Hiss ===
            const bufferSize = this.audioContext.sampleRate * 3; // 3-second buffer for variation
            const noiseBuffer = this.audioContext.createBuffer(2, bufferSize, this.audioContext.sampleRate);
            
            // Generate stereo pink noise with slight channel differences
            for (let channel = 0; channel < 2; channel++) {
                const noiseData = noiseBuffer.getChannelData(channel);
                let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
                
                for (let i = 0; i < bufferSize; i++) {
                    const white = Math.random() * 2 - 1;
                    // Pink noise filter cascade
                    b0 = 0.99886 * b0 + white * 0.0555179;
                    b1 = 0.99332 * b1 + white * 0.0750759;
                    b2 = 0.96900 * b2 + white * 0.1538520;
                    b3 = 0.86650 * b3 + white * 0.3104856;
                    b4 = 0.55000 * b4 + white * 0.5329522;
                    b5 = -0.7616 * b5 - white * 0.0168980;
                    
                    // Add occasional crackles for tape imperfections
                    const crackle = (Math.random() > 0.998) ? (Math.random() * 0.3) : 0;
                    noiseData[i] = ((b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11) + crackle;
                    b6 = white * 0.115926;
                }
            }

            // Create buffer source for tape hiss
            this.ambientNoiseSource = this.audioContext.createBufferSource();
            this.ambientNoiseSource.buffer = noiseBuffer;
            this.ambientNoiseSource.loop = true;
            this.ambientNoiseSource.playbackRate.value = 0.98 + Math.random() * 0.04; // Slight speed variation

            // High-pass filter for tape hiss character (2-6kHz range)
            const noiseFilter = this.audioContext.createBiquadFilter();
            noiseFilter.type = 'highpass';
            noiseFilter.frequency.value = 2800;
            noiseFilter.Q.value = 0.7;

            // Gain for tape hiss
            this.ambientNoiseGain = this.audioContext.createGain();
            this.ambientNoiseGain.gain.value = this.volume * 0.06; // Slightly more audible

            // Connect tape hiss chain
            this.ambientNoiseSource.connect(noiseFilter);
            noiseFilter.connect(this.ambientNoiseGain);
            this.ambientNoiseGain.connect(this.audioContext.destination);

            // === LAYER 2: Deep Electrical Hum (50Hz + harmonics) ===
            this.ambientLowHumOsc = this.audioContext.createOscillator();
            this.ambientLowHumGain = this.audioContext.createGain();
            
            this.ambientLowHumOsc.type = 'sawtooth';
            this.ambientLowHumOsc.frequency.value = 50; // Mains hum
            
            // Very subtle low-frequency rumble
            this.ambientLowHumGain.gain.value = this.volume * 0.03;
            
            // Add slight frequency modulation for realism
            const humLFO = this.audioContext.createOscillator();
            const humLFOGain = this.audioContext.createGain();
            humLFO.type = 'sine';
            humLFO.frequency.value = 0.15; // Slow oscillation
            humLFOGain.gain.value = 0.3; // Subtle frequency variation
            
            humLFO.connect(humLFOGain);
            humLFOGain.connect(this.ambientLowHumOsc.frequency);
            
            this.ambientLowHumOsc.connect(this.ambientLowHumGain);
            this.ambientLowHumGain.connect(this.audioContext.destination);

            // === LAYER 3: Mid-Range Electrical Interference ===
            this.ambientElectricOsc = this.audioContext.createOscillator();
            this.ambientElectricGain = this.audioContext.createGain();
            
            // Create warbling interference tone
            this.ambientElectricOsc.type = 'triangle';
            this.ambientElectricOsc.frequency.value = 120; // Harmonic of 60Hz (US power)
            
            // Modulate for interference effect
            const electricLFO = this.audioContext.createOscillator();
            const electricLFOGain = this.audioContext.createGain();
            electricLFO.type = 'sine';
            electricLFO.frequency.value = 0.07; // Very slow warble
            electricLFOGain.gain.value = 8; // Noticeable frequency variation
            
            electricLFO.connect(electricLFOGain);
            electricLFOGain.connect(this.ambientElectricOsc.frequency);
            
            // Bandpass filter for that "old fluorescent light" sound
            const electricFilter = this.audioContext.createBiquadFilter();
            electricFilter.type = 'bandpass';
            electricFilter.frequency.value = 180;
            electricFilter.Q.value = 3;
            
            this.ambientElectricGain.gain.value = this.volume * 0.025;
            
            this.ambientElectricOsc.connect(electricFilter);
            electricFilter.connect(this.ambientElectricGain);
            this.ambientElectricGain.connect(this.audioContext.destination);

            // === LAYER 4: Random Clicks and Pops ===
            // Simulate relay switches and tape artifacts
            const scheduleRandomClick = () => {
                if (!this.ambientNoiseSource) return; // Stop if ambient stopped
                
                const delay = 3000 + Math.random() * 7000; // Random 3-10 seconds
                setTimeout(() => {
                    if (this.audioContext && this.enabled && this.ambientNoiseSource) {
                        // Generate quick pop/click
                        const clickOsc = this.audioContext.createOscillator();
                        const clickGain = this.audioContext.createGain();
                        const clickFilter = this.audioContext.createBiquadFilter();
                        
                        clickFilter.type = 'bandpass';
                        clickFilter.frequency.value = 600 + Math.random() * 800;
                        clickFilter.Q.value = 8;
                        
                        clickOsc.type = 'square';
                        clickOsc.frequency.value = 100;
                        
                        const now = this.audioContext.currentTime;
                        clickGain.gain.setValueAtTime(this.volume * (0.08 + Math.random() * 0.1), now);
                        clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
                        
                        clickOsc.connect(clickFilter);
                        clickFilter.connect(clickGain);
                        clickGain.connect(this.audioContext.destination);
                        
                        clickOsc.start(now);
                        clickOsc.stop(now + 0.02);
                    }
                    scheduleRandomClick(); // Schedule next click
                }, delay);
            };

            // Start all oscillators and schedule clicks
            this.ambientNoiseSource.start(0);
            this.ambientLowHumOsc.start(0);
            humLFO.start(0);
            this.ambientElectricOsc.start(0);
            electricLFO.start(0);
            scheduleRandomClick();

        } catch (error) {
            console.warn('Failed to start ambient static:', error);
        }
    }

    /**
     * Stop ambient static and all layers
     */
    stopAmbientStatic() {
        try {
            // Stop tape hiss
            if (this.ambientNoiseSource) {
                this.ambientNoiseSource.stop();
                this.ambientNoiseSource.disconnect();
                this.ambientNoiseSource = null;
            }
            if (this.ambientNoiseGain) {
                this.ambientNoiseGain.disconnect();
                this.ambientNoiseGain = null;
            }
            
            // Stop low hum
            if (this.ambientLowHumOsc) {
                this.ambientLowHumOsc.stop();
                this.ambientLowHumOsc.disconnect();
                this.ambientLowHumOsc = null;
            }
            if (this.ambientLowHumGain) {
                this.ambientLowHumGain.disconnect();
                this.ambientLowHumGain = null;
            }
            
            // Stop electrical interference
            if (this.ambientElectricOsc) {
                this.ambientElectricOsc.stop();
                this.ambientElectricOsc.disconnect();
                this.ambientElectricOsc = null;
            }
            if (this.ambientElectricGain) {
                this.ambientElectricGain.disconnect();
                this.ambientElectricGain = null;
            }
        } catch (error) {
            console.warn('Failed to stop ambient static:', error);
        }
    }

    /**
     * Enable/disable sound effects
     */
    toggle() {
        this.enabled = !this.enabled;
        this.savePreference();
        
        // Stop ambient static if sounds are disabled
        if (!this.enabled) {
            this.stopAmbientStatic();
        }
        
        return this.enabled;
    }

    /**
     * Set volume (0.0 to 1.0)
     */
    setVolume(level) {
        this.volume = Math.max(0, Math.min(1, level));
        this.savePreference();
    }

    /**
     * Load sound preference from localStorage
     */
    loadPreference() {
        try {
            const saved = localStorage.getItem('terminal_sound_enabled');
            return saved !== null ? saved === 'true' : true; // Default enabled
        } catch (e) {
            return true;
        }
    }

    /**
     * Save sound preference to localStorage
     */
    savePreference() {
        try {
            localStorage.setItem('terminal_sound_enabled', this.enabled.toString());
            localStorage.setItem('terminal_sound_volume', this.volume.toString());
        } catch (e) {
            console.warn('Failed to save sound preferences:', e);
        }
    }

    /**
     * Check if sounds are available
     */
    isAvailable() {
        return typeof Audio !== 'undefined';
    }
}

export default SoundService;
