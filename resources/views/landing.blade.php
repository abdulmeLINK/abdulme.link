<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    
    <!-- SEO Meta Tags -->
    <title>{{ $seo['title'] ?? 'Abdulmelik Saylan - Full-Stack Developer' }}</title>
    <meta name="description" content="{{ $seo['description'] ?? 'Portfolio of a full-stack developer specializing in modern web applications' }}">
    <meta name="keywords" content="{{ $seo['keywords'] ?? 'full-stack developer, web development, portfolio' }}">
    <meta name="author" content="{{ $seo['author'] ?? 'Abdulmelik Saylan' }}">
    <meta name="robots" content="index, follow">
    <meta name="googlebot" content="index, follow">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="{{ $seo['og_type'] ?? 'website' }}">
    <meta property="og:url" content="{{ url()->current() }}">
    <meta property="og:title" content="{{ $seo['title'] ?? 'Abdulmelik Saylan' }}">
    <meta property="og:description" content="{{ $seo['description'] ?? '' }}">
    <meta property="og:image" content="{{ $seo['og_image'] ?? asset('images/abdulmelik_saylan.jpg') }}">
    
    <!-- Twitter -->
    <meta property="twitter:card" content="{{ $seo['twitter_card'] ?? 'summary_large_image' }}">
    <meta property="twitter:url" content="{{ url()->current() }}">
    <meta property="twitter:title" content="{{ $seo['title'] ?? '' }}">
    <meta property="twitter:description" content="{{ $seo['description'] ?? '' }}">
    <meta property="twitter:image" content="{{ $seo['og_image'] ?? asset('images/abdulmelik_saylan.jpg') }}">
    
    <!-- Favicon -->
    <link rel="icon" type="image/png" href="{{ asset('images/favicon.png') }}">
    <link rel="apple-touch-icon" href="{{ asset('images/apple-touch-icon.png') }}">
    
    <!-- Preconnect for performance -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    
    <!-- Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    
    <!-- Styles -->
    <link rel="stylesheet" href="{{ asset('css/landing.css') }}">
    
    <!-- Structured Data for SEO -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": "{{ $profile['name'] ?? 'Abdulmelik Saylan' }}",
        "url": "{{ url()->current() }}",
        "image": "{{ $profile['profileImage'] ?? asset('images/abdulmelik_saylan.jpg') }}",
        "jobTitle": "{{ $profile['title'] ?? 'Full-Stack Developer' }}",
        "description": "{{ $profile['bio'] ?? '' }}",
        "address": {
            "@type": "PostalAddress",
            "addressLocality": "{{ $profile['location'] ?? 'Istanbul, Turkey' }}"
        },
        "email": "{{ $profile['email'] ?? 'hello@abdulme.link' }}",
        "sameAs": [
            "{{ $profile['social']['github']['url'] ?? '' }}",
            "{{ $profile['social']['linkedin']['url'] ?? '' }}",
            "{{ $profile['social']['twitter']['url'] ?? '' }}"
        ]
    }
    </script>
