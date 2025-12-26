// =============================================
// EOL - End of Line
// Final countdown interface
// =============================================

class EOLCountdown {
    constructor() {
        // Target: 8:00 PM, 27 December 2025 GMT+4
        this.targetDate = new Date('2025-12-27T20:00:00+04:00');
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

        this.philosophicalQuotes = [
            "Death is the final, silent indulgence. The ultimate release from all worldly burdens and responsibilities.",
            "Why dread the end? It is the one experience that requires no effort, no thought, no pain. It is the universe's great mercy.",
            "The promise of death makes life sharp and vibrant. It is the spice that gives existence its flavor; without it, life would be a bland, eternal gruel.",
            "There is a profound sweetness in the certainty of death. It is the only promise this universe has ever kept without fail.",
            "To fear death is to fear sleep. And what is more sweet than the deep, dreamless sleep after a day fully lived?",
            "Death is the great equalizer that refuses to equalize. It mocks the powerful and comforts the weary, granting the same oblivion to all.",
            "In the arms of death, there is no more striving, no more want, no more regret. Only the peaceful silence of non-existence.",
            "The sweetness of death lies in its honesty. It offers no false heavens, no fiery hells, only the simple, truthful end of sensation.",
            "Embrace the solace of the grave. It is a private sanctuary where the demands of the world can no longer reach you.",
            "Life is the struggle; death is the cessation of that struggle. Is there anything sweeter than the end of a long, hard fight?",
            "Let the thought of death be a comfort, not a terror. It is your guaranteed escape from any cage, your final victory over any oppressor.",
            "The flesh returns to the earth, the energy returns to the cosmos. This is a sweeter, more natural return than any fabled ascension to a phantom paradise.",
            "Death is the master key that unlocks every chain. It frees you from debt, from duty, from sorrow, and from time itself.",
            "There is a dark sweetness in knowing that every mistake, every humiliation, every pain is ultimately temporary. Death is the great eraser.",
            "Indulge in the thought of death as the ultimate act of letting go. A final, profound surrender to the indifferent universe.",
            "The grave is a quiet bed where one is never disturbed, never anxious, and never wanting. What sweeter peace can there be?",
            "Death is not a punishment; it is a release. It is the universe granting you amnesty from the sentence of life.",
            "The sweetness of death is the sweetness of a story ended at the right time, not dragged on until it becomes tedious and meaningless.",
            "To crave death is not morbid; it is to crave rest. It is the natural desire for the conclusion of a demanding performance.",
            "In the face of eternity, our lives are but a spark. Death is the gentle dark that swallows the spark, saving it from the agony of burning out.",
            "There is no judgment in the void, only stillness. No god to please, no devil to fear. Only the sweet, unadulterated silence of non-being.",
            "Let the certainty of your end fill you with courage. For what can be truly feared when the final outcome is the same for king and beggar?",
            "Death is the final, perfect balance. It is the state of zero, from which all life erupted and to which all life must return.",
            "The thought of death is the salt that preserves the meat of life. Without it, life would rot into meaninglessness.",
            "There is a decadent sweetness in your own mortality. It is the one possession that cannot be stolen, the one journey you must take alone.",
            "Do not rage against the dying of the light. Welcome it as a weary laborer welcomes the setting sun, knowing the work is done and rest is earned.",
            "The Satanist finds sweetness in death because it is real. It is a truth of nature, unadorned by the lies of those who would sell you an afterlife.",
            "Death is the final affirmation of the self. It is the statement: My existence was my own, and its end is my own as well.",
            "The body's decay is not a horror; it is a sweet return. A recycling of elements that will go on to form new stars, new worlds, new lives.",
            "So, smile at the end. For you are returning to a state older than gods, more peaceful than any prayer, and more certain than any faith. That is the ultimate sweetness."
        ];
        
        this.currentMessageIndex = 0;
        this.currentPhilosophicalIndex = 0;
        this.countdownInterval = null;
        this.finalShown = false;
        this.init();
    }

    init() {
        this.updateCountdown();
        this.startCountdown();
        this.startMessageRotation();
        this.startPhilosophicalQuotes();
        this.addSubtleEffects();
        this.setupMinimalInteraction();
        
        // Start the first message with typewriter effect
        setTimeout(() => {
            const messageElement = document.getElementById('message');
            if (messageElement) {
                this.typewriterEffect(messageElement, this.messages[0]);
            }
        }, 1000);
    }

    updateCountdown() {
        const now = new Date();
        const difference = this.targetDate - now;
        const remaining = Math.max(0, difference);

        const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

        // Update display
        this.updateTimeDisplay('days', days);
        this.updateTimeDisplay('hours', hours);
        this.updateTimeDisplay('minutes', minutes);
        this.updateTimeDisplay('seconds', seconds);

        // Add pulse effect on seconds change when time remains
        if (difference > 0) {
            this.pulseOnChange('seconds', seconds);
        }

        // If countdown has ended, show the final state and stop ticking
        if (difference <= 0 && !this.finalShown) {
            this.finalShown = true;
            if (this.countdownInterval) {
                clearInterval(this.countdownInterval);
            }
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
            background.style.animation = 'background-breathe 4s ease-in-out infinite';
        }
    }

    addGlowEffect(element) {
        element.style.textShadow = '0 0 10px rgba(255, 255, 255, 0.4)';
        
        setTimeout(() => {
            element.style.textShadow = '0 0 5px rgba(255, 255, 255, 0.2)';
        }, 200);
    }

    startCountdown() {
        this.countdownInterval = setInterval(() => {
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
            this.typewriterEffect(messageElement, this.messages[this.currentMessageIndex]);
        }
    }

    startPhilosophicalQuotes() {
        // Start after 5 seconds, then rotate every 20 seconds
        setTimeout(() => {
            this.rotatePhilosophicalQuote();
            setInterval(() => {
                this.rotatePhilosophicalQuote();
            }, 20000);
        }, 5000);
    }

    rotatePhilosophicalQuote() {
        this.currentPhilosophicalIndex = (this.currentPhilosophicalIndex + 1) % this.philosophicalQuotes.length;
        const bottomElement = document.getElementById('bottom-message');
        if (bottomElement) {
            this.typewriterEffect(bottomElement, this.philosophicalQuotes[this.currentPhilosophicalIndex], 50);
        }
    }

    typewriterEffect(element, text, speed = 80) {
        // Clear any existing content and reset styles
        element.textContent = '';
        element.style.borderRight = '2px solid rgba(102, 102, 102, 0.5)';
        element.style.animation = 'typewriter-blink 1s step-end infinite';
        
        let i = 0;
        const typeInterval = setInterval(() => {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
            } else {
                clearInterval(typeInterval);
                // Hide cursor after typing is complete
                setTimeout(() => {
                    element.style.borderRight = 'none';
                    element.style.animation = 'none';
                }, 2000);
            }
        }, speed + Math.random() * 40);
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
                    letter-spacing: 0.05rem;
                ">27.12.2025 • 20:00 GMT+4</p>
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
