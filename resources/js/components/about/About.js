/**
 * About Application Component
 * 
 * Features:
 * - Profile section with typewriter effect
 * - Interactive skill meters with scroll animations
 * - Experience timeline with scroll reveals
 * - Education background cards
 * - Social media integration
 * - Downloadable resume functionality
 * 
 * @author AbdulmeLink Portfolio
 * @version 1.0.0
 */

import EventBus from '../EventBus.js';

export default class About {
    constructor(container) {
        this.container = container;
        this.aboutData = null;
        this.typewriterIndex = 0;
        this.typewriterText = '';
        this.typewriterElement = null;
        this.observedElements = new Set();
        this.intersectionObserver = null;
        
        // Animation state
        this.isAnimating = false;
        this.animationQueue = [];
        
        this.init();
    }

    /**
     * Initialize about component
     */
    async init() {
        try {
            this.setupContainer();
            await this.loadAboutData();
            this.createLayout();
            this.setupIntersectionObserver();
            this.setupEventListeners();
            
            EventBus.emit('about:ready');
            
        } catch (error) {
            console.error('Failed to initialize About:', error);
            this.showError('Failed to load profile. Please try again.');
        }
    }

    /**
     * Setup container with loading state
     */
    setupContainer() {
        this.container.className = 'about-app';
        this.container.innerHTML = `
            <div class="about-loading">
                <div class="loading-spinner"></div>
                <p>Loading profile...</p>
            </div>
        `;
    }

    /**
     * Load about data from API
     */
    async loadAboutData() {
        try {
            const response = await fetch('/api/about');
            const result = await response.json();
            
            if (result.success) {
                this.aboutData = result.data;
            } else {
                throw new Error(result.message || 'Failed to load data');
            }
        } catch (error) {
            console.error('Error loading about data:', error);
            throw error;
        }
    }

    /**
     * Create main layout structure
     */
    createLayout() {
        this.container.innerHTML = `
            <div class="about-container">
                <div class="about-scroll-wrapper">
                    ${this.createProfileSection()}
                    ${this.createSkillsSection()}
                    ${this.createExperienceSection()}
                    ${this.createEducationSection()}
                </div>
            </div>
        `;
    }

    /**
     * Create profile section with typewriter effect
     */
    createProfileSection() {
        const profile = this.aboutData.personal || {};
        const stats = this.aboutData.stats || {};
        
        return `
            <section class="about-section profile-section animate-on-scroll">
                <div class="profile-hero">
                    <div class="profile-image-wrapper">
                        <img 
                            src="${profile.profileImage}" 
                            alt="${profile.name}" 
                            class="profile-image"
                        />
                        <div class="status-indicator" title="Available for work">
                            <span class="status-dot"></span>
                        </div>
                    </div>
                    
                    <div class="profile-content">
                        <h1 class="profile-name">${profile.name}</h1>
                        <h2 class="profile-title">${profile.title}</h2>
                        <div class="profile-bio-wrapper">
                            <p class="profile-bio typewriter" data-text="${profile.bio}"></p>
                        </div>
                        
                        <div class="profile-stats-grid">
                            <div class="stat-card">
                                <div class="stat-value">${stats.projectsCompleted || 0}</div>
                                <div class="stat-label">Projects Completed</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">${stats.technologiesUsed || 0}+</div>
                                <div class="stat-label">Technologies</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">${stats.githubCommits || 0}</div>
                                <div class="stat-label">GitHub Commits</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">${stats.certifications || 0}</div>
                                <div class="stat-label">Certifications</div>
                            </div>
                        </div>
                        
                        <div class="profile-meta">
                            <span class="meta-item">
                                <i class="icon-location"></i>
                                ${profile.location}
                            </span>
                            <span class="meta-item">
                                <i class="icon-email"></i>
                                ${profile.email}
                            </span>
                        </div>
                        
                        <button class="btn-contact-me" data-action="open-contact">
                            <i class="icon-mail"></i>
                            Contact Me
                        </button>
                    </div>
                </div>
            </section>
        `;
    }

    /**
     * Create social media links
     */
    createSocialLinks(social) {
        const platforms = ['github', 'linkedin', 'twitter', 'dribbble'];
        
        return platforms.map(platform => {
            const data = social[platform];
            if (!data || !data.url) return '';
            
            return `
                <a href="${data.url}" 
                   class="social-link social-${platform}" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   title="${platform.charAt(0).toUpperCase() + platform.slice(1)}">
                    <i class="icon-${platform}"></i>
                    ${data.followers ? `<span class="follower-count">${this.formatNumber(data.followers)}</span>` : ''}
                </a>
            `;
        }).join('');
    }