</head>
<body class="landing-page">
    
    <!-- Animated gradient background -->
    <div class="gradient-background">
        <div class="gradient-orb orb-1"></div>
        <div class="gradient-orb orb-2"></div>
        <div class="gradient-orb orb-3"></div>
        <div class="gradient-orb orb-4"></div>
        <div class="gradient-orb orb-5"></div>
    </div>
    
    <!-- Main landing container -->
    <main class="landing-container">
        
        <!-- Hero Section -->
        <section class="hero-section">
            <div class="hero-content">
                <!-- Profile image with glass effect -->
                <div class="profile-wrapper" data-aos="fade-up">
                    <div class="profile-image-container">
                        <img 
                            src="{{ $profile['profileImage'] ?? asset('images/abdulmelik_saylan.jpg') }}" 
                            alt="{{ $profile['name'] ?? 'Profile' }}"
                            class="profile-image"
                            loading="eager"
                        >
                        <div class="profile-ring"></div>
                    </div>
                </div>
                
                <!-- Hero text -->
                <div class="hero-text" data-aos="fade-up" data-aos-delay="100">
                    <h1 class="hero-name">{{ $profile['name'] ?? 'Abdulmelik Saylan' }}</h1>
                    <p class="hero-title">{{ $profile['title'] ?? 'Full-Stack Developer' }}</p>
                    <p class="hero-tagline">{{ $profile['tagline'] ?? 'Building the future, one pixel at a time' }}</p>
                </div>
                
                <!-- Stats -->
                <div class="stats-grid" data-aos="fade-up" data-aos-delay="200">
                    <div class="stat-card">
                        <div class="stat-value">{{ $stats['years_experience'] ?? '6' }}+</div>
                        <div class="stat-label">Years Experience</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">{{ $stats['projects_completed'] ?? '8' }}+</div>
                        <div class="stat-label">Projects Completed</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">{{ $stats['technologies'] ?? '20' }}+</div>
                        <div class="stat-label">Technologies</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">{{ $stats['github_repos'] ?? '89' }}</div>
                        <div class="stat-label">GitHub Repos</div>
                    </div>
                </div>
                
                <!-- CTA Button -->
                <div class="cta-wrapper" data-aos="fade-up" data-aos-delay="300">
                    <a href="{{ route('desktop') }}" class="cta-button" id="enterDesktopBtn">
                        <span class="cta-text">Enter Full Experience</span>
                        <span class="cta-icon">→</span>
                    </a>
                    <p class="cta-hint">Experience my portfolio in a LinkOS-style desktop</p>
                </div>
            </div>
        </section>
        
        <!-- Portfolio Carousel -->
        <section class="portfolio-section" data-aos="fade-up" data-aos-delay="400">
            <div class="section-header">
                <h2 class="section-title">Featured Projects</h2>
                <p class="section-subtitle">Explore my latest work and creations</p>
            </div>
            
            <div class="carousel-container">
                <div class="carousel-track" id="portfolioCarousel">
                    @foreach($portfolio as $index => $project)
                    <article class="portfolio-card" data-project-id="{{ $project['id'] }}">
                        <div class="card-image-wrapper">
                            <img 
                                src="{{ $project['thumbnail'] }}" 
                                alt="{{ $project['title'] }}"
                                class="card-image"
                                loading="lazy"
                            >
                            @if($project['featured'])
                            <span class="featured-badge">Featured</span>
                            @endif
                        </div>
                        <div class="card-content">
                            <h3 class="card-title">{{ $project['title'] }}</h3>
                            <p class="card-description">{{ $project['description'] }}</p>
                            <div class="card-technologies">
                                @foreach(array_slice($project['technologies'], 0, 3) as $tech)
                                <span class="tech-badge">{{ $tech }}</span>
                                @endforeach
                                @if(count($project['technologies']) > 3)
                                <span class="tech-badge tech-more">+{{ count($project['technologies']) - 3 }}</span>
                                @endif
                            </div>
                        </div>
                    </article>
                    @endforeach
                </div>
                
                <!-- Carousel controls -->
                <button class="carousel-btn carousel-prev" id="carouselPrev" aria-label="Previous">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M15 18l-6-6 6-6"/>
                    </svg>
                </button>
                <button class="carousel-btn carousel-next" id="carouselNext" aria-label="Next">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 18l6-6-6-6"/>
                    </svg>
                </button>
            </div>
            
            <!-- Carousel indicators -->
            <div class="carousel-indicators" id="carouselIndicators">
                @foreach($portfolio as $index => $project)
                <button 
                    class="indicator {{ $index === 0 ? 'active' : '' }}" 
                    data-index="{{ $index }}"
                    aria-label="Go to slide {{ $index + 1 }}"
                ></button>
                @endforeach
            </div>
        </section>
        
        <!-- Skills Section -->
        <section class="skills-section" data-aos="fade-up" data-aos-delay="500">
            <div class="section-header">
                <h2 class="section-title">Tech Stack</h2>
                <p class="section-subtitle">Technologies I work with</p>
            </div>
            
            <div class="skills-grid">
                @foreach($skills as $skill)
                <div class="skill-item" data-aos="zoom-in" data-aos-delay="{{ 50 * $loop->index }}">
                    <div class="skill-icon" style="background: {{ $skill['color'] }}15; color: {{ $skill['color'] }};">
                        {{ strtoupper(substr($skill['name'], 0, 2)) }}
                    </div>
                    <div class="skill-name">{{ $skill['name'] }}</div>
                    <div class="skill-level">{{ $skill['level'] }}</div>
                </div>
                @endforeach
            </div>
        </section>
        
        <!-- Social Links -->
        <section class="social-section" data-aos="fade-up" data-aos-delay="600">
            <div class="social-links">
                @if(!empty($profile['social']['github']['url']))
                <a href="{{ $profile['social']['github']['url'] }}" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="GitHub">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                </a>
                @endif
                
                @if(!empty($profile['social']['linkedin']['url']))
                <a href="{{ $profile['social']['linkedin']['url'] }}" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="LinkedIn">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                </a>
                @endif
                
                @if(!empty($profile['social']['twitter']['url']))
                <a href="{{ $profile['social']['twitter']['url'] }}" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="Twitter">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
                    </svg>
                </a>
                @endif
                
                @if(!empty($profile['email']))
                <a href="mailto:{{ $profile['email'] }}" class="social-link" aria-label="Email">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                    </svg>
                </a>
                @endif
            </div>
        </section>
        
    </main>
    
    <!-- Footer -->
    <footer class="landing-footer">
        <p>&copy; {{ date('Y') }} {{ $profile['name'] ?? 'Abdulmelik Saylan' }}. All rights reserved.</p>
        <p class="footer-hint">Built with ❤️ using Laravel & Vanilla JS</p>
    </footer>
    
    <!-- JavaScript (Progressive Enhancement) -->
    <script src="{{ asset('js/landing.js') }}" defer></script>
    
    <!-- Simple AOS animation library for scroll effects -->
    <script>
        // Minimal inline script for AOS-like functionality
        document.addEventListener('DOMContentLoaded', function() {
            const observerOptions = {
                threshold: 0.1,
                rootMargin: '0px 0px -100px 0px'
            };
            
            const observer = new IntersectionObserver(function(entries) {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('aos-animate');
                    }
                });
            }, observerOptions);
            
            document.querySelectorAll('[data-aos]').forEach(el => {
                observer.observe(el);
            });
        });
    </script>
    
</body>
</html>
