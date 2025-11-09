// =============================================
// EOL - END OF LINE
// Countdown functionality with death themes
// =============================================

class DeathCountdown {
    constructor() {
        this.targetDate = new Date('2025-12-07T14:00:00+04:00'); // 2:00 PM GMT+4
        this.quotes = [
            "In the end, we all return to darkness...",
            "Time is the fire in which we burn.",
            "Death is not the opposite of life, but a part of it.",
            "Every second brings us closer to the inevitable.",
            "The clock ticks... but for how much longer?",
            "In the shadow of time, we are all temporary.",
            "The final countdown has begun...",
            "Memento mori - remember you must die.",
            "Time devours all things.",
            "The end is not an event, it's a destination.",
            "We are all walking towards the same end.",
            "The darkness waits for no one.",
            "Each heartbeat echoes in eternity's silence.",
            "The void calls... do you hear it?",
            "Nothing lasts forever, not even forever.",
            "In the grand design, we are but fleeting shadows.",
            "The reaper's scythe cuts through all illusions.",
            "Time is the ultimate predator.",
            "We count the moments as they count us down.",
            "The final hour approaches with silent steps."
        ];
        
        this.currentQuoteIndex = 0;
        this.init();
    }

    init() {
        this.updateCountdown();
        this.startCountdown();
        this.startQuoteRotation();
        this.addEerieEffects();
        this.setupInteractiveElements();
    }

    updateCountdown() {
        const now = new Date();
        const difference = this.targetDate - now;

        if (difference > 0) {
            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            // Update display
            this.updateTimeDisplay('days', days);
            this.updateTimeDisplay('hours', hours);
            this.updateTimeDisplay('minutes', minutes);
            this.updateTimeDisplay('seconds', seconds);

            // Add pulse effect on seconds change
            this.pulseOnChange('seconds', seconds);
        } else {
            this.showFinalMessage();
        }
    }

    updateTimeDisplay(unit, value) {
        const element = document.getElementById(unit);
        if (element) {
            const formattedValue = value.toString().padStart(2, '0');
            if (element.textContent !== formattedValue) {
                element.textContent = formattedValue;
                this.addGlowEffect(element);
            }
        }
    }

    pulseOnChange(unit, value) {
        const element = document.getElementById(unit);
        if (element && this.lastSecond !== value) {
            this.lastSecond = value;
            element.style.transform = 'scale(1.2)';
            element.style.color = '#ff0000';
            
            setTimeout(() => {
                element.style.transform = 'scale(1)';
                element.style.color = '#ff4444';
            }, 150);

            // Make the page "breathe" more intensely on each second
            document.body.style.animation = 'none';
            document.body.offsetHeight; // Trigger reflow
            document.body.style.animation = 'breathing 0.5s ease-in-out';
        }
    }

    addGlowEffect(element) {
        element.style.textShadow = `
            0 0 15px rgba(255, 0, 0, 1),
            0 0 30px rgba(255, 0, 0, 0.8),
            0 0 45px rgba(255, 0, 0, 0.6)
        `;
        
        setTimeout(() => {
            element.style.textShadow = `
                0 0 10px rgba(255, 68, 68, 0.8),
                0 0 20px rgba(255, 68, 68, 0.4)
            `;
        }, 300);
    }

    startCountdown() {
        setInterval(() => {
            this.updateCountdown();
        }, 1000);
    }

    startQuoteRotation() {
        setInterval(() => {
            this.rotateQuote();
        }, 8000); // Change every 8 seconds to match CSS animation
    }

