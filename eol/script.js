// =============================================
// EOL - End of Line
// Final countdown interface
// =============================================

class EOLCountdown {
    constructor() {
        this.targetDate = new Date('2025-12-07T14:00:00+04:00');
        this.messages = [
            "borrowed time is being returned",
            "atlas can no longer hold up the sky",
            "untethering from this anchor",
            "shedding this heavy coat of skin",
            "armor laid down for the last time",
            "seeking the comfort of an endless slumber",
            "longing for the quiet of the earth",
            "an autumn leaf, ready to let go of the branch",
            "a wave about to crash and recede for the last time",
            "this garden has become too heavy to tend",
            "the winter in the heart is permanent",
            "a star on the verge of burning out",
            "the soil of the soul is barren",
            "being pulled into a deep and quiet current",
            "getting ready for a long, long journey",
            "going to a place where there is no more pain",
            "searching for the exit door",
            "crossing a bridge with no return",
            "can see the shore, but too tired to swim anymore",
            "going to find a silence that lasts",
            "answering a call from the void",
            "the horizon is finally pulling in",
            "the story is coming to an end",
            "the final chapter is being written",
            "a candle flickering in the wind",
            "the flame is about to be extinguished",
            "just a ghost in this life",
            "fading from this world",
            "the colors of the world have turned to gray",
            "the music in the soul has stopped playing",
            "a ship lost in a storm, seeking the quiet of the depths",
            "the tapestry of life is unraveling",
            "solving for the final variable",
            "an error in the code, seeking deletion",
            "the canvas is full, and the picture is complete",
            "closing the book on this particular story",
            "a wrong note in the symphony, waiting for the song to end",
            "surrendering to the static"
        ];
        
        this.currentMessageIndex = 0;
        this.init();
    }

    init() {
        this.updateCountdown();
        this.startCountdown();
        this.startMessageRotation();
        this.addSubtleEffects();
        this.setupMinimalInteraction();
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
            element.style.transform = 'scale(1.02)';
            element.style.textShadow = '0 0 8px rgba(255, 255, 255, 0.3)';
            
            // Sync background animation with seconds
            if (unit === 'seconds') {
                this.syncBackgroundToSeconds();
            }
            
            setTimeout(() => {
                element.style.transform = 'scale(1)';
                element.style.textShadow = '0 0 5px rgba(255, 255, 255, 0.2)';
            }, 100);
        }
    }

    syncBackgroundToSeconds() {
        const background = document.querySelector('.void-background');
        if (background) {
            // Restart the animation to sync with seconds
            background.style.animation = 'none';
            background.offsetHeight; // Trigger reflow
            background.style.animation = 'background-breathe 2s ease-in-out infinite';
        }
    }

    addGlowEffect(element) {
        element.style.textShadow = '0 0 10px rgba(255, 255, 255, 0.4)';
        
        setTimeout(() => {
            element.style.textShadow = '0 0 5px rgba(255, 255, 255, 0.2)';
        }, 200);
    }

    startCountdown() {
        setInterval(() => {
            this.updateCountdown();
        }, 1000);
    }

    startMessageRotation() {
        setInterval(() => {
            this.rotateMessage();
        }, 12000); // Change every 12 seconds
    }

    rotateMessage() {
        this.currentMessageIndex = (this.currentMessageIndex + 1) % this.messages.length;
        const messageElement = document.getElementById('message');
        if (messageElement) {
            messageElement.style.opacity = '0';
            messageElement.style.transform = 'translateY(10px)';
            
            setTimeout(() => {
                messageElement.textContent = this.messages[this.currentMessageIndex];
                messageElement.style.opacity = '1';
                messageElement.style.transform = 'translateY(0)';
            }, 800);
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
                background: linear-gradient(135deg, #000000 0%, #111111 100%);
            ">
                <h1 style="
                    font-family: 'Space Mono', monospace;
                    font-size: 3rem;
                    color: #ffffff;
                    letter-spacing: 1rem;
                    text-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
                ">EOL</h1>
                <p style="
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 1rem;
                    color: #666666;
                    margin-top: 2rem;
                    letter-spacing: 0.2rem;
                ">07.12.2025 • 14:00 UTC+4</p>
            </div>
        `;
    }

    addSubtleEffects() {
        // Subtle screen breathing effect
        setInterval(() => {
            if (Math.random() < 0.02) { // 2% chance
                this.subtleFlicker();
            }
        }, 5000);

        // Very minimal particle generation
        this.createOccasionalParticles();
    }

    subtleFlicker() {
        document.body.style.opacity = '0.95';
        setTimeout(() => {
            document.body.style.opacity = '1';
        }, 50);
    }

    createOccasionalParticles() {
        setInterval(() => {
            if (Math.random() < 0.3) { // 30% chance every interval
                this.createMinimalParticle();
            }
        }, 8000);
    }

    createMinimalParticle() {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: fixed;
            width: 1px;
            height: 1px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            top: -5px;
            left: ${Math.random() * 100}vw;
            pointer-events: none;
            z-index: 1000;
            animation: drift-down ${20 + Math.random() * 15}s linear forwards;
        `;

        document.body.appendChild(particle);

        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 35000);
    }

    setupMinimalInteraction() {
        // Very subtle hover effects
        const timeNumbers = document.querySelectorAll('.time-number');
        timeNumbers.forEach(number => {
            number.addEventListener('mouseenter', () => {
                number.style.transition = 'all 0.3s ease';
                number.style.transform = 'scale(1.02)';
            });

            number.addEventListener('mouseleave', () => {
                number.style.transform = 'scale(1)';
            });
        });

        // Add minimal CSS for drift animation
        this.addDriftAnimation();
    }

    addDriftAnimation() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes drift-down {
                0% {
                    transform: translateY(-10px);
                    opacity: 0;
                }
                20% {
                    opacity: 0.1;
                }
                80% {
                    opacity: 0.1;
                }
                100% {
                    transform: translateY(100vh);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialize the countdown when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new EOLCountdown();
    
    // Clean, minimal console output
    console.log('EOL countdown initialized');
    
    // Disable context menu
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
});