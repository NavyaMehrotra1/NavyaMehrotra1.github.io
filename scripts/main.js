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

// Scroll-reveal: fade elements up as they enter the viewport
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if ('IntersectionObserver' in window && !reducedMotion) {
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
} else {
    // No observer support or reduced motion: show everything immediately
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
}

// Subtle cursor-following spotlight on honor cards (understated, no tilt)
if (!reducedMotion) {
    document.querySelectorAll('.honor-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty('--mx', ((e.clientX - rect.left) / rect.width) * 100 + '%');
            card.style.setProperty('--my', ((e.clientY - rect.top) / rect.height) * 100 + '%');
        });
    });
}

// Company logo fallback → monogram if the image fails to load
document.querySelectorAll('.honor-logo img').forEach(img => {
    img.addEventListener('error', () => {
        const tile = img.parentNode;
        tile.classList.add('is-fallback');
        tile.textContent = tile.getAttribute('data-monogram') || '';
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

// ============================================================
// Interactive Terminal (X-factor centerpiece)
// ============================================================
(function () {
    const output = document.getElementById('terminalOutput');
    const input = document.getElementById('terminalInput');
    const inputLine = document.getElementById('terminalInputLine');
    const bodyEl = document.getElementById('terminalBody');
    const windowEl = document.getElementById('terminalWindow');
    const hints = document.getElementById('terminalHints');
    if (!output || !input) return;

    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const history = [];
    let histIdx = -1;

    // ---- data ----
    const honors = {
        'jane-street': { firm: 'Jane Street', program: 'INSIGHT', badge: 'Selective', desc: "Selected for Jane Street's INSIGHT, an immersive program for exceptional students exploring quantitative trading, research, and technology." },
        'goldman':     { firm: 'Goldman Sachs', program: 'Emerging Leaders Summit', badge: 'Runner-Up', desc: 'Recognized as Runner-Up among a competitive cohort of emerging leaders selected nationwide.' },
        'bridgewater': { firm: 'Bridgewater Associates', program: 'AI Immersion Hackathon', badge: 'Invitation Only', desc: "Invited to build applied AI alongside the world's largest hedge fund." },
        'citadel':     { firm: 'Citadel', program: 'Datathon', badge: 'Invitation Only', desc: "Invited to compete in Citadel's invitation-only data science competition." },
        'accenture':   { firm: 'Accenture', program: 'Student Leadership Program', badge: 'Invitation Only', desc: "Invited to Accenture's leadership development program for emerging tech & consulting leaders." }
    };

    const projects = {
        'delineo':       { title: 'Delineo Disease Modelling Simulator', desc: 'Disease-spread simulator built with the WHO & Ruvos. Won the Dean\'s Design Award in CS.', link: 'https://delineo.me/' },
        'hackoverflow':  { title: 'HackOverflow (Stanford TreeHacks 2x Winner)', desc: 'Stack Overflow for AI agents. Best Use of Multi-Agent Systems (Fetch.ai) + Best Use of Runpod Flash.', link: 'https://devpost.com/software/hackoverflow-stack-overflow-for-ai-agents-at-hackathons' },
        'nlp':           { title: 'Multi-Perspective LLM Annotations (CSSL)', desc: 'Paper with the Computational Social Sciences Lab (Dr. Kristina Gligorić). Under submission to ACL ARR & COLM.' },
        'causal':        { title: 'Causal Inference in Empirical Studies', desc: '$6000 BDP Summer Research Fellowship with Dr. Paul Ferraro. Analyzed hundreds of empirical econ papers.' },
        'counterfactual':{ title: 'AI-Driven Disease Counterfactual Analysis', desc: 'Double machine learning + clustering to answer causal questions in disease modeling.', link: 'https://github.com/Delineo-Disease-Modeling/ai-counterfactual-analysis' },
        'bluejay':       { title: 'Testing BlueJay', desc: 'JHU PL lab: a semantically-typed language with a type checker for bug finding.', link: 'https://github.com/NavyaMehrotra1/jaylang' },
        'ai-accountant': { title: 'AI Accountant (Claude Hackathon Winner)', desc: 'End-to-end AI accounting: bookkeeping, categorization, and financial reporting.' },
        'dealflow':      { title: 'Deal Flow (AI VC Tool)', desc: 'HackMIT: an AI agent builds a company graph, then forecasts performance.', link: 'https://v0-remix-of-graph-visualization-fr.vercel.app/' },
        'microfi':       { title: 'Microfi: Blockchain for Microfinance', desc: 'Technica: transparent, accessible microfinance loans on-chain.', link: 'https://devpost.com/software/microfi-blockchain-for-microfinance' }
    };

    const aliases = {
        'jane': 'jane-street', 'janestreet': 'jane-street', 'js': 'jane-street',
        'gs': 'goldman', 'goldman-sachs': 'goldman',
        'bw': 'bridgewater', 'citadel-datathon': 'citadel',
        'cssl': 'nlp', 'llm': 'nlp', 'paper': 'nlp',
        'who': 'delineo', 'treehacks': 'hackoverflow', 'bdp': 'causal'
    };

    const resolve = (k) => {
        k = (k || '').toLowerCase();
        if (aliases[k]) k = aliases[k];
        return k;
    };

    // ---- printing ----
    function print(html) {
        const div = document.createElement('div');
        div.className = 'terminal-line';
        div.innerHTML = html;
        output.appendChild(div);
        bodyEl.scrollTop = bodyEl.scrollHeight;
    }

    function echo(cmd) {
        print('<span class="terminal-echo"><span class="terminal-prompt">navya@portfolio:~$</span>' + esc(cmd) + '</span>');
    }

    // ---- command implementations ----
    const cmds = {
        help() {
            return [
                '<span class="t-green">Available commands</span>',
                '  <span class="t-blue">whoami</span>       who I am, in one line',
                '  <span class="t-blue">about</span>        the longer story',
                '  <span class="t-blue">ls</span> [dir]     list sections  (try: ls honors)',
                '  <span class="t-blue">cat</span> &lt;name&gt;   open an item   (try: cat jane-street)',
                '  <span class="t-blue">honors</span>       selective programs &amp; recognition',
                '  <span class="t-blue">projects</span>     featured projects &amp; research',
                '  <span class="t-blue">experience</span>   research, teaching, leadership',
                '  <span class="t-blue">awards</span>       awards &amp; recognition',
                '  <span class="t-blue">skills</span>       languages &amp; tools',
                '  <span class="t-blue">summer2026</span>   what\'s next',
                '  <span class="t-blue">contact</span>      how to reach me',
                '  <span class="t-blue">theme</span>        toggle light / dark',
                '  <span class="t-blue">clear</span>        clear the screen',
                '',
                '<span class="t-dim">tip: ↑/↓ cycles history · Tab autocompletes</span>'
            ].join('\n');
        },
        whoami() {
            return '<span class="t-white">Navya Mehrotra</span>\nCS + Econ @ Johns Hopkins · <span class="t-accent">AI, math, and building things that matter.</span>';
        },
        about() {
            return [
                '<span class="t-white">Navya Mehrotra</span>',
                'CS + Econ @ Johns Hopkins (minors: Applied Math & Statistics, Financial Economics).',
                '',
                'Right now I\'m:',
                '  ▸ a <span class="t-blue">BDP Fellow</span> · research with Dr. Gillian Hadfield',
                '  ▸ an <span class="t-blue">AI Engineering Intern</span> @ Carebrain <span class="t-dim">(Neo portfolio company)</span>',
                '',
                'I build research, projects, and startups with tech that can help people.',
                '<span class="t-dim">type `honors`, `projects`, or `experience` to dig in.</span>'
            ].join('\n');
        },
        ls(arg) {
            const dir = resolve(arg);
            if (!arg) {
                return 'about   <span class="t-blue">honors/</span>   <span class="t-blue">projects/</span>   <span class="t-blue">experience/</span>   awards   summer2026   contact';
            }
            if (dir === 'honors')   return Object.keys(honors).join('   ');
            if (dir === 'projects') return Object.keys(projects).join('   ');
            if (dir === 'experience') return 'research/   teaching/   leadership/';
            return '<span class="t-accent">ls: ' + esc(arg) + ': no such directory</span> <span class="t-dim">(try: ls honors)</span>';
        },
        cat(arg) {
            if (!arg) return '<span class="t-accent">usage: cat &lt;name&gt;</span> <span class="t-dim">(try: cat goldman)</span>';
            const k = resolve(arg);
            if (honors[k]) {
                const h = honors[k];
                return '<span class="t-white">' + esc(h.firm) + '</span> · <span class="t-blue">' + esc(h.program) + '</span>  <span class="t-accent">[' + esc(h.badge) + ']</span>\n' + esc(h.desc);
            }
            if (projects[k]) {
                const p = projects[k];
                let out = '<span class="t-white">' + esc(p.title) + '</span>\n' + esc(p.desc);
                if (p.link) out += '\n<span class="t-dim">→</span> <a href="' + p.link + '" target="_blank" rel="noopener">' + p.link + '</a>';
                return out;
            }
            return '<span class="t-accent">cat: ' + esc(arg) + ': not found</span> <span class="t-dim">(try `ls honors` or `ls projects`)</span>';
        },
        honors() {
            return '<span class="t-green">Selective Programs & Honors</span>\n' +
                Object.keys(honors).map(k => {
                    const h = honors[k];
                    return '  ▸ <span class="t-white">' + esc(h.firm) + '</span> · ' + esc(h.program) + ' <span class="t-accent">[' + esc(h.badge) + ']</span>  <span class="t-dim">cat ' + k + '</span>';
                }).join('\n');
        },
        projects() {
            return '<span class="t-green">Featured Projects & Research</span>\n' +
                Object.keys(projects).map(k => '  ▸ <span class="t-white">' + esc(projects[k].title) + '</span>  <span class="t-dim">cat ' + k + '</span>').join('\n');
        },
        experience() {
            return [
                '<span class="t-green">Experience</span>',
                '<span class="t-blue">research/</span>    BDP Fellowship (Dr. Ferraro) · Delineo · SWE Intern @ ATUN',
                '<span class="t-blue">teaching/</span>    CA Calc II · TA Calc I · TIG Fellow · SPARK/PILOT/Learning Den tutor',
                '<span class="t-blue">leadership/</span>  Founder & President, Data Science Club · VP, HopAI ·',
                '             Secretary, WiCS · Treasurer, SWE · First-Year Mentor'
            ].join('\n');
        },
        awards() {
            return '<span class="t-green">Awards & Recognition</span>\n' +
                '  ★ Dean\'s Design Award (Computer Science)\n' +
                '  ★ Women\'s Leadership Scholarship\n' +
                '  ★ Summer BDP Research Award ($6000)\n' +
                '  ★ Goldman Sachs Emerging Leaders (Runner-Up)\n' +
                '  ★ TreeHacks 2x Winner · Claude Hackathon Winner';
        },
        skills() {
            return [
                '<span class="t-green">Languages</span>   Python · OCaml · JavaScript/TypeScript · SQL · Solidity · HTML/CSS',
                '<span class="t-green">ML / Data</span>   PyTorch-style DL · scikit-learn · EconML · clustering · NLP/LLMs · causal inference',
                '<span class="t-green">Tools</span>       Flask · Node.js · MongoDB · React · Web3 · Claude API · Git'
            ].join('\n');
        },
        summer2026() {
            return [
                '<span class="t-green">Currently · Summer 2026</span>',
                '  ▸ <span class="t-white">BDP Summer Program</span> · research with Dr. Gillian Hadfield',
                '  ▸ <span class="t-white">AI Engineering Intern</span> @ Carebrain <span class="t-dim">(Neo portfolio company)</span>'
            ].join('\n');
        },
        contact() {
            return [
                '<span class="t-green">Get in touch</span>',
                '  email   <a href="mailto:nmehrot2@jh.edu">nmehrot2@jh.edu</a>',
                '  github  <a href="https://github.com/NavyaMehrotra1" target="_blank" rel="noopener">github.com/NavyaMehrotra1</a>'
            ].join('\n');
        },
        theme() {
            const toggle = document.getElementById('themeToggle');
            if (toggle) toggle.click();
            const mode = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
            return '<span class="t-dim">switched to ' + mode + ' mode.</span>';
        },
        echo(arg) { return esc(arg || ''); },
        pwd() { return '/home/navya/portfolio'; },
        date() { return new Date().toString(); },
        history() { return history.length ? history.map((h, i) => '  ' + (i + 1) + '  ' + esc(h)).join('\n') : '<span class="t-dim">no history yet</span>'; },
        sudo() { return '<span class="t-accent">Permission denied.</span> nice try, you don\'t have root on Navya\'s ambition. 😏'; },
        clear() { output.innerHTML = ''; return null; }
    };

    // command name list (for autocomplete) + friendly aliases
    const cmdAliases = { '2026': 'summer2026', 'next': 'summer2026', 'links': 'contact', 'email': 'contact', 'me': 'whoami', 'cls': 'clear', 'man': 'help', '?': 'help' };
    const cmdNames = Object.keys(cmds).concat(Object.keys(cmdAliases));

    function run(raw) {
        const line = raw.trim();
        if (!line) return;
        history.push(line);
        histIdx = history.length;
        const parts = line.split(/\s+/);
        let name = parts[0].toLowerCase();
        const arg = line.slice(parts[0].length).trim();
        if (cmdAliases[name]) name = cmdAliases[name];
        if (cmds[name]) {
            const result = cmds[name](arg);
            if (result !== null && result !== undefined) print(result);
        } else {
            print('<span class="t-accent">command not found: ' + esc(parts[0]) + '</span> <span class="t-dim">· type `help`</span>');
        }
    }

    // ---- autocomplete ----
    function complete() {
        const val = input.value;
        const parts = val.split(/\s+/);
        if (parts.length <= 1) {
            const m = cmdNames.filter(c => c.startsWith(val.toLowerCase()));
            if (m.length === 1) input.value = m[0] + ' ';
            else if (m.length > 1) print('<span class="t-dim">' + m.join('   ') + '</span>');
        } else {
            const base = parts[0].toLowerCase();
            const frag = parts[parts.length - 1].toLowerCase();
            let pool = [];
            if (base === 'cat') pool = Object.keys(honors).concat(Object.keys(projects));
            else if (base === 'ls') pool = ['honors', 'projects', 'experience'];
            const m = pool.filter(c => c.startsWith(frag));
            if (m.length === 1) input.value = parts.slice(0, -1).concat(m[0]).join(' ');
            else if (m.length > 1) print('<span class="t-dim">' + m.join('   ') + '</span>');
        }
    }

    // ---- input handling ----
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const v = input.value;
            echo(v);
            input.value = '';
            run(v);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (histIdx > 0) { histIdx--; input.value = history[histIdx]; }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (histIdx < history.length - 1) { histIdx++; input.value = history[histIdx]; }
            else { histIdx = history.length; input.value = ''; }
        } else if (e.key === 'Tab') {
            e.preventDefault();
            complete();
        } else if (e.key === 'l' && e.ctrlKey) {
            e.preventDefault();
            output.innerHTML = '';
        }
    });

    // focus input when clicking anywhere in the terminal body
    bodyEl.addEventListener('click', () => {
        if (window.getSelection().toString() === '') input.focus();
    });

    // hint chips run their command
    if (hints) {
        hints.querySelectorAll('.hint-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const c = chip.getAttribute('data-cmd');
                input.focus();
                echo(c);
                run(c);
            });
        });
    }

    // CLI / GUI toggle: the footer easter egg reveals this terminal
    const section = document.getElementById('terminal');
    const toggleBtn = document.getElementById('cliToggle');
    const toggleText = document.getElementById('cliToggleText');
    if (section && toggleBtn) {
        let open = false;
        toggleBtn.addEventListener('click', () => {
            open = !open;
            section.style.display = open ? 'block' : 'none';
            toggleBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
            if (toggleText) toggleText.textContent = open ? 'back to GUI' : 'prefer a terminal?';
            if (open) {
                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                setTimeout(() => { try { input.focus({ preventScroll: true }); } catch (e) { input.focus(); } }, 450);
            }
        });
    }

    // ---- boot sequence (typewriter) ----
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const bootLines = [
        '<span class="t-dim">navya.os · portfolio terminal · booting...</span>',
        '',
        'Hi 👋  Welcome to my interactive portfolio.',
        'Type <span class="t-blue">help</span> to see what you can do, or tap a chip below.'
    ];

    function showInput() {
        inputLine.style.display = 'flex';
        // only autofocus on click later; don't steal scroll on load
    }

    if (reduced) {
        bootLines.forEach(l => print(l));
        showInput();
    } else {
        let i = 0;
        (function typeBoot() {
            if (i < bootLines.length) {
                print(bootLines[i]);
                i++;
                setTimeout(typeBoot, 260);
            } else {
                showInput();
            }
        })();
    }
})();

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
