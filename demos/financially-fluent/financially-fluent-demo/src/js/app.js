// Financially Fluent - Main App Logic

document.addEventListener('DOMContentLoaded', () => {
    console.log('Financially Fluent App Initialized');
    
    // Smooth scrolling for better UX
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Add click animations to buttons
    const buttons = document.querySelectorAll('.btn-primary, .btn-secondary');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
        });
    });
    
    // Add hover effects to cards
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.transition = 'transform 0.2s ease';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // Simulate loading states
    function showLoading() {
        const button = event.target;
        const originalText = button.textContent;
        button.textContent = 'Loading...';
        button.disabled = true;
        
        setTimeout(() => {
            button.textContent = originalText;
            button.disabled = false;
        }, 1500);
    }
    
    // Add to any form submissions
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const submitButton = this.querySelector('button[type="submit"]');
            if (submitButton) {
                showLoading();
            }
        });
    });
});

// Enhanced Animation System
class AnimationController {
    constructor() {
        this.observers = new Map();
        this.initScrollAnimations();
        this.initPageTransitions();
    }
    
    initScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);
        
        // Observe all animated elements
        document.querySelectorAll('[data-animate]').forEach(el => {
            observer.observe(el);
        });
    }
    
    initPageTransitions() {
        // Smooth page transitions
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href*=".html"]');
            if (link && !link.hasAttribute('data-no-transition')) {
                e.preventDefault();
                this.transitionToPage(link.href);
            }
        });
    }
    
    transitionToPage(url) {
        // Fade out current page
        document.body.style.opacity = '0';
        document.body.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            window.location.href = url;
        }, 300);
    }
    
    staggerAnimation(elements, delay = 100) {
        elements.forEach((el, index) => {
            setTimeout(() => {
                el.classList.add('animate-in');
            }, index * delay);
        });
    }
    
    countUp(element, target, duration = 2000) {
        const start = 0;
        const increment = target / (duration / 16);
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            
            if (element.dataset.currency) {
                element.textContent = `${element.dataset.currency}${Math.floor(current).toLocaleString()}`;
            } else {
                element.textContent = Math.floor(current);
            }
        }, 16);
    }
    
    pulseElement(element, intensity = 1.05) {
        element.style.transform = `scale(${intensity})`;
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, 150);
    }
}

// Initialize animation controller
const animationController = new AnimationController();

