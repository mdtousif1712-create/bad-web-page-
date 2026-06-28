const FRAME_COUNT = 240;
const FRAME_PATH = (index) => `assets/frames/frame_${String(index).padStart(5, "0")}.jpg`;

document.body.classList.add("is-loading");

const canvas = document.getElementById("bagCanvas");
const context = canvas.getContext("2d");
const heroScroll = document.querySelector(".hero-scroll");
const heroVisual = document.querySelector("[data-parallax]");
const meter = document.querySelector(".hero__meter span");
const loaderBar = document.querySelector(".loader__track span");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector(".nav__toggle");
const images = Array.from({ length: FRAME_COUNT });
let loadedFrames = 0;
let currentFrame = 0;
let targetFrame = 0;
let hasFirstPaint = false;
let loaderDone = false;
let pointerX = window.innerWidth / 2;
let pointerY = window.innerHeight / 2;
let cursorX = pointerX;
let cursorY = pointerY;
let followerX = pointerX;
let followerY = pointerY;

function drawFrame(index) {
  const image = images[index];
  if (!image || !image.complete) return;

  const width = canvas.width;
  const height = canvas.height;
  const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  const x = (width - drawWidth) / 2;
  const y = (height - drawHeight) / 2;

  context.clearRect(0, 0, width, height);
  context.drawImage(image, x, y, drawWidth, drawHeight);
}

function markLoaded() {
  loadedFrames += 1;
  const progress = Math.min(100, Math.round((loadedFrames / FRAME_COUNT) * 100));
  loaderBar.style.width = `${progress}%`;

  if (!hasFirstPaint && images[0]?.complete) {
    hasFirstPaint = true;
    drawFrame(0);
  }

  if (!loaderDone && loadedFrames > 28) {
    loaderDone = true;
    window.setTimeout(() => {
      document.body.classList.remove("is-loading");
      document.body.classList.add("loaded");
    }, 520);
  }
}

function preloadFrames() {
  for (let index = 0; index < FRAME_COUNT; index += 1) {
    const image = new Image();
    image.decoding = "async";
    image.onload = markLoaded;
    image.onerror = markLoaded;
    image.src = FRAME_PATH(index);
    images[index] = image;
  }
}

function updateHeroFrame() {
  const rect = heroScroll.getBoundingClientRect();
  const scrollable = Math.max(1, heroScroll.offsetHeight - window.innerHeight);
  const progress = Math.min(1, Math.max(0, -rect.top / scrollable));
  targetFrame = Math.round(progress * (FRAME_COUNT - 1));
  meter.style.width = `${progress * 100}%`;
}

function animateCanvas() {
  currentFrame += (targetFrame - currentFrame) * 0.22;
  const frame = Math.round(currentFrame);
  drawFrame(frame);
  requestAnimationFrame(animateCanvas);
}

function updateNav() {
  nav.classList.toggle("is-small", window.scrollY > 70);
}

function revealOnScroll() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14, rootMargin: "0px 0px -8% 0px" }
  );

  document.querySelectorAll(".reveal").forEach((element, index) => {
    element.style.transitionDelay = `${Math.min(index % 6, 5) * 70}ms`;
    observer.observe(element);
  });
}

function animateCounters() {
  const counters = document.querySelectorAll("[data-count]");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const counter = entry.target;
        const end = Number(counter.dataset.count);
        const suffix = counter.nextElementSibling?.textContent?.startsWith("K") ? "K+" : "+";
        const startTime = performance.now();

        function tick(now) {
          const progress = Math.min(1, (now - startTime) / 1200);
          const eased = 1 - Math.pow(1 - progress, 3);
          counter.textContent = `${Math.round(end * eased)}${suffix}`;
          if (progress < 1) requestAnimationFrame(tick);
        }

        requestAnimationFrame(tick);
        observer.unobserve(counter);
      });
    },
    { threshold: 0.45 }
  );

  counters.forEach((counter) => observer.observe(counter));
}

function setupCursor() {
  const cursor = document.querySelector(".cursor");
  const follower = document.querySelector(".cursor-follower");
  if (!cursor || !follower || window.matchMedia("(max-width: 980px)").matches) return;

  window.addEventListener("pointermove", (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY;

    const active = event.target.closest("a, button, input, textarea, select, summary, .tilt");
    document.body.classList.toggle("cursor-active", Boolean(active));
  });

  function renderCursor() {
    cursorX += (pointerX - cursorX) * 0.42;
    cursorY += (pointerY - cursorY) * 0.42;
    followerX += (pointerX - followerX) * 0.14;
    followerY += (pointerY - followerY) * 0.14;
    cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
    follower.style.transform = `translate3d(${followerX}px, ${followerY}px, 0)`;
    requestAnimationFrame(renderCursor);
  }

  renderCursor();
}

function setupMagneticButtons() {
  document.querySelectorAll(".magnetic").forEach((element) => {
    element.addEventListener("pointermove", (event) => {
      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      element.style.transform = `translate(${x * 0.14}px, ${y * 0.22}px)`;
    });

    element.addEventListener("pointerleave", () => {
      element.style.transform = "";
    });
  });
}

function setupTilt() {
  document.querySelectorAll(".tilt").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(900px) rotateX(${y * -7}deg) rotateY(${x * 7}deg) translateY(-4px)`;
    });

    card.addEventListener("pointerleave", () => {
      card.style.transform = "";
    });
  });
}

function setupParallax() {
  if (!heroVisual) return;

  window.addEventListener("pointermove", (event) => {
    const x = (event.clientX / window.innerWidth - 0.5) * 24;
    const y = (event.clientY / window.innerHeight - 0.5) * 18;
    heroVisual.style.setProperty("--mx", `${x}px`);
    heroVisual.style.setProperty("--my", `${y}px`);
    heroVisual.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  });
}

function setupNav() {
  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  document.querySelectorAll(".nav__links a, .nav__cta").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

function setupContactForm() {
  const form = document.querySelector(".contact__form");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const button = form.querySelector("button");
    const oldText = button.textContent;
    button.textContent = "Request Sent";
    window.setTimeout(() => {
      button.textContent = oldText;
      form.reset();
    }, 1600);
  });
}

preloadFrames();
animateCanvas();
revealOnScroll();
animateCounters();
setupCursor();
setupMagneticButtons();
setupTilt();
setupParallax();
setupNav();
setupContactForm();
updateHeroFrame();
updateNav();

window.addEventListener("scroll", () => {
  updateHeroFrame();
  updateNav();
});

window.addEventListener("resize", updateHeroFrame);
window.addEventListener("load", () => {
  if (!loaderDone) {
    loaderDone = true;
    document.body.classList.remove("is-loading");
    document.body.classList.add("loaded");
  }
});
