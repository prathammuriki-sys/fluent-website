// Smooth scrolling and navigation functionality
document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Navbar scroll effect
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offsetTop = target.offsetTop - 70; // Account for fixed navbar
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Animate stats counter on scroll
    const animateStats = () => {
        const stats = document.querySelectorAll('.stat-number');
        stats.forEach(stat => {
            const rect = stat.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                const finalNumber = stat.getAttribute('data-target') || stat.textContent;
                animateNumber(stat, finalNumber);
            }
        });
    };

    // Number animation function
    const animateNumber = (element, target) => {
        if (element.classList.contains('animated')) return;
        element.classList.add('animated');
        
        const isPlus = target.includes('+');
        const numericTarget = parseInt(target.replace(/[^0-9]/g, ''));
        const duration = 2000;
        const start = performance.now();
        
        const update = (currentTime) => {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            const current = Math.floor(progress * numericTarget);
            
            element.textContent = current + (isPlus ? '+' : '') + (target.includes('sec') ? 'sec' : '');
            
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        };
        
        requestAnimationFrame(update);
    };

    // Set target values for stats
    document.querySelector('#waitlist-count').setAttribute('data-target', '500+');

    // Scroll-triggered animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                
                // Trigger stats animation when hero section is visible
                if (entry.target.classList.contains('hero-stats')) {
                    animateStats();
                }
            }
        });
    }, observerOptions);

    // Observe elements for animation
    document.querySelectorAll('.problem-card, .feature-card, .step, .team-card, .hero-stats').forEach(el => {
        observer.observe(el);
    });

    // Waitlist form handling
    const waitlistForm = document.getElementById('waitlist-signup');
    if (waitlistForm) {
        waitlistForm.addEventListener('submit', handleWaitlistSubmit);
    }

    // Phone mockup interaction
    const phoneScreen = document.querySelector('.phone-screen');
    let currentView = 0;
    const views = ['dashboard', 'map', 'insights'];
    
    if (phoneScreen) {
        phoneScreen.addEventListener('click', () => {
            currentView = (currentView + 1) % views.length;
            updatePhoneView(views[currentView]);
        });
    }

    // Auto-cycle through phone views
    setInterval(() => {
        if (phoneScreen) {
            currentView = (currentView + 1) % views.length;
            updatePhoneView(views[currentView]);
        }
    }, 4000);
});

// Waitlist form submission
// Replace your entire handleWaitlistSubmit function with this:
async function handleWaitlistSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    
    // Get form values
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim().toLowerCase();
    const housing = document.getElementById('housing').value;
    
    // Basic validation
    if (!name || !email || !housing) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }
    
    if (!email.includes('berkeley.edu') && !email.includes('cal.berkeley.edu')) {
        showNotification('Please use your Berkeley email address', 'error');
        return;
    }
    
    // Update button state
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Joining...';
    submitBtn.disabled = true;
    
    try {
        // Check if email already exists
        const existingUser = await db.collection('waitlist')
            .where('email', '==', email)
            .get();
        
        if (!existingUser.empty) {
            showNotification('You\'re already on our waitlist! 🎉', 'success');
            form.reset();
            return;
        }
        
        // Add to Firebase
        await db.collection('waitlist').add({
            name: name,
            email: email,
            housing: housing,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'active'
        });
        
        // Success
        showNotification('🎉 Welcome to the Fluent waitlist! We\'ll keep you updated on our launch.', 'success');
        form.reset();
        
        // Update counter
        updateWaitlistCount();
        
        // Optional: Track with Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'waitlist_signup', {
                'event_category': 'engagement',
                'housing': housing
            });
        }
        
        console.log('✅ Successfully added to waitlist:', { name, email, housing });
        
    } catch (error) {
        console.error('❌ Firebase error:', error);
        showNotification('Oops! Something went wrong. Please try again.', 'error');
    } finally {
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Update the waitlist counter to use real Firebase data
async function updateWaitlistCount() {
    try {
        const snapshot = await db.collection('waitlist').get();
        const count = snapshot.size;
        const counter = document.getElementById('waitlist-count');
        if (counter) {
            // Start from base of 500 + real signups
            const displayCount = 500 + count;
            counter.textContent = displayCount + '+';
        }
    } catch (error) {
        console.error('Error getting waitlist count:', error);
        // Fallback to original behavior
        const counter = document.getElementById('waitlist-count');
        if (counter && !counter.textContent.includes('+')) {
            counter.textContent = '500+';
        }
    }
}

// Remove the old localStorage functions since we're using Firebase now
// Delete: simulateWaitlistSignup, and any localStorage code

// Simulate waitlist signup (replace with real API)
function simulateWaitlistSignup(data) {
    return new Promise((resolve, reject) => {
        // Store in localStorage for demo purposes
        const waitlist = JSON.parse(localStorage.getItem('fluentWaitlist') || '[]');
        
        // Check if email already exists
        if (waitlist.some(user => user.email === data.email)) {
            reject(new Error('Email already registered'));
            return;
        }
        
        // Add to waitlist
        waitlist.push({
            ...data,
            timestamp: new Date().toISOString(),
            id: Date.now()
        });
        
        localStorage.setItem('fluentWaitlist', JSON.stringify(waitlist));
        
        // Simulate network delay
        setTimeout(() => {
            resolve({ success: true });
        }, 1500);
    });
}

// Update waitlist counter
function updateWaitlistCount() {
    const waitlist = JSON.parse(localStorage.getItem('fluentWaitlist') || '[]');
    const counter = document.getElementById('waitlist-count');
    if (counter) {
        const newCount = 500 + waitlist.length;
        counter.textContent = newCount + '+';
    }
}

// Email validation
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
    
    // Close button handler
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    });
    
    // Show notification with animation
    setTimeout(() => notification.classList.add('show'), 100);
}