// Transaction filtering functionality
document.addEventListener('DOMContentLoaded', function() {
    // Add initial animations
    const pageElements = document.querySelectorAll('.card, .transaction-item-enhanced, .category-item');
    if (pageElements.length > 0) {
        animationController.staggerAnimation(pageElements, 50);
    }
    
    // Balance counter animation
    const balanceElement = document.querySelector('.balance-amount');
    if (balanceElement) {
        const target = parseInt(balanceElement.textContent.replace(/[^0-9]/g, ''));
        animationController.countUp(balanceElement, target, 2500);
    }
    
    // Enhanced transaction filtering
    const filterPills = document.querySelectorAll('.filter-pill');
    const transactionItems = document.querySelectorAll('.transaction-item-enhanced');
    
    // Add staggered animation to transaction items
    transactionItems.forEach((item, index) => {
        item.style.animationDelay = `${0.1 + (index * 0.05)}s`;
        item.style.animation = 'fadeInUp 0.6s ease-out both';
        
        // Add hover sound effect simulation
        item.addEventListener('mouseenter', () => {
            const icon = item.querySelector('.transaction-icon-enhanced');
            if (icon) {
                animationController.pulseElement(icon);
            }
        });
    });
    
    filterPills.forEach(pill => {
        pill.addEventListener('click', function() {
            // Pulse animation on click
            animationController.pulseElement(this);
            
            // Update active state
            filterPills.forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            
            const filter = this.dataset.filter;
            
            // Filter transactions with enhanced animation
            transactionItems.forEach((item, index) => {
                const category = item.dataset.category;
                const shouldShow = filter === 'all' || category === filter;
                
                if (shouldShow) {
                    item.style.display = 'flex';
                    item.style.animationDelay = `${index * 0.05}s`;
                    item.style.animation = 'fadeInUp 0.4s ease-out both';
                    item.style.transform = 'translateX(0)';
                    item.style.opacity = '1';
                } else {
                    item.style.animation = 'fadeOut 0.3s ease-out forwards';
                    item.style.transform = 'translateX(-20px)';
                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 300);
                }
            });
        });
    });
    
    // Enhanced search functionality
    const searchBtn = document.querySelector('.search-btn');
    const searchContainer = document.querySelector('.search-container');
    const searchInput = document.querySelector('.search-input');
    
    if (searchBtn && searchContainer) {
        searchBtn.addEventListener('click', function() {
            animationController.pulseElement(this);
            
            const isVisible = searchContainer.style.display === 'flex';
            
            if (isVisible) {
                searchContainer.style.animation = 'slideOutUp 0.3s ease-out forwards';
                setTimeout(() => {
                    searchContainer.style.display = 'none';
                }, 300);
            } else {
                searchContainer.style.display = 'flex';
                searchContainer.style.animation = 'slideInDown 0.3s ease-out forwards';
                setTimeout(() => searchInput.focus(), 100);
            }
        });
        
        // Real-time search with enhanced animations
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            const searchTerm = this.value.toLowerCase();
            
            searchTimeout = setTimeout(() => {
                transactionItems.forEach((item, index) => {
                    const name = item.querySelector('.transaction-name')?.textContent.toLowerCase() || '';
                    const description = item.querySelector('.transaction-description')?.textContent.toLowerCase() || '';
                    const shouldShow = searchTerm === '' || name.includes(searchTerm) || description.includes(searchTerm);
                    
                    if (shouldShow) {
                        item.style.display = 'flex';
                        item.style.opacity = '1';
                        item.style.transform = 'translateX(0) scale(1)';
                        item.style.animationDelay = `${index * 0.02}s`;
                        item.style.animation = 'fadeInUp 0.3s ease-out both';
                        item.style.filter = 'none';
                    } else {
                        item.style.opacity = '0.3';
                        item.style.transform = 'translateX(-10px) scale(0.95)';
                        item.style.filter = 'blur(1px)';
                    }
                });
            }, 150);
        });
    }
    
    // Chart animations for breakdown page
    const chartElement = document.querySelector('.donut-chart');
    if (chartElement) {
        setTimeout(() => {
            const paths = chartElement.querySelectorAll('path');
            paths.forEach((path, index) => {
                path.style.animationDelay = `${index * 0.2}s`;
                path.style.animation = 'drawPath 1s ease-out both';
            });
        }, 500);
    }
    
    // Add CSS animations dynamically
    if (!document.querySelector('#dynamic-animations')) {
        const style = document.createElement('style');
        style.id = 'dynamic-animations';
        style.textContent = `
            @keyframes fadeOut {
                to { opacity: 0; transform: translateY(-10px) scale(0.95); }
            }
            
            @keyframes drawPath {
                from { stroke-dasharray: 0 1000; }
                to { stroke-dasharray: var(--dash-array) 1000; }
            }
            
            .animate-in {
                animation: fadeInUp 0.6s ease-out both;
            }
            
            @keyframes fadeInUp {
                from { 
                    opacity: 0; 
                    transform: translateY(30px); 
                }
                to { 
                    opacity: 1; 
                    transform: translateY(0); 
                }
            }
            
            .card:hover {
                transform: translateY(-4px) scale(1.02);
                transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
            }
            
            .btn:active {
                transform: scale(0.95);
                transition: transform 0.1s ease;
            }
            
            .loading-shimmer {
                background: linear-gradient(90deg, 
                    rgba(255,255,255,0.1) 25%, 
                    rgba(255,255,255,0.2) 50%, 
                    rgba(255,255,255,0.1) 75%
                );
                background-size: 200% 100%;
                animation: shimmer 1.5s infinite;
            }
            
            @keyframes shimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Page load animation
    document.body.style.opacity = '0';
    document.body.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        document.body.style.transition = 'all 0.5s ease-out';
        document.body.style.opacity = '1';
        document.body.style.transform = 'translateY(0)';
    }, 100);
});