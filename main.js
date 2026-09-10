import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Matter from 'matter-js';

gsap.registerPlugin(ScrollTrigger);

const cursorDot = document.querySelector('.cursor-dot');
const cursorOutline = document.querySelector('.cursor-outline');
const trails = document.querySelectorAll('.cursor-trail');
let mouseX = 0, mouseY = 0;

window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX; mouseY = e.clientY;
    gsap.to(cursorDot, { x: mouseX, y: mouseY, duration: 0.1 });
    gsap.to(cursorOutline, { x: mouseX, y: mouseY, duration: 0.3 });
    trails.forEach((trail, index) => {
        gsap.to(trail, { x: mouseX, y: mouseY, duration: 0.15 + (index * 0.1) });
    });
});

document.querySelectorAll('a, .matter-box, button, input').forEach(el => {
    el.addEventListener('mouseenter', () => { gsap.to(cursorOutline, { scale: 1.5, borderColor: '#ff003c', duration: 0.3 }); });
    el.addEventListener('mouseleave', () => { gsap.to(cursorOutline, { scale: 1, borderColor: '#00f3ff', duration: 0.3 }); });
});

const bars = document.querySelectorAll('.bar');
const animateVisualizer = () => {
    bars.forEach(bar => {
        const height = Math.random() * 30 + 5;
        gsap.to(bar, { height: `${height}px`, duration: 0.15 });
    });
    requestAnimationFrame(() => setTimeout(animateVisualizer, 150));
};
animateVisualizer();

const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*";
document.querySelectorAll('.hacker-text').forEach(el => {
    el.addEventListener('mouseover', event => {
        let iterations = 0;
        const originalText = event.target.dataset.value;
        const interval = setInterval(() => {
            event.target.innerText = originalText.split("").map((letter, index) => {
                if(index < iterations || letter === " ") return originalText[index];
                return chars[Math.floor(Math.random() * chars.length)];
            }).join("");
            if(iterations >= originalText.length) clearInterval(interval);
            iterations += 1 / 3;
        }, 30);
    });
});

window.addEventListener('load', () => {
    const tl = gsap.timeline();
    tl.to('.loading-bar', { width: '100%', duration: 1.5, ease: 'power2.inOut' })
      .to('.loader', { yPercent: -100, duration: 1, ease: 'expo.inOut' })
      .from('.pre-title', { y: 20, opacity: 0, duration: 0.5 })
      .from('.massive-title', { y: 100, opacity: 0, duration: 0.8, stagger: 0.2, ease: 'back.out(1.5)' }, "-=0.3")
      .from('.subtitle, .system-status', { opacity: 0, duration: 1, stagger: 0.2 }, "-=0.2");
});

gsap.to(".hero-content", {
    yPercent: 50, opacity: 0,
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
});

const Engine = Matter.Engine, Render = Matter.Render, Runner = Matter.Runner,
      MouseConstraint = Matter.MouseConstraint, Mouse = Matter.Mouse,
      World = Matter.World, Bodies = Matter.Bodies, Events = Matter.Events;

const engine = Engine.create();
const world = engine.world;
engine.gravity.y = 0.8;

const physicsSection = document.getElementById('physics-section');
let width = window.innerWidth;
let height = window.innerHeight * 1.2;

const wallOptions = { isStatic: true, render: { visible: false } };
const floor = Bodies.rectangle(width / 2, height + 50, width * 2, 100, wallOptions);
const leftWall = Bodies.rectangle(-50, height / 2, 100, height * 2, wallOptions);
const rightWall = Bodies.rectangle(width + 50, height / 2, 100, height * 2, wallOptions);
const ceiling = Bodies.rectangle(width / 2, -1000, width * 2, 100, wallOptions);
World.add(world, [floor, leftWall, rightWall, ceiling]);

const domBoxes = document.querySelectorAll('.matter-box');
const physicsBodies = [];

domBoxes.forEach((box, index) => {
    const boxWidth = box.offsetWidth;
    const boxHeight = box.offsetHeight;
    const weight = box.dataset.weight;
    let density = 0.05, restitution = 0.4, frictionAir = 0.01;
    if (weight === 'heavy') { density = 0.1; restitution = 0.2; }
    if (weight === 'light') { density = 0.01; restitution = 0.8; frictionAir = 0.05; }
    const body = Bodies.rectangle(
        (width / 2) + (Math.random() * 400 - 200), -500 - (index * 150),
        boxWidth, boxHeight,
        { restitution: restitution, friction: 0.5, frictionAir: frictionAir, density: density, angle: Math.random() * 0.5 - 0.25 }
    );
    physicsBodies.push({ element: box, body: body });
});

