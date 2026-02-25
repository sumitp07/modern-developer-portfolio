/**
 * Portfolio scripts
 *
 * Goals:
 * - Wait for the DOM to be ready before touching elements
 * - Keep code modular and readable (small focused functions)
 * - Avoid global pollution (everything is scoped to this IIFE)
 */

(() => {
	'use strict';

	// ─── Constants ────────────────────────────────────────────────────────────

	/** Shared media-query strings. Define once to avoid scattered magic strings. */
	const MQ_DESKTOP        = '(min-width: 640px)';
	const MQ_REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

	// ─── Entry point ──────────────────────────────────────────────────────────

	/**
	 * Bootstraps the whole page.
	 * Keep this minimal: gather elements, wire features, run one-time updates.
	 */
	function init() {
		const elements = getElements();
		setCurrentYear(elements.year);
		setupSmoothScrolling();
		setupMobileNavToggle(elements.navToggle, elements.primaryNav);
		setupScrollReveal();
	}

	/**
	 * Central place for DOM lookups.
	 * Returning references keeps other functions easy to test/extend later.
	 */
	function getElements() {
		return {
			year:       document.getElementById('year'),
			navToggle:  document.getElementById('nav-toggle'),
			primaryNav: document.getElementById('primary-nav'),
		};
	}

	// ─── Features ─────────────────────────────────────────────────────────────

	/**
	 * Mobile navigation toggle (hamburger menu).
	 *
	 * Accessibility:
	 * - Uses a <button> with aria-controls + aria-expanded
	 * - Updates aria-label for screen readers (Open menu / Close menu)
	 * - Supports Escape to close
	 *
	 * Behavior:
	 * - Toggles an `is-open` class on the nav for CSS transitions
	 * - Closes when clicking outside the nav
	 * - Closes when a nav link is selected (useful on mobile)
	 */
	function setupMobileNavToggle(toggleButton, navEl) {
		if (!toggleButton || !navEl) return;

		const desktopMq = window.matchMedia(MQ_DESKTOP);

		function isMobile()  { return !desktopMq.matches; }
		function isOpen()    { return navEl.classList.contains('is-open'); }
		function closeMenu() { setOpen(false); }

		/** Single source of truth for all open/close side-effects. */
		function setOpen(nextOpen) {
			const isMobileOpen     = isMobile() && nextOpen;
			const navVisibleToUser = !isMobile() || isMobileOpen;

			navEl.classList.toggle('is-open', isMobileOpen);
			navEl.setAttribute('aria-hidden', String(!navVisibleToUser));

			toggleButton.setAttribute('aria-expanded', String(isMobileOpen));
			toggleButton.setAttribute('aria-label',    isMobileOpen ? 'Close menu' : 'Open menu');
			toggleButton.classList.toggle('is-active',  isMobileOpen);
		}

		// Consistent initial state on load.
		setOpen(false);

		// Toggle on button click (mobile only).
		toggleButton.addEventListener('click', () => {
			if (!isMobile()) return;
			setOpen(!isOpen());
		});

		// Close when a nav link is selected (common mobile UX pattern).
		navEl.addEventListener('click', (event) => {
			if (!isMobile() || !isOpen() || !getClickedLink(event)) return;
			closeMenu();
		});

		// Close on Escape; return focus to the toggle so keyboard users aren't lost.
		document.addEventListener('keydown', (event) => {
			if (event.key !== 'Escape' || !isMobile() || !isOpen()) return;
			closeMenu();
			toggleButton.focus();
		});

		// Close when clicking outside the nav and toggle button.
		document.addEventListener('click', (event) => {
			const target = event.target;
			if (
				!isMobile()               ||
				!isOpen()                 ||
				!(target instanceof Node) ||
				navEl.contains(target)    ||
				toggleButton.contains(target)
			) return;
			closeMenu();
		});

		// Reset at the desktop breakpoint so aria-hidden stays correct.
		desktopMq.addEventListener('change', () => setOpen(false));
	}

	/**
	 * Enables smooth scrolling for in-page navigation links (e.g. "#about").
	 *
	 * Implementation notes:
	 * - Uses event delegation (one listener) to avoid per-link listeners.
	 * - Ignores placeholder links like href="#".
	 * - Respects modifier clicks (Cmd/Ctrl/Shift/Alt) and non-left clicks.
	 * - Respects reduced-motion preferences.
	 */
	function setupSmoothScrolling() {
		document.addEventListener('click', (event) => {
			const link = getClickedLink(event);
			if (!link) return;

			const href = link.getAttribute('href');
			if (!href || !href.startsWith('#') || href === '#') return;
			if (isModifiedClick(event) || link.target === '_blank' || link.hasAttribute('download')) return;

			const targetId = safeDecodeHash(href.slice(1));
			const targetEl = targetId ? document.getElementById(targetId) : null;
			if (!targetEl) return;

			event.preventDefault();
			targetEl.scrollIntoView({
				behavior: prefersReducedMotion() ? 'auto' : 'smooth',
				block: 'start',
			});

			// Update the URL hash silently so the back button stays intuitive.
			history.pushState(null, '', `#${encodeURIComponent(targetId)}`);
		});
	}

	/**
	 * Scroll reveal via Intersection Observer.
	 *
	 * How it works:
	 * 1. Queries every element marked with [data-reveal].
	 * 2. Creates one IntersectionObserver that watches all of them.
	 * 3. The Observer fires a callback whenever a watched element
	 *    enters or exits the viewport (the "intersection root").
	 * 4. `entry.isIntersecting` is true when the element has crossed
	 *    the threshold (here 10% visible) — we respond by adding
	 *    `.is-visible`, which CSS transitions from hidden → visible.
	 * 5. `observer.unobserve(element)` stops watching after the first
	 *    reveal so the element never hides again on scroll-back.
	 * 6. When prefers-reduced-motion is set, all elements are revealed
	 *    instantly without any animation.
	 */
	function setupScrollReveal() {
  const revealEls = Array.from(document.querySelectorAll('[data-reveal]'));
  if (!revealEls.length) return;

  if (prefersReducedMotion()) {
    revealEls.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const el = entry.target;

        // Stagger only project cards
        if (el.classList.contains('projects__item')) {
          const index = Array.from(el.parentNode.children).indexOf(el);
          el.style.transitionDelay = `${index * 80}ms`;
        }

        el.classList.add('is-visible');
        obs.unobserve(el);
      });
    },
    {
      threshold: 0.12
    }
  );

  revealEls.forEach((el) => observer.observe(el));
}

	// ─── Utilities ────────────────────────────────────────────────────────────

	/** Returns the closest <a> ancestor of the click target, or null. */
	function getClickedLink(event) {
		return event.target instanceof Element ? event.target.closest('a') : null;
	}

	/** Returns true when a click should be left to the browser (modifier key, right-click, etc.). */
	function isModifiedClick(event) {
		return (
			event.defaultPrevented ||
			event.button !== 0     ||
			event.metaKey          ||
			event.ctrlKey          ||
			event.shiftKey         ||
			event.altKey
		);
	}

	/** Returns true when the user has requested reduced motion. */
	function prefersReducedMotion() {
		return window.matchMedia(MQ_REDUCED_MOTION).matches;
	}

	/** Decodes a URL-encoded hash fragment; falls back to the raw string on error. */
	function safeDecodeHash(value) {
		try {
			return decodeURIComponent(value);
		} catch {
			return value;
		}
	}

	/**
	 * Keeps the footer year current without affecting layout or styling.
	 */
	function setCurrentYear(yearEl) {
		if (!yearEl) return;
		yearEl.textContent = String(new Date().getFullYear());
	}

	/** Runs a callback once the DOM is ready; works with and without `defer`. */
	function onDomReady(callback) {
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', callback, { once: true });
			return;
		}
		callback();
	}

	onDomReady(init);
})();

