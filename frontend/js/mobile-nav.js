/**
 * Mobil menü — mevcut header nav linklerinden drawer oluşturur
 */
(function () {
    function initMobileNav() {
        const header = document.getElementById('main-header');
        if (!header || header.dataset.mobileNavReady) return;
        header.dataset.mobileNavReady = '1';

        const headerRight = header.querySelector('.header-right') || header;
        const linkNodes = header.querySelectorAll('a.nav-link');
        const seen = new Set();
        const links = [];

        linkNodes.forEach((a) => {
            const href = a.getAttribute('href') || '';
            if (seen.has(href)) return;
            seen.add(href);
            links.push({
                href,
                text: (a.textContent || '').trim(),
                active: a.classList.contains('active')
            });
        });

        if (links.length === 0) return;

        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'nav-toggle';
        toggle.setAttribute('aria-label', 'Menüyü aç');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-controls', 'mobile-nav');
        toggle.innerHTML = '<span></span><span></span><span></span>';
        headerRight.appendChild(toggle);

        const overlay = document.createElement('div');
        overlay.className = 'mobile-nav-overlay';
        overlay.id = 'mobile-nav-overlay';
        overlay.hidden = true;

        const drawer = document.createElement('nav');
        drawer.className = 'mobile-nav';
        drawer.id = 'mobile-nav';
        drawer.setAttribute('aria-hidden', 'true');
        drawer.innerHTML = `
            <div class="mobile-nav-header">
                <span class="mobile-nav-title">Menü</span>
                <button type="button" class="mobile-nav-close" aria-label="Menüyü kapat">&times;</button>
            </div>
            <div class="mobile-nav-links">
                ${links.map((l) =>
                    `<a href="${l.href}" class="mobile-nav-link${l.active ? ' active' : ''}">${l.text}</a>`
                ).join('')}
            </div>
        `;

        document.body.appendChild(overlay);
        document.body.appendChild(drawer);

        const closeBtn = drawer.querySelector('.mobile-nav-close');

        function openMenu() {
            document.body.classList.add('mobile-nav-open');
            toggle.setAttribute('aria-expanded', 'true');
            toggle.setAttribute('aria-label', 'Menüyü kapat');
            drawer.setAttribute('aria-hidden', 'false');
            overlay.hidden = false;
        }

        function closeMenu() {
            document.body.classList.remove('mobile-nav-open');
            toggle.setAttribute('aria-expanded', 'false');
            toggle.setAttribute('aria-label', 'Menüyü aç');
            drawer.setAttribute('aria-hidden', 'true');
            overlay.hidden = true;
        }

        function toggleMenu() {
            if (document.body.classList.contains('mobile-nav-open')) closeMenu();
            else openMenu();
        }

        toggle.addEventListener('click', toggleMenu);
        overlay.addEventListener('click', closeMenu);
        closeBtn.addEventListener('click', closeMenu);
        drawer.querySelectorAll('a.mobile-nav-link').forEach((a) => {
            a.addEventListener('click', closeMenu);
        });

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeMenu();
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 900) closeMenu();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMobileNav);
    } else {
        initMobileNav();
    }
})();
