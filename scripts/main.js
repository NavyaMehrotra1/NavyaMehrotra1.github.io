const body = document.body; 
const toggleButton = document.getElementById('theme-toggle');
const currentTheme = localStorage.getItem('theme');

// Apply saved theme on load
if (currentTheme === 'dark') {
    body.classList.add('dark-mode');
    body.setAttribute('data-theme', 'dark');
} else {
    body.setAttribute('data-theme', 'light');
}

toggleButton.addEventListener('click', () => {
    const isDark = body.classList.contains('dark-mode');
    const newTheme = isDark ? 'light' : 'dark';
    
    body.setAttribute('data-theme', newTheme);
    body.classList.toggle('dark-mode');
    localStorage.setItem('theme', newTheme);
});