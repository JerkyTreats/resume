// Resume Dashboard Script
class ResumeDashboard {
    constructor() {
        this.resumeGrid = document.getElementById('resumeGrid');
        this.loading = document.getElementById('loading');
        this.error = document.getElementById('error');
        this.errorMessage = document.getElementById('errorMessage');

        this.resumeTypes = [
            {
                id: 'eng_mgr',
                name: 'Engineering Manager',
                description: 'Leadership-focused resume highlighting engineering management experience',
                type: 'Management'
            },
            {
                id: 'ai_lead',
                name: 'AI/ML Lead',
                description: 'AI and machine learning focused resume with infrastructure expertise',
                type: 'Technical Leadership'
            },
            {
                id: 'staff_platform_engineer',
                name: 'Staff Platform Engineer',
                description: 'Senior platform engineering resume with infrastructure and SRE focus',
                type: 'Platform Engineering'
            }
        ];

        this.init();
    }

    async init() {
        try {
            await this.loadResumes();
        } catch (error) {
            this.showError('Failed to load resumes: ' + error.message);
        }
    }

    async loadResumes() {
        this.showLoading();

        try {
            const resumes = await this.discoverResumes();
            this.renderResumes(resumes);
            this.hideLoading();
        } catch (error) {
            this.hideLoading();
            throw error;
        }
    }

    async discoverResumes() {
        const resumes = [];

        for (const resumeType of this.resumeTypes) {
            try {
                const resumeData = await this.loadResumeData(resumeType.id);
                const headerData = await this.loadHeaderData();

                resumes.push({
                    ...resumeType,
                    header: headerData,
                    data: resumeData,
                    lastModified: await this.getLastModified(resumeType.id)
                });
            } catch (error) {
                console.warn(`Failed to load resume ${resumeType.id}:`, error);
                // Continue with other resumes even if one fails
            }
        }

        if (resumes.length === 0) {
            throw new Error('No valid resumes found');
        }

        return resumes;
    }

    async loadResumeData(resumeId) {
        const response = await fetch(`../data/${resumeId}/resume.json`);
        if (!response.ok) {
            throw new Error(`Failed to load resume data for ${resumeId}`);
        }
        return await response.json();
    }

    async loadHeaderData() {
        const response = await fetch('../data/shared/header.json');
        if (!response.ok) {
            throw new Error('Failed to load header data');
        }
        return await response.json();
    }

    async getLastModified(resumeId) {
        try {
            const response = await fetch(`../data/${resumeId}/resume.json`, { method: 'HEAD' });
            const lastModified = response.headers.get('last-modified');
            return lastModified ? new Date(lastModified) : new Date();
        } catch (error) {
            return new Date();
        }
    }

    renderResumes(resumes) {
        this.resumeGrid.innerHTML = '';

        resumes.forEach(resume => {
            const card = this.createResumeCard(resume);
            this.resumeGrid.appendChild(card);
        });
    }

    createResumeCard(resume) {
        const card = document.createElement('a');
        card.href = `/resume-ssr?resumeType=${resume.id}&template=default`;
        card.className = 'resume-card';
        card.target = '_blank';

        const lastModified = resume.lastModified.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        card.innerHTML = `
            <div class="resume-type">${resume.type}</div>
            <h2 class="resume-title">${resume.name}</h2>
            <p class="resume-subtitle">${resume.header.title}</p>
            <p class="resume-description">${resume.description}</p>
            <div class="resume-meta">
                <span class="resume-date">Updated: ${lastModified}</span>
                <span class="view-btn">View Resume</span>
            </div>
        `;

        return card;
    }

    showLoading() {
        this.loading.style.display = 'block';
        this.error.style.display = 'none';
        this.resumeGrid.style.display = 'none';
    }

    hideLoading() {
        this.loading.style.display = 'none';
        this.resumeGrid.style.display = 'grid';
    }

    showError(message) {
        this.loading.style.display = 'none';
        this.resumeGrid.style.display = 'none';
        this.error.style.display = 'block';
        this.errorMessage.textContent = message;
    }
}

// Initialize the dashboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ResumeDashboard();
});

// Add some interactive features
document.addEventListener('DOMContentLoaded', () => {
    // Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add keyboard navigation support
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Close any open modals or return to dashboard
            if (window.history.length > 1) {
                window.history.back();
            }
        }
    });
});
