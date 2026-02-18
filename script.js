
// Keeps the footer year current without affecting layout or styling.
(function setCurrentYear() {
	const yearEl = document.getElementById('year');
	if (!yearEl) return;
	yearEl.textContent = String(new Date().getFullYear());
})();