const mouse = Mouse.create(physicsSection);
const mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: { stiffness: 0.1, render: { visible: false } }
});
mouse.element.removeEventListener("mousewheel", mouse.mousewheel);
mouse.element.removeEventListener("DOMMouseScroll", mouse.mousewheel);
World.add(world, mouseConstraint);

Events.on(engine, 'afterUpdate', () => {
    physicsBodies.forEach((obj) => {
        const { x, y } = obj.body.position;
        const angle = obj.body.angle;
        obj.element.style.transform = `translate(${x - obj.element.offsetWidth/2}px, ${y - obj.element.offsetHeight/2}px) rotate(${angle}rad)`;
    });
});

Events.on(engine, 'collisionStart', (event) => {
    event.pairs.forEach((pair) => {
        physicsBodies.forEach((obj) => {
            if ((obj.body === pair.bodyA || obj.body === pair.bodyB) && obj.body.speed > 2) {
                obj.element.classList.add('glow-effect');
                setTimeout(() => obj.element.classList.remove('glow-effect'), 200);
            }
        });
    });
});

let engineStarted = false;
ScrollTrigger.create({
    trigger: ".physics-section",
    start: "top 20%",
    onEnter: () => {
        if (!engineStarted) {
            World.add(world, physicsBodies.map(obj => obj.body));
            Runner.run(Runner.create(), engine);
            engineStarted = true;
        }
    }
});

window.addEventListener('resize', () => {
    width = window.innerWidth; height = window.innerHeight * 1.2;
    Matter.Body.setPosition(floor, { x: width / 2, y: height + 50 });
    Matter.Body.setPosition(rightWall, { x: width + 50, y: height / 2 });
    const cvs = document.getElementById('particle-canvas');
    if(cvs) { cvs.width = window.innerWidth; cvs.height = window.innerHeight; }
});

const terminalInput = document.getElementById('terminal-input');
const portfolioOverride = document.getElementById('portfolio-override');
const closeOverrideBtn = document.getElementById('close-override');
let particlesInitialized = false;

terminalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const val = terminalInput.value.toLowerCase().trim();
        if (val === 'portfolio') {
            portfolioOverride.classList.remove('portfolio-override-hidden');
            setTimeout(() => {
                portfolioOverride.classList.add('active');
                document.body.style.overflow = 'hidden';
                if(!particlesInitialized) {
                    initOverrideParticles();
                    particlesInitialized = true;
                }
            }, 10);
        }
        terminalInput.value = '';
    }
});

closeOverrideBtn.addEventListener('click', () => {
    portfolioOverride.classList.remove('active');
    document.body.style.overflow = 'auto';
    setTimeout(() => {
        portfolioOverride.classList.add('portfolio-override-hidden');
    }, 500);
});

const overrideWords = ["Semiconductor Enthusiast.", "Hardware Builder.", "Creative Poet.", "Tech Innovator."];
let wordIndex = 0; let charIndex = 0; let isDeleting = false;
const typeTarget = document.getElementById('typewriter-text');

function typeOverride() {
    if(!typeTarget) return;
    const currentWord = overrideWords[wordIndex];
    if (isDeleting) {
        typeTarget.textContent = currentWord.substring(0, charIndex - 1);
        charIndex--;
    } else {
        typeTarget.textContent = currentWord.substring(0, charIndex + 1);
        charIndex++;
    }
    let typeSpeed = isDeleting ? 50 : 100;
    if (!isDeleting && charIndex === currentWord.length) {
        typeSpeed = 2000; isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false; wordIndex = (wordIndex + 1) % overrideWords.length; typeSpeed = 500;
    }
    setTimeout(typeOverride, typeSpeed);
}
typeOverride();

const observerOptions = { root: null, rootMargin: '0px', threshold: 0.2 };
const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible', 'show'); }
    });
}, observerOptions);

document.querySelectorAll('.port-fade-in-section, .port-timeline-item').forEach(el => {
    observer.observe(el);
});

document.getElementById('contact-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Message sent to Shubhankar successfully!');
});

function initOverrideParticles() {
    const canvas = document.getElementById('particle-canvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let particlesArray = [];
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 3 + 1;
            this.speedX = Math.random() * 1 - 0.5;
            this.speedY = Math.random() * 1 - 0.5;
            this.color = 'rgba(255, 255, 255, 0.2)';
        }
        update() {
            this.x += this.speedX; this.y += this.speedY;
            if (this.x > canvas.width || this.x < 0) this.speedX = -this.speedX;
            if (this.y > canvas.height || this.y < 0) this.speedY = -this.speedY;
        }
        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    for (let i = 0; i < 70; i++) { particlesArray.push(new Particle()); }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
            particlesArray[i].draw();
        }
        requestAnimationFrame(animateParticles);
    }
    animateParticles();
}