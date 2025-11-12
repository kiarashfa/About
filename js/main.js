// ===========================
// CUSTOM CURSOR
// ===========================
const cursor = document.querySelector('.cursor');
let cursorX = 0, cursorY = 0;
let mouseX = 0, mouseY = 0;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

function animateCursor() {
    cursorX += (mouseX - cursorX) * 0.25;
    cursorY += (mouseY - cursorY) * 0.25;
    cursor.style.left = cursorX + 'px';
    cursor.style.top = cursorY + 'px';
    requestAnimationFrame(animateCursor);
}
animateCursor();

document.addEventListener('mousedown', () => cursor.classList.add('active'));
document.addEventListener('mouseup', () => cursor.classList.remove('active'));

// ===========================
// PARALLAX SCROLLING
// ===========================
let scrollY = 0;
window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
    
    // Parallax only for hero elements
    const parallaxFast = document.querySelectorAll('.parallax-fast');
    const parallaxSlow = document.querySelectorAll('.parallax-slow');
    
    parallaxFast.forEach(el => {
        const speed = 0.5;
        const yPos = -(scrollY * speed);
        el.style.transform = `translateY(${yPos}px)`;
    });
    
    parallaxSlow.forEach(el => {
        const speed = 0.2;
        const yPos = -(scrollY * speed);
        el.style.transform = `translateY(${yPos}px)`;
    });
});

// ===========================
// SCROLL REVEAL ANIMATION
// ===========================
const revealElements = document.querySelectorAll('.glass-card, .work-card');

const revealOnScroll = () => {
    revealElements.forEach(el => {
        const elementTop = el.getBoundingClientRect().top;
        const elementBottom = el.getBoundingClientRect().bottom;
        const windowHeight = window.innerHeight;
        
        if (elementTop < windowHeight * 0.8 && elementBottom > 0) {
            el.classList.add('reveal');
        }
    });
};

window.addEventListener('scroll', revealOnScroll);
revealOnScroll(); // Initial check

// ===========================
// NAVIGATION ACTIVE STATE
// ===========================
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
const navLinks = document.querySelectorAll('.nav-links a');

navLinks.forEach(link => {
    if (link.getAttribute('href') === currentPage || 
        (currentPage === '' && link.getAttribute('href') === 'index.html')) {
        link.classList.add('active');
    }
});

// ===========================
// GOOGLE SCHOLAR DATA
// ===========================
async function fetchScholarData() {
    setTimeout(() => {
        const citationsEl = document.getElementById('citations-count');
        const hIndexEl = document.getElementById('h-index');
        const i10IndexEl = document.getElementById('i10-index');
        const publicationsEl = document.getElementById('publications-count');
        
        if (citationsEl) citationsEl.textContent = '50+';
        if (hIndexEl) hIndexEl.textContent = '4';
        if (i10IndexEl) i10IndexEl.textContent = '3';
        if (publicationsEl) publicationsEl.textContent = '8';
    }, 800);
}

window.addEventListener('DOMContentLoaded', fetchScholarData);
