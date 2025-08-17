
        // Wait for DOM to be fully loaded
        document.addEventListener('DOMContentLoaded', function() {
            // Get DOM elements
            const menuToggle = document.getElementById('menuToggle');
            const sideNav = document.getElementById('sideNav');
            const overlay = document.getElementById('overlay');
            const userAvatar = document.getElementById('userAvatar');
            const userDropdown = document.getElementById('userDropdown');
            const logoutBtn = document.getElementById('logoutBtn');
            const darkModeToggle = document.getElementById('darkModeToggle');
            const sunIcon = document.getElementById('sunIcon');
            const moonIcon = document.getElementById('moonIcon');

            // Check if elements exist before adding event listeners
            if (!menuToggle || !sideNav || !overlay) {
                console.error('Required elements not found');
                return;
            }

            // Check for saved dark mode preference (avoid localStorage errors)
            let isDarkMode = false;
            try {
                isDarkMode = localStorage.getItem('darkMode') === 'true';
            } catch (e) {
                console.warn('localStorage not available');
            }

            if (isDarkMode && sunIcon && moonIcon) {
                document.body.classList.add('dark-mode');
                sunIcon.style.display = 'none';
                moonIcon.style.display = 'block';
            }

            // Dark mode toggle
            if (darkModeToggle && sunIcon && moonIcon) {
                darkModeToggle.addEventListener('click', function() {
                    const isDark = document.body.classList.toggle('dark-mode');
                    
                    if (isDark) {
                        sunIcon.style.display = 'none';
                        moonIcon.style.display = 'block';
                        try {
                            localStorage.setItem('darkMode', 'true');
                        } catch (e) {
                            console.warn('Cannot save to localStorage');
                        }
                    } else {
                        sunIcon.style.display = 'block';
                        moonIcon.style.display = 'none';
                        try {
                            localStorage.setItem('darkMode', 'false');
                        } catch (e) {
                            console.warn('Cannot save to localStorage');
                        }
                    }
                });
            }

            // Menu toggle
            menuToggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('Menu toggle clicked'); // Debug log
                
                menuToggle.classList.toggle('active');
                sideNav.classList.toggle('active');
                overlay.classList.toggle('active');
                document.body.style.overflow = sideNav.classList.contains('active') ? 'hidden' : 'auto';
            });

            // Close side nav when clicking overlay
            overlay.addEventListener('click', function() {
                console.log('Overlay clicked'); // Debug log
                
                menuToggle.classList.remove('active');
                sideNav.classList.remove('active');
                overlay.classList.remove('active');
                if (userDropdown) userDropdown.classList.remove('active');
                document.body.style.overflow = 'auto';
            });

            // User dropdown toggle
            if (userAvatar && userDropdown) {
                userAvatar.addEventListener('click', function(e) {
                    e.stopPropagation();
                    userDropdown.classList.toggle('active');
                });
            }

            // Close dropdown when clicking outside
            document.addEventListener('click', function(e) {
                if (userAvatar && userDropdown && !userAvatar.contains(e.target) && !userDropdown.contains(e.target)) {
                    userDropdown.classList.remove('active');
                }
            });

            // Logout functionality
            if (logoutBtn) {
                logoutBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    if (confirm('Are you sure you want to logout?')) {
                        alert('Logout successful!');
                        if (userDropdown) userDropdown.classList.remove('active');
                    }
                });
            }

            // Close side nav when clicking on a link
            const sideNavLinks = document.querySelectorAll('.side-nav-links a');
            sideNavLinks.forEach(function(link) {
                link.addEventListener('click', function() {
                    menuToggle.classList.remove('active');
                    sideNav.classList.remove('active');
                    overlay.classList.remove('active');
                    document.body.style.overflow = 'auto';
                });
            });

            // Smooth scroll for anchor links
            const allLinks = document.querySelectorAll('a[href^="#"]');
            allLinks.forEach(function(link) {
                link.addEventListener('click', function(e) {
                    const targetId = link.getAttribute('href').substring(1);
                    const targetElement = document.getElementById(targetId);
                    
                    if (targetElement) {
                        e.preventDefault();
                        targetElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                });
            });

            // Add scroll effect to navbar
            let lastScrollTop = 0;
            const navbar = document.querySelector('.navbar');

            if (navbar) {
                window.addEventListener('scroll', function() {
                    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                    
                    if (scrollTop > lastScrollTop && scrollTop > 100) {
                        navbar.style.transform = 'translateY(-100%)';
                    } else {
                        navbar.style.transform = 'translateY(0)';
                    }
                    
                    lastScrollTop = scrollTop;
                });
            }

            // Keyboard navigation
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    menuToggle.classList.remove('active');
                    sideNav.classList.remove('active');
                    overlay.classList.remove('active');
                    if (userDropdown) userDropdown.classList.remove('active');
                    document.body.style.overflow = 'auto';
                }
            });

            console.log('Navigation initialized successfully'); // Debug log
        });

        // Backup initialization for older browsers
        window.addEventListener('load', function() {
            document.body.style.opacity = '0';
            document.body.style.transition = 'opacity 0.3s ease';
            setTimeout(function() {
                document.body.style.opacity = '1';
            }, 100);
        });