    rotateQuote() {
        this.currentQuoteIndex = (this.currentQuoteIndex + 1) % this.quotes.length;
        const quoteElement = document.getElementById('quote');
        if (quoteElement) {
            // Fade out
            quoteElement.style.opacity = '0';
            quoteElement.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                quoteElement.textContent = this.quotes[this.currentQuoteIndex];
                // Fade in
                quoteElement.style.opacity = '1';
                quoteElement.style.transform = 'translateY(0)';
            }, 1000);
        }
    }

    showFinalMessage() {
        document.body.innerHTML = `
            <div style="
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                height: 100vh;
                text-align: center;
                background: radial-gradient(circle, #ff0000 0%, #000000 100%);
            ">
                <h1 style="
                    font-family: 'Nosifer', cursive;
                    font-size: 5rem;
                    color: #ffffff;
                    text-shadow: 0 0 50px rgba(255, 0, 0, 1);
                    animation: final-glow 2s ease-in-out infinite alternate;
                ">TIME'S UP</h1>
                <p style="
                    font-family: 'Courier Prime', monospace;
                    font-size: 2rem;
                    color: #cccccc;
                    margin-top: 2rem;
                ">The end has arrived...</p>
            </div>
            <style>
                @keyframes final-glow {
                    0% { text-shadow: 0 0 50px rgba(255, 0, 0, 1); }
                    100% { text-shadow: 0 0 100px rgba(255, 0, 0, 0.5), 0 0 150px rgba(255, 255, 255, 0.3); }
                }
            </style>
        `;
    }

    addEerieEffects() {
        // Add random flicker effect to the page
        setInterval(() => {
            if (Math.random() < 0.05) { // 5% chance every interval
                this.flickerScreen();
            }
        }, 2000);

        // Add random particle generation
        this.createFloatingParticles();

        // Add subtle screen shake on hover
        this.addInteractiveDisturbance();
    }

    flickerScreen() {
        document.body.style.filter = 'brightness(0.3)';
        setTimeout(() => {
            document.body.style.filter = 'brightness(1)';
        }, 100);
    }

    createFloatingParticles() {
        setInterval(() => {
            this.createParticle();
        }, 3000);
    }

    createParticle() {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: fixed;
            width: ${Math.random() * 4 + 2}px;
            height: ${Math.random() * 4 + 2}px;
            background: rgba(255, ${Math.random() * 100}, ${Math.random() * 100}, 0.6);
            border-radius: 50%;
            top: -10px;
            left: ${Math.random() * 100}vw;
            pointer-events: none;
            z-index: 1000;
            animation: float-down ${15 + Math.random() * 10}s linear forwards;
        `;

        document.body.appendChild(particle);

        // Remove particle after animation
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 25000);
    }

    addInteractiveDisturbance() {
        const timeNumbers = document.querySelectorAll('.time-number');
        timeNumbers.forEach(number => {
            number.addEventListener('mouseenter', () => {
                document.body.style.transform = `translate(${Math.random() * 4 - 2}px, ${Math.random() * 4 - 2}px)`;
                this.playDisturbanceSound();
            });

            number.addEventListener('mouseleave', () => {
                document.body.style.transform = 'translate(0, 0)';
            });
        });
    }

    playDisturbanceSound() {
        // Create a subtle audio context for eerie sounds (optional)
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(100, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.1);

            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            // Silent fail if audio context is not available
        }
    }

    setupInteractiveElements() {
        // Add cursor trail effect
        this.addCursorTrail();

        // Add keyboard interactions
        this.addKeyboardEffects();
    }

    addCursorTrail() {
        document.addEventListener('mousemove', (e) => {
            if (Math.random() < 0.3) { // 30% chance to leave a trail
                const trail = document.createElement('div');
                trail.style.cssText = `
                    position: fixed;
                    width: 6px;
                    height: 6px;
                    background: rgba(255, 0, 0, 0.5);
                    border-radius: 50%;
                    left: ${e.clientX - 3}px;
                    top: ${e.clientY - 3}px;
                    pointer-events: none;
                    z-index: 9999;
                    animation: fade-trail 2s ease-out forwards;
                `;

                document.body.appendChild(trail);

                setTimeout(() => {
                    if (trail.parentNode) {
                        trail.parentNode.removeChild(trail);
                    }
                }, 2000);
            }
        });

        // Add CSS for trail animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fade-trail {
                0% {
                    opacity: 1;
                    transform: scale(1);
                }
                100% {
                    opacity: 0;
                    transform: scale(0);
                }
            }

            @keyframes float-down {
                0% {
                    transform: translateY(-10px) rotate(0deg);
                    opacity: 0;
                }
                10% {
                    opacity: 1;
                }
                90% {
                    opacity: 1;
                }
                100% {
                    transform: translateY(100vh) rotate(360deg);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    addKeyboardEffects() {
        document.addEventListener('keydown', (e) => {
            // Flash screen on any key press
            this.flickerScreen();

            // Special effects for specific keys
            if (e.key === ' ') { // Spacebar
                this.intensifyBreathing();
            }
        });
    }

    intensifyBreathing() {
        const breathingElements = document.querySelectorAll('.breathing, .breathing-slow');
        breathingElements.forEach(element => {
            element.style.animationDuration = '1s';
            setTimeout(() => {
                element.style.animationDuration = '';
            }, 3000);
        });
    }
}

// Initialize the countdown when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new DeathCountdown();
    
    // Add some console messages for extra eeriness
    console.log('%c⚰️ Time is running out...', 'color: #ff0000; font-size: 20px; font-weight: bold;');
    console.log('%cThe countdown has begun. Can you feel it?', 'color: #666; font-size: 14px;');
    
    // Prevent right-click for added mystery
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
});