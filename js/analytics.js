// Google Analytics 4 (gtag.js) — standard property, no cost.
// Uses measurementId from js/config.js (same as Firebase Analytics data stream).
(function () {
    if (typeof firebaseConfig === 'undefined' || !firebaseConfig.measurementId) return;
    var id = String(firebaseConfig.measurementId).trim();
    if (!/^G-[A-Z0-9]+$/i.test(id)) return;

    window.dataLayer = window.dataLayer || [];
    function gtag() {
        window.dataLayer.push(arguments);
    }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', id);

    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    document.head.appendChild(s);
})();
