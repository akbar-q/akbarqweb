// Navigation functionality for Financially Fluent app

// Navigation functions
function navigateToConnectBank() {
    window.location.href = 'pages/connect-bank.html';
}

function navigateToPermissions() {
    window.location.href = 'permissions.html';
}

function navigateToHome() {
    window.location.href = 'home.html';
}

function navigateToBreakdown() {
    window.location.href = 'breakdown.html';
}

function navigateToTransactions() {
    window.location.href = 'transactions.html';
}

// Update active nav item
function updateActiveNav(currentPage) {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('href') === currentPage) {
            item.classList.add('active');
        }
    });
}

// Initialize navigation on page load
document.addEventListener('DOMContentLoaded', function() {
    // Update active nav item based on current page
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop();
    updateActiveNav(currentPage);
    
    // Add click handlers for bottom nav
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href && href !== '#') {
                e.preventDefault();
                window.location.href = href;
            }
        });
    });
});
