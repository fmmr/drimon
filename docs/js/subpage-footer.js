(function () {
    const links = [
        { href: 'index.html',        text: 'Dashboard' },
        { href: 'windows.html',      text: 'Vindu' },
        { href: 'calendar.html',     text: 'Kalender' },
        { href: 'heat-frost.html',   text: 'Varme/frost' },
        { href: 'status.html',       text: 'Status' },
        { href: 'raw-statuses.html', text: 'Rå statuser' }
    ];

    const render = () => {
        const el = document.querySelector('[data-subpage-footer]');
        if (!el) return;
        el.innerHTML = links
            .map(l => `<a href="${l.href}">${l.text}</a>`)
            .join('');
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', render);
    } else {
        render();
    }
})();