// Update phone mockup view
// Update phone mockup view
function updatePhoneView(view) {
    const appPreview = document.querySelector('.app-preview');
    if (!appPreview) return;
    
    const views = {
        dashboard: `
            <div class="status-bar">
                <span>9:41</span>
                <div class="battery"></div>
            </div>
            <div class="app-title">Fluent</div>
            <div class="health-scores">
                <div class="score-card campus">
                    <div class="score-circle">
                        <span class="score">8/10</span>
                    </div>
                    <span class="score-label">Campus Health</span>
                </div>
                <div class="score-card dorm">
                    <div class="score-circle">
                        <span class="score">7/10</span>
                    </div>
                    <span class="score-label">Your Dorm</span>
                </div>
            </div>
            <div class="insight-card">
                <i class="fas fa-exclamation-triangle"></i>
                <div>
                    <div class="insight-title">Flu Reports Rising</div>
                    <div class="insight-subtitle">15 cases in Unit 2</div>
                </div>
            </div>
        `,
        map: `
            <div class="status-bar">
                <span>9:41</span>
                <div class="battery"></div>
            </div>
            <div class="app-title">Sickness Map</div>
            <div style="background: rgba(255,255,255,0.2); border-radius: 16px; padding: 20px; margin: 20px 0; text-align: center;">
                <i class="fas fa-map-marked-alt" style="font-size: 3rem; color: white; margin-bottom: 10px;"></i>
                <div style="color: white; font-weight: 600;">Interactive Campus Map</div>
                <div style="color: rgba(255,255,255,0.8); font-size: 12px;">View illness reports by location</div>
            </div>
            <div class="insight-card">
                <i class="fas fa-location-dot" style="color: #ef4444;"></i>
                <div>
                    <div class="insight-title">Unit 2 Hotspot</div>
                    <div class="insight-subtitle">High activity detected</div>
                </div>
            </div>
        `,
        insights: `
            <div class="status-bar">
                <span>9:41</span>
                <div class="battery"></div>
            </div>
            <div class="app-title">Health Insights</div>
            <div style="display: flex; flex-direction: column; gap: 12px; margin: 20px 0;">
                <div class="insight-card">
                    <i class="fas fa-chart-line" style="color: #3b82f6;"></i>
                    <div>
                        <div class="insight-title">Weekly Trend</div>
                        <div class="insight-subtitle">Health improving overall</div>
                    </div>
                </div>
                <div class="insight-card">
                    <i class="fas fa-shield-alt" style="color: #10b981;"></i>
                    <div>
                        <div class="insight-title">Your Dorm Safe</div>
                        <div class="insight-subtitle">Below campus average</div>
                    </div>
                </div>
            </div>
        `,
        personal: `
            <div class="status-bar">
                <span>9:41</span>
                <div class="battery"></div>
            </div>
            <div class="app-title">Your Health</div>
            <div style="display: flex; flex-direction: column; gap: 12px; margin: 20px 0;">
                <div class="insight-card">
                    <i class="fas fa-user-chart" style="color: #8b5cf6;"></i>
                    <div>
                        <div class="insight-title">Health Pattern</div>
                        <div class="insight-subtitle">Typically sick 2-3 days</div>
                    </div>
                </div>
                <div class="insight-card">
                    <i class="fas fa-clock" style="color: #f59e0b;"></i>
                    <div>
                        <div class="insight-title">Recovery Time</div>
                        <div class="insight-subtitle">Faster than average</div>
                    </div>
                </div>
                <div class="insight-card">
                    <i class="fas fa-heartbeat" style="color: #ef4444;"></i>
                    <div>
                        <div class="insight-title">Common Symptoms</div>
                        <div class="insight-subtitle">Headache, fatigue</div>
                    </div>
                </div>
            </div>
        `
    };
    
    appPreview.innerHTML = views[view] || views.dashboard;
}

// Also update the views array in the phone mockup interaction section:
// Find this line and replace it:
const views = ['dashboard', 'map', 'insights', 'personal'];

// Utility functions
function scrollToWaitlist() {
    document.getElementById('waitlist').scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
}

function scrollToFeatures() {
    document.getElementById('features').scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
}

// Initialize waitlist count on page load
document.addEventListener('DOMContentLoaded', function() {
    updateWaitlistCount();
});

// Easter egg - Konami code
let konamiCode = [];
const konami = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];

document.addEventListener('keydown', function(e) {
    konamiCode.push(e.keyCode);
    if (konamiCode.length > konami.length) {
        konamiCode.shift();
    }
    
    if (konamiCode.join(',') === konami.join(',')) {
        showNotification('🎉 Easter egg found! You\'re a true Berkeley hacker!', 'success');
        konamiCode = []; // Reset
        
        // Add some fun animation
        document.body.style.animation = 'rainbow 2s infinite';
        setTimeout(() => {
            document.body.style.animation = '';
        }, 3000);
    }
});