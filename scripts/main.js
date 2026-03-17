const themeToggle = document.getElementById('themeToggle');
const body = document.body;

// Check for saved theme preference or default to light mode
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    body.classList.add('dark-theme');
    themeToggle.classList.add('active');
}

themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-theme');
    themeToggle.classList.toggle('active');

    // Save theme preference
    if (body.classList.contains('dark-theme')) {
        localStorage.setItem('theme', 'dark');
    } else {
        localStorage.setItem('theme', 'light');
    }
});

// Project filter
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.getAttribute('data-filter');
        document.querySelectorAll('#allProjectsGrid .project-card').forEach(card => {
            if (filter === 'all' || card.getAttribute('data-category') === filter) {
                card.classList.remove('hidden');
            } else {
                card.classList.add('hidden');
            }
        });
    });
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Update CV last updated date using the Last-Modified header, if possible
window.addEventListener('DOMContentLoaded', async () => {
    // Support both the nav badge and (optionally) a CV section badge
    const navLink = document.getElementById('cvNavLink');
    const navBadge = document.getElementById('cvNavUpdated');
    const cvLink = document.getElementById('cvLink');
    const cvUpdated = document.getElementById('cvUpdated');

    // Determine CV URL from either the nav link or the CV section link
    const sourceLinkEl = navLink || cvLink;
    const cvUrl = sourceLinkEl ? sourceLinkEl.getAttribute('href') : null;
    if (!cvUrl) return;

    const applyFormattedDate = (formatted) => {
        if (navBadge && formatted) navBadge.textContent = `Updated ${formatted}`;
        if (cvUpdated && formatted) cvUpdated.textContent = formatted;
    };

    const applyFallback = () => {
        const navFallback = navBadge ? navBadge.getAttribute('data-fallback-date') : null;
        const sectionFallback = cvUpdated ? cvUpdated.getAttribute('data-fallback-date') : null;
        if (navBadge && navFallback) navBadge.textContent = `Updated ${navFallback}`;
        if (cvUpdated && sectionFallback) cvUpdated.textContent = sectionFallback;
    };

    try {
        // Use a HEAD request to avoid downloading the whole file
        const res = await fetch(cvUrl, { method: 'HEAD' });
        const lastModified = res.headers.get('Last-Modified');
        if (res.ok && lastModified) {
            const date = new Date(lastModified);
            // Format like "Sep 2025"
            const formatted = date.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
            if (formatted && formatted !== 'Invalid Date') {
                applyFormattedDate(formatted);
                return;
            }
        }
        applyFallback();
    } catch (e) {
        applyFallback();
    }
});
