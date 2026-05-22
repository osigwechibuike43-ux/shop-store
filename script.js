/*
  ============================================================
  FILE: js/script.js
  PURPOSE: All interactive behaviour for SparkleHome website.

  TABLE OF CONTENTS:
    1.  DOMContentLoaded wrapper
    2.  Navbar — scroll effect + active link spy
    3.  Hamburger — mobile menu toggle
    4.  Scroll Animations — IntersectionObserver fade-in
    5.  Stats Counter — animated number count-up
    6.  Contact Form — validation + submission feedback
    7.  Back-to-Top Button
    8.  Current Year in Footer copyright
    9.  Video Fallback — graceful handling if videos are missing
  ============================================================
*/


/* ============================================================
  Everything runs after the HTML is fully loaded.
  This prevents "element not found" errors.
============================================================ */
document.addEventListener('DOMContentLoaded', function () {

  /* ----------------------------------------------------------
    2. NAVBAR — Scroll Effect & Active Link Spy
    ----------------------------------------------------------
    - Adds class "scrolled" to navbar when user scrolls > 80px.
      CSS then gives it a dark background + shadow.
    - Tracks which section is currently in the viewport and
      highlights the matching nav link with class "active".
  ---------------------------------------------------------- */

  const navbar      = document.getElementById('navbar');
  const navLinks    = document.querySelectorAll('.nav-link');
  const sections    = document.querySelectorAll('section[id]');

  /* ── Scroll Event Listener ── */
  window.addEventListener('scroll', function () {
    const scrollY = window.scrollY;

    /* Toggle dark background on scroll */
    if (scrollY > 80) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    /* ── Active Link Spy ──
       Loop through all sections and check which one is
       currently at the top of the viewport.                  */
    sections.forEach(function (section) {
      /* Distance from top of page to the start of section */
      const sectionTop    = section.offsetTop - 120;
      /* Height of the section */
      const sectionHeight = section.offsetHeight;
      const sectionId     = section.getAttribute('id');

      /* Is the current scroll position inside this section? */
      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        /* Remove "active" from all links */
        navLinks.forEach(function (link) {
          link.classList.remove('active');
        });
        /* Add "active" to the matching link */
        const activeLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
        if (activeLink) {
          activeLink.classList.add('active');
        }
      }
    });
  });


  /* ----------------------------------------------------------
    3. HAMBURGER — Mobile Menu Toggle
    ----------------------------------------------------------
    Clicking the hamburger button:
    - Toggles class "open" on the hamburger (animates to X)
    - Toggles class "open" on the nav links (slides in from right)
    Clicking a nav link also closes the menu (UX improvement).
  ---------------------------------------------------------- */

  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('navLinks');

  if (hamburger && mobileNav) {

    /* Toggle menu on hamburger click */
    hamburger.addEventListener('click', function () {
      hamburger.classList.toggle('open');
      mobileNav.classList.toggle('open');
    });

    /* Close menu when a nav link is clicked */
    mobileNav.querySelectorAll('.nav-link').forEach(function (link) {
      link.addEventListener('click', function () {
        hamburger.classList.remove('open');
        mobileNav.classList.remove('open');
      });
    });

    /* Close menu when user clicks outside of it */
    document.addEventListener('click', function (event) {
      const isInsideNav  = mobileNav.contains(event.target);
      const isHamburger  = hamburger.contains(event.target);

      if (!isInsideNav && !isHamburger && mobileNav.classList.contains('open')) {
        hamburger.classList.remove('open');
        mobileNav.classList.remove('open');
      }
    });
  }


  /* ----------------------------------------------------------
    4. SCROLL ANIMATIONS — IntersectionObserver
    ----------------------------------------------------------
    All elements with class "animate-on-scroll" start invisible
    (opacity: 0, translateY: 40px in CSS).

    IntersectionObserver fires a callback when each element
    enters the visible viewport. We then:
    1. Apply a transition delay (from data-delay attribute)
    2. Add class "visible" → CSS transitions run → element fades in

    This is more performant than scroll event listeners.
  ---------------------------------------------------------- */

  /* Grab all elements that need scroll animation */
  const animatedElements = document.querySelectorAll('.animate-on-scroll');

  /* Create the observer */
  const scrollObserver = new IntersectionObserver(

    function (entries, observer) {
      entries.forEach(function (entry) {
        /* entry.isIntersecting = true when element is visible */
        if (entry.isIntersecting) {

          const element = entry.target;

          /* Read delay value from data-delay attribute (in ms) */
          const delayMs = element.getAttribute('data-delay') || 0;
          element.style.transitionDelay = delayMs + 'ms';

          /* Add "visible" class to trigger the CSS animation */
          element.classList.add('visible');

          /* Once animated, stop observing to save resources */
          observer.unobserve(element);
        }
      });
    },

    {
      /* Trigger when 15% of the element is visible */
      threshold: 0.15,
      /* Start triggering 50px before the element enters viewport */
      rootMargin: '0px 0px -50px 0px'
    }
  );

  /* Observe every animated element */
  animatedElements.forEach(function (el) {
    scrollObserver.observe(el);
  });


  /* ----------------------------------------------------------
    5. STATS COUNTER — Animated Number Count-Up
    ----------------------------------------------------------
    When the stats row enters the viewport, the numbers
    animate from 0 up to their target value (stored in
    data-target attribute on each .stat-number element).

    Uses a separate IntersectionObserver that fires ONCE.
  ---------------------------------------------------------- */

  const statNumbers = document.querySelectorAll('.stat-number');

  /* Helper: animates a single number from 0 to target */
  function animateCounter(element, target, duration) {
    /* duration: total animation time in milliseconds */
    const start     = 0;
    const increment = target / (duration / 16);  /* 60fps */
    let   current   = start;

    const timer = setInterval(function () {
      current += increment;

      if (current >= target) {
        current = target;       /* Snap to exact target */
        clearInterval(timer);   /* Stop the timer */
      }

      /* Update the displayed number (floor = no decimals) */
      element.textContent = Math.floor(current).toLocaleString();

    }, 16);  /* ~60fps */
  }

  /* Observer specifically for the stats row */
  const statsObserver = new IntersectionObserver(

    function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          /* Animate each stat number */
          statNumbers.forEach(function (el) {
            const target = parseInt(el.getAttribute('data-target'), 10);
            animateCounter(el, target, 1800);  /* 1.8 second animation */
          });
          /* Only animate once */
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.3 }
  );

  /* Observe the stats row (parent of stat numbers) */
  const statsRow = document.querySelector('.stats-row');
  if (statsRow) {
    statsObserver.observe(statsRow);
  }


  /* ----------------------------------------------------------
    6. CONTACT FORM — Validation & Submission Feedback
    ----------------------------------------------------------
    Prevents form from doing a real page-reload submission.
    Instead:
    1. Validates required fields
    2. Shows a success message on the page
    3. Resets the form after 3 seconds
    (Replace this with a real backend call or form service.)
  ---------------------------------------------------------- */

  const contactForm  = document.getElementById('contactForm');
  const formMessage  = document.getElementById('formMessage');

  if (contactForm) {

    contactForm.addEventListener('submit', function (event) {

      /* Always prevent default HTML form submission */
      event.preventDefault();

      /* ── Grab field values ── */
      const nameInput    = document.getElementById('name');
      const emailInput   = document.getElementById('email');
      const phoneInput   = document.getElementById('phone');

      const name  = nameInput.value.trim();
      const email = emailInput.value.trim();
      const phone = phoneInput.value.trim();

      /* ── Basic Validation ── */
      let   isValid      = true;
      const missingFields = [];

      if (!name) {
        missingFields.push('Full Name');
        nameInput.style.borderColor = '#e05c5c';
        isValid = false;
      } else {
        nameInput.style.borderColor = '';
      }

      if (!email || !isValidEmail(email)) {
        missingFields.push('Email Address');
        emailInput.style.borderColor = '#e05c5c';
        isValid = false;
      } else {
        emailInput.style.borderColor = '';
      }

      if (!phone) {
        missingFields.push('Phone Number');
        phoneInput.style.borderColor = '#e05c5c';
        isValid = false;
      } else {
        phoneInput.style.borderColor = '';
      }

      /* ── Show Error or Success Message ── */
      if (!isValid) {
        formMessage.textContent = `Please fill in: ${missingFields.join(', ')}`;
        formMessage.className   = 'form-message error';
        return;  /* Stop execution */
      }

      /* ── Simulate Successful Submission ── */
      /* 
        TO DO: Replace the block below with a real API call.
        Example using fetch:

        fetch('https://your-backend.com/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, phone, message })
        })
        .then(res => res.json())
        .then(data => { ... show success ... })
        .catch(err => { ... show error ... });
      */

      /* Disable submit button to prevent double submission */
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      submitBtn.disabled   = true;
      submitBtn.textContent = 'Sending…';

      /* Simulate a network delay */
      setTimeout(function () {

        /* Show success message */
        formMessage.textContent = `✓ Thank you, ${name}! We'll contact you within 2 hours to confirm your booking.`;
        formMessage.className   = 'form-message success';

        /* Reset the form */
        contactForm.reset();
        submitBtn.disabled   = false;
        submitBtn.innerHTML  = '<i class="fas fa-paper-plane"></i> Request Cleaning';

        /* Hide success message after 6 seconds */
        setTimeout(function () {
          formMessage.className = 'form-message';
          formMessage.textContent = '';
        }, 6000);

      }, 1200);  /* Simulated 1.2 second API call */
    });
  }

  /* ── Helper: Basic Email Validation ── */
  function isValidEmail(email) {
    /* Simple regex that checks for user@domain.tld format */
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }


  /* ----------------------------------------------------------
    7. BACK-TO-TOP BUTTON
    ----------------------------------------------------------
    - Shows the button after user scrolls 400px down
    - Clicking it smoothly scrolls back to top of page
  ---------------------------------------------------------- */

  const backToTopBtn = document.getElementById('backToTop');

  if (backToTopBtn) {

    /* Show / hide on scroll */
    window.addEventListener('scroll', function () {
      if (window.scrollY > 400) {
        backToTopBtn.classList.add('visible');
      } else {
        backToTopBtn.classList.remove('visible');
      }
    });

    /* Scroll to top on click */
    backToTopBtn.addEventListener('click', function () {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'  /* CSS scroll-behavior handles this */
      });
    });
  }


  /* ----------------------------------------------------------
    8. CURRENT YEAR IN FOOTER
    ----------------------------------------------------------
    Automatically updates the copyright year so you never
    need to manually change it.
  ---------------------------------------------------------- */

  const yearSpan = document.getElementById('currentYear');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }


  /* ----------------------------------------------------------
    9. VIDEO FALLBACK
    ----------------------------------------------------------
    If a video file doesn't exist or can't load, the browser
    shows the poster image automatically (via the poster
    attribute on the <video> tag). This listener adds an
    extra fallback class for additional CSS styling if needed.
  ---------------------------------------------------------- */

  const allVideos = document.querySelectorAll('video');

  allVideos.forEach(function (video) {
    /* Fired when the video cannot load */
    video.addEventListener('error', function () {
      video.classList.add('video-error');
      /* The poster image will show automatically.
         No additional action needed. */
      console.info('Video not found, showing poster image:', video.currentSrc);
    });

    /* Attempt to play (required by some mobile browsers) */
    video.play().catch(function () {
      /* Autoplay was blocked by browser (common on mobile).
         The video will still show its poster image.
         User can tap to play if needed.                   */
    });
  });


  /* ----------------------------------------------------------
    BONUS: Smooth hover effect on service cards
    Adds a subtle parallax tilt to each card on mouse move.
  ---------------------------------------------------------- */

  const serviceCards = document.querySelectorAll('.service-card');

  serviceCards.forEach(function (card) {

    card.addEventListener('mousemove', function (e) {
      /* Get card dimensions and mouse position within it */
      const rect   = card.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      /* Calculate rotation angles (subtle — max ±5deg) */
      const tiltX = ((mouseY / rect.height) - 0.5) * -8;
      const tiltY = ((mouseX / rect.width)  - 0.5) *  8;

      /* Apply 3D tilt transform */
      card.style.transform = `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-8px)`;
    });

    /* Reset transform when mouse leaves */
    card.addEventListener('mouseleave', function () {
      card.style.transform = '';
    });
  });


  /* Log success message to console (helpful during development) */
  console.log('✨ SparkleHome website loaded successfully!');

}); /* END DOMContentLoaded */