    /**
     * Create skills section with progress bars
     */
    createSkillsSection() {
        const skills = this.aboutData.skills || {};
        const categories = Object.entries(skills);
        
        if (categories.length === 0) return '';
        
        return `
            <section class="about-section skills-section animate-on-scroll">
                <h2 class="section-title">Skills & Expertise</h2>
                <div class="skills-grid">
                    ${categories.map(([key, category]) => this.createSkillCategory(category)).join('')}
                </div>
            </section>
        `;
    }

    /**
     * Create individual skill category
     */
    createSkillCategory(category) {
        return `
            <div class="skill-category">
                <h3 class="category-title" style="color: ${category.color || '#3B82F6'}">
                    ${category.category || 'Skills'}
                </h3>
                <div class="skill-list">
                    ${category.technologies.map(tech => this.createSkillBar(tech)).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Create skill progress bar
     */
    createSkillBar(tech) {
        return `
            <div class="skill-item">
                <div class="skill-header">
                    <span class="skill-name">${tech.name}</span>
                    <span class="skill-level">${tech.level || ''}</span>
                </div>
                <div class="skill-bar">
                    <div class="skill-progress" 
                         data-progress="${tech.proficiency || 0}" 
                         style="width: 0%">
                    </div>
                </div>
                <div class="skill-meta">
                    ${tech.years ? `<span>${tech.years} years</span>` : ''}
                    ${tech.projects ? `<span>${tech.projects} projects</span>` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Create combined experience and education roadmap section
     */
    createExperienceSection() {
        const experience = this.aboutData.experience || [];
        const education = this.aboutData.education || [];
        
        if (experience.length === 0 && education.length === 0) return '';
        
        // Calculate timeline range
        const timelineData = this.calculateTimelineData(experience, education);
        
        // Group items by year for positioning
        const experienceByYear = this.groupItemsByYear(experience);
        const educationByYear = this.groupItemsByYear(education);
        
        return `
            <section class="about-section roadmap-section animate-on-scroll">
                <div class="roadmap-container">
                    <div class="roadmap-left">
                        <h3 class="roadmap-subtitle">Professional Experience</h3>
                        <div class="timeline" style="min-height: ${timelineData.totalHeight}px">
                            ${this.createYearAxis(timelineData)}
                            ${experience.map((job, index) => this.createTimelineItem(job, index, timelineData, experienceByYear)).join('')}
                        </div>
                    </div>
                    
                    <div class="roadmap-divider">
                        <div class="roadmap-divider-line"></div>
                        ${this.createDividerYearMarkers(timelineData)}
                    </div>
                    
                    <div class="roadmap-right">
                        <h3 class="roadmap-subtitle">Education</h3>
                        <div class="education-timeline" style="min-height: ${timelineData.totalHeight}px">
                            ${education.map((edu, index) => this.createEducationTimelineItem(edu, index, timelineData, educationByYear)).join('')}
                        </div>
                    </div>
                </div>
            </section>
        `;
    }

    /**
     * Calculate years between two dates
     */
    calculateYears(startDate, endDate) {
        const start = new Date(startDate);
        const end = endDate === 'Present' || !endDate ? new Date() : new Date(endDate);
        const years = (end - start) / (365.25 * 24 * 60 * 60 * 1000);
        return Math.max(0.5, years); // Minimum 0.5 years
    }

    /**
     * Calculate timeline data for accurate positioning
     */
    calculateTimelineData(experience, education) {
        const allItems = [...experience, ...education];
        
        // Get all dates
        const dates = [];
        allItems.forEach(item => {
            if (item.duration?.start) {
                dates.push(new Date(item.duration.start));
            }
            if (item.duration?.end && item.duration.end !== 'Present') {
                dates.push(new Date(item.duration.end));
            }
        });
        
        // Add current date for "Present" items
        dates.push(new Date());
        
        // Find min and max years, and extend by 1 year before and after
        const minDateRaw = new Date(Math.min(...dates));
        const maxDateRaw = new Date(Math.max(...dates));

        // Subtract 1 year from minDate
        const minDate = new Date(minDateRaw.getFullYear() - 1, 0, 1);
        // Add 1 year to maxDate
        const maxDate = new Date(maxDateRaw.getFullYear() + 1, 0, 1);

        const minYear = minDate.getFullYear();
        const maxYear = maxDate.getFullYear();
        // Calculate pixels per year
        const yearsSpan = maxYear - minYear + 1;
        const pixelsPerYear = 120; // More space for better readability
        const totalHeight = yearsSpan * pixelsPerYear + 100; // Extra padding
        
        return {
            minYear,
            maxYear,
            yearsSpan,
            pixelsPerYear,
            totalHeight,
            minDate,
            maxDate
        };
    }

    /**
     * Calculate position from top based on date
     */
    calculatePosition(date, timelineData) {
        const itemDate = new Date(date);
        const itemYear = itemDate.getFullYear();
        const yearIndex = itemYear - timelineData.minYear;
        return yearIndex * timelineData.pixelsPerYear;
    }

    /**
     * Create year axis labels
     */
    createYearAxis(timelineData) {
        const years = [];
        for (let i = 0; i <= timelineData.yearsSpan - 1; i++) {
            const year = timelineData.minYear + i;
            const position = i * timelineData.pixelsPerYear;
            years.push(`
                <div class="year-label" style="top: ${position}px">
                    ${year}
                </div>
            `);
        }
        return years.join('');
    }

    /**
     * Create divider year markers
     */
    createDividerYearMarkers(timelineData) {
        const markers = [];
        for (let i = 0; i <= timelineData.yearsSpan - 1; i++) {
            const year = timelineData.minYear + i;
            const position = i * timelineData.pixelsPerYear;
            markers.push(`
                <div class="divider-year-marker" style="top: ${position}px">
                    <span class="divider-year-text">${year}</span>
                </div>
            `);
        }
        return markers.join('');
    }

    /**
     * Create timeline item for experience
     */
    createTimelineItem(job, index, timelineData, itemsByYear) {
        const duration = job.duration?.formatted || '';
        
        // Calculate position and height based on actual duration
        const startPos = this.calculatePosition(job.duration?.start, timelineData);
        const endDate = job.duration?.end === 'Present' || !job.duration?.end 
            ? new Date() 
            : new Date(job.duration.end);
        const endPos = this.calculatePosition(endDate, timelineData);
        const calculatedHeight = endPos - startPos;
        
        // Adjust position for multiple items in same year
        const startYear = job.duration?.start ? new Date(job.duration.start).getFullYear() : new Date().getFullYear();
        const yearItems = itemsByYear[startYear] || [];
        const itemIndexInYear = yearItems.findIndex(item => item.index === index);
        const itemsInYear = yearItems.length;
        
        // Distribute items within the year space (pixelsPerYear)
        let adjustedStartPos = startPos;
        if (itemsInYear > 1) {
            const yearSpace = timelineData.pixelsPerYear;
            const itemSpacing = Math.min(80, yearSpace / itemsInYear); // Max 80px spacing
            adjustedStartPos = startPos + (itemIndexInYear * itemSpacing);
        }
        
        // Set minimum height based on content needs
        // Short experiences (< 2 years) need at least 200px
        // Medium experiences (2-3 years) need at least 180px
        // Long experiences use calculated height
        const years = this.calculateYears(job.duration?.start, endDate);
        let minHeight = 200; // Base minimum for short experiences
        
        if (years >= 3) {
            minHeight = 150; // Long experiences can be shorter minimum
        } else if (years >= 2) {
            minHeight = 180; // Medium experiences
        }
        
        // Use the larger of calculated height or minimum height
        const finalHeight = Math.max(calculatedHeight, minHeight);
        
        // Extract years for display
        const startYearDisplay = job.duration?.start ? new Date(job.duration.start).getFullYear() : '';
        const endYear = job.duration?.end === 'Present' 
            ? 'Present' 
            : (job.duration?.end ? new Date(job.duration.end).getFullYear() : '');
        
        return `
            <div class="timeline-item" data-index="${index}" style="top: ${adjustedStartPos}px; min-height: ${finalHeight}px; position: absolute; width: calc(100% - 60px); right: 0;">
                <div class="timeline-connector"></div>
                <div class="timeline-header">
                    <div class="timeline-date-badge">${startYearDisplay}${endYear && endYear !== startYearDisplay ? ` - ${endYear}` : ''}</div>
                    <h3 class="job-title">${job.title}</h3>
                </div>
                <h4 class="company-name">${job.company}${job.location ? ` <span class="job-location">• ${job.location}</span>` : ''}</h4>
                ${job.type ? `<span class="job-type">${job.type}</span>` : ''}
                <p class="job-description">${job.description}</p>
                ${job.achievements && job.achievements.length > 0 ? `
                    <ul class="achievements-list">
                        ${job.achievements.slice(0, 3).map(achievement => `
                            <li>${achievement}</li>
                        `).join('')}
                    </ul>
                ` : ''}
                ${job.technologies && job.technologies.length > 0 ? `
                    <div class="job-technologies">
                        ${job.technologies.slice(0, 8).map(tech => `
                            <span class="tech-badge">${tech}</span>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Create education timeline item
     */
    createEducationTimelineItem(edu, index, timelineData, itemsByYear) {
        const duration = edu.duration?.formatted || '';
        
        // Calculate position and height based on actual duration
        const startPos = this.calculatePosition(edu.duration?.start, timelineData);
        const endDate = edu.duration?.end ? new Date(edu.duration.end) : new Date();
        const endPos = this.calculatePosition(endDate, timelineData);
        const calculatedHeight = endPos - startPos;
        
        // Adjust position for multiple items in same year
        const startYear = edu.duration?.start ? new Date(edu.duration.start).getFullYear() : new Date().getFullYear();
        const yearItems = itemsByYear[startYear] || [];
        const itemIndexInYear = yearItems.findIndex(item => item.index === index);
        const itemsInYear = yearItems.length;
        
        // Distribute items within the year space (pixelsPerYear)
        let adjustedStartPos = startPos;
        if (itemsInYear > 1) {
            const yearSpace = timelineData.pixelsPerYear;
            const itemSpacing = Math.min(80, yearSpace / itemsInYear); // Max 80px spacing
            adjustedStartPos = startPos + (itemIndexInYear * itemSpacing);
        }
        
        // Set minimum height based on content needs
        const years = this.calculateYears(edu.duration?.start, endDate);
        let minHeight = 220; // Base minimum for education (more content)
        
        if (years >= 4) {
            minHeight = 180; // Long education can be shorter minimum
        } else if (years >= 3) {
            minHeight = 200; // Medium education
        }
        
        // Use the larger of calculated height or minimum height
        const finalHeight = Math.max(calculatedHeight, minHeight);
        
        // Extract years for display
        const startYearDisplay = edu.duration?.start ? new Date(edu.duration.start).getFullYear() : '';
        const endYear = edu.duration?.end ? new Date(edu.duration.end).getFullYear() : '';
        
        return `
            <div class="education-timeline-item" data-index="${index}" style="top: ${adjustedStartPos}px; min-height: ${finalHeight}px; position: absolute; width: calc(100% - 60px); left: 0;">
                <div class="timeline-connector edu-connector"></div>
                <div class="edu-content">
                    <div class="edu-header">
                        <div class="timeline-date-badge edu-badge">${startYearDisplay}${endYear && endYear !== startYearDisplay ? ` - ${endYear}` : ''}</div>
                        <h3 class="degree">${edu.degree}</h3>
                        ${edu.field ? `<span class="edu-field">${edu.field}</span>` : ''}
                    </div>
                    <h4 class="institution">${edu.institution}</h4>
                    ${edu.location ? `<span class="edu-location">${edu.location}</span>` : ''}
                    ${edu.gpa ? `<p class="gpa">GPA: ${edu.gpa}</p>` : ''}
                    ${edu.description ? `<p class="edu-description">${edu.description}</p>` : ''}
                    ${edu.achievements && edu.achievements.length > 0 ? `
                        <ul class="edu-achievements-list">
                            ${edu.achievements.slice(0, 3).map(achievement => `
                                <li>${achievement}</li>
                            `).join('')}
                        </ul>
                    ` : ''}
                    ${edu.coursework && edu.coursework.length > 0 ? `
                        <div class="coursework">
                            <strong>Key Coursework:</strong>
                            <div class="coursework-tags">
                                ${edu.coursework.slice(0, 6).map(course => `
                                    <span class="course-tag">${course}</span>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Education section is now combined with experience
     */
    createEducationSection() {
        // This is now handled in the roadmap section
        return '';
    }

    /**
     * Setup intersection observer for scroll animations
     */
    setupIntersectionObserver() {
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.observedElements.has(entry.target)) {
                    this.animateElement(entry.target);
                    this.observedElements.add(entry.target);
                }
            });
        }, options);

        // Observe all animate-on-scroll elements
        const elements = this.container.querySelectorAll('.animate-on-scroll');
        elements.forEach(el => this.intersectionObserver.observe(el));
    }

    /**
     * Animate element on scroll into view
     */
    animateElement(element) {
        element.classList.add('is-visible');

        // Animate skill bars if in skills section
        if (element.classList.contains('skills-section')) {
            this.animateSkillBars(element);
        }

        // Start typewriter effect if profile section
        if (element.classList.contains('profile-section')) {
            this.startTypewriterEffect();
        }

        // Animate timeline items in roadmap section
        if (element.classList.contains('roadmap-section')) {
            this.animateTimelineItems(element);
        }
    }

    /**
     * Animate timeline items with stagger
     */
    animateTimelineItems(roadmapSection) {
        const timelineItems = roadmapSection.querySelectorAll('.timeline-item');
        const educationItems = roadmapSection.querySelectorAll('.education-timeline-item');
        
        // Animate experience timeline items
        timelineItems.forEach((item, index) => {
            setTimeout(() => {
                item.classList.add('is-visible');
            }, index * 150);
        });

        // Animate education timeline items
        educationItems.forEach((item, index) => {
            setTimeout(() => {
                item.classList.add('is-visible');
            }, index * 150 + 100);
        });
    }

    /**
     * Animate skill progress bars
     */
    animateSkillBars(skillsSection) {
        const skillBars = skillsSection.querySelectorAll('.skill-progress');
        
        skillBars.forEach((bar, index) => {
            setTimeout(() => {
                const progress = bar.getAttribute('data-progress');
                bar.style.width = `${progress}%`;
            }, index * 100);
        });
    }

    /**
     * Start typewriter effect for bio
     */
    startTypewriterEffect() {
        const typewriterElement = this.container.querySelector('.typewriter');
        if (!typewriterElement) return;

        const text = typewriterElement.getAttribute('data-text');
        if (!text) return;

        this.typewriterElement = typewriterElement;
        this.typewriterText = text;
        this.typewriterIndex = 0;
        
        typewriterElement.textContent = '';
        this.typeNextCharacter();
    }

    /**
     * Type next character in typewriter effect
     */
    typeNextCharacter() {
        if (this.typewriterIndex < this.typewriterText.length) {
            this.typewriterElement.textContent += this.typewriterText.charAt(this.typewriterIndex);
            this.typewriterIndex++;
            setTimeout(() => this.typeNextCharacter(), 30);
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Contact Me button
        const contactBtn = this.container.querySelector('.btn-contact-me');
        if (contactBtn) {
            contactBtn.addEventListener('click', () => this.openContactApp());
        }

        // Social links tracking
        const socialLinks = this.container.querySelectorAll('.social-link');
        socialLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const platform = link.className.split('social-')[1];
                EventBus.emit('about:socialClick', { platform });
            });
        });

        // Handle window resize for responsive adjustments
        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, 300));
    }

    /**
     * Open Contact app
     */
    openContactApp() {
        EventBus.emit('app:launch', { 
            appId: 'contact',
            source: 'about-app'
        });
        this.showNotification('Opening Contact app...');
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Recalculate layouts if needed
        EventBus.emit('about:resize');
    }

    /**
     * Show error message
     */
    showError(message) {
        this.container.innerHTML = `
            <div class="about-error">
                <div class="error-icon">⚠️</div>
                <h3>Oops! Something went wrong</h3>
                <p>${message}</p>
                <button class="btn-retry" onclick="location.reload()">Retry</button>
            </div>
        `;
    }

    /**
     * Show notification
     */
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'about-notification';
        notification.textContent = message;
        
        this.container.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Format number with k/m suffix
     */
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    /**
     * Debounce utility function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Cleanup and destroy component
     */
    destroy() {
        // Disconnect intersection observer
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }
        
        // Clear observed elements
        this.observedElements.clear();
        
        // Clear container
        this.container.innerHTML = '';
        
        EventBus.emit('about:destroyed');
    }

    /**
     * Group items by year for positioning
     */
    groupItemsByYear(items) {
        const grouped = {};
        items.forEach((item, index) => {
            const year = item.duration?.start ? new Date(item.duration.start).getFullYear() : new Date().getFullYear();
            if (!grouped[year]) {
                grouped[year] = [];
            }
            grouped[year].push({ item, index });
        });
        return grouped;
    }
}
