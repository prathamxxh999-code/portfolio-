import { mountHeroMotion } from './hero-motion.js';

const clamp = value => Math.min(1, Math.max(0, value));
const ease = value => value * value * (3 - 2 * value);

function startCinema() {
  const hero = document.querySelector('.hero');
  const home = document.querySelector('#home');
  const progress = document.querySelector('.page-progress');
  const film = document.querySelector('.design-film');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const pinQuery = matchMedia('(min-height: 360px) and (prefers-reduced-motion: no-preference)');
  const curveQuery = matchMedia('(min-width: 651px)');
  const work = document.querySelector('#work');
  const deck = work.querySelector('.work-deck');
  const view = work.querySelector('.work-window');
  const track = work.querySelector('.work-track');
  const cards = [...track.querySelectorAll('.card')];
  const covers = cards.map(card => card.querySelector('.project-poster img'));
  const controls = work.querySelector('.work-controls');
  const previous = controls.querySelector('[data-step="-1"]');
  const next = controls.querySelector('[data-step="1"]');
  const counter = controls.querySelector('.work-position');
  const foot = work.querySelector('.work-foot');
  const instruction = work.querySelector('.work-instruction');
  const timeline = document.querySelector('#experience .tl');
  const currentFormat = new Intl.NumberFormat('en', { minimumIntegerDigits: 2 });
  mountHeroMotion(hero, motion);

  let layoutNeeded = true;
  let animation = 0;
  let pin = false;
  let maxX = 0;
  let travel = 0;
  let windowWidth = 0;
  let stops = [];
  let active = -1;
  let filmTop = 0;
  let workTop = 0;
  let travelFromControl = null;
  let previousY = -1;
  let touch = null;
  let settleTouch = false;
  let settleTimer = 0;
  let viewportWidth = innerWidth;
  let viewportHeight = document.documentElement.clientHeight;
  let pageTravel = 0;
  let careerTop = 0;
  let careerHeight = 1;
  let resizedProject = null;

  function requestDraw() {
    if (!animation && !document.hidden) animation = requestAnimationFrame(render);
  }

  function requestLayout() {
    layoutNeeded = true;
    requestDraw();
  }

  function measure() {
    layoutNeeded = false;
    previousY = -1;
    if (home.hidden) return;
    home.classList.toggle('motion-enabled', !motion.matches);
    filmTop = film.getBoundingClientRect().top + scrollY;

    pin = pinQuery.matches && cards.length > 1;
    work.classList.toggle('work-pinned', pin);
    if (pin && deck.scrollHeight > document.documentElement.clientHeight + 2) {
      pin = false;
      work.classList.remove('work-pinned');
    }
    controls.hidden = !pin;
    foot.hidden = !pin;
    instruction.hidden = !pin;
    travelFromControl = null;
    settleTouch = false;
    clearTimeout(settleTimer);
    delete work.dataset.frame;
    const career = timeline.getBoundingClientRect();
    careerTop = career.top + scrollY;
    careerHeight = Math.max(1, career.height);
    if (!pin) {
      cards[active]?.removeAttribute('aria-current');
      active = -1;
      stops = [];
      resizedProject = null;
      pageTravel = document.documentElement.scrollHeight - innerHeight;
      return;
    }
    windowWidth = view.clientWidth;
    view.style.setProperty('--window-width', `${windowWidth}px`);
    maxX = Math.max(0, track.scrollWidth - windowWidth);
    travel = Math.min(maxX * .53, (cards.length - 1) * Math.min(296, deck.clientHeight * .45));
    work.style.setProperty('--work-travel', `${travel}px`);
    stops = cards.map(card => Math.min(maxX, Math.max(0, card.offsetLeft + (card.offsetWidth - windowWidth) / 2)));
    workTop = work.getBoundingClientRect().top + scrollY + work.clientTop;
    if (resizedProject !== null && maxX > 0) {
      window.scrollTo({ top: workTop + stops[resizedProject] / maxX * travel, behavior: 'instant' });
      resizedProject = null;
    }
    careerTop = timeline.getBoundingClientRect().top + scrollY;
    pageTravel = document.documentElement.scrollHeight - innerHeight;
    instruction.textContent = 'Scroll to move through projects';
  }

  function updateWork(scroll) {
    if (!stops.length) return;
    const amount = clamp((scroll - workTop) / Math.max(1, travel));
    const offset = amount * maxX;
    const frameKey = offset.toFixed(2);
    if (work.dataset.frame === frameKey) return;
    work.dataset.frame = frameKey;
    track.style.setProperty('--work-offset', `${-offset}px`);
    deck.style.setProperty('--work-progress', amount);
    let nearest = 0;
    for (let index = 0; index < stops.length; index++) {
      if (Math.abs(stops[index] - offset) < Math.abs(stops[nearest] - offset)) nearest = index;
      const relative = (stops[index] - offset) / Math.max(1, windowWidth * .8);
      const card = cards[index];
      const shouldCurve = curveQuery.matches && Math.abs(relative) >= .04 && Math.abs(relative) < 1.4;
      if (card.hasAttribute('data-curved') !== shouldCurve) card.toggleAttribute('data-curved', shouldCurve);
      if (shouldCurve && card.hasAttribute('data-curve-right') !== (relative < 0)) card.toggleAttribute('data-curve-right', relative < 0);
      const distance = clamp(Math.abs(relative)).toFixed(3);
      if (card.style.getPropertyValue('--shot-distance') === distance && distance === '1.000') continue;
      card.style.setProperty('--shot-distance', distance);
      card.style.setProperty('--shot-turn', `${Math.max(-1, Math.min(relative, 1)) * -9}deg`);
    }
    if (travelFromControl !== null && Math.abs(stops[travelFromControl] - offset) < 3) travelFromControl = null;
    if (nearest === active) return;
    cards[active]?.removeAttribute('aria-current');
    active = nearest;
    cards[active].setAttribute('aria-current', 'true');
    for (const cover of covers.slice(Math.max(0, active - 1), active + 3)) {
      if (cover?.loading === 'lazy') cover.loading = 'eager';
    }
    counter.textContent = `${currentFormat.format(active + 1)} / ${cards.length}`;
    previous.disabled = active === 0;
    next.disabled = active === cards.length - 1;
  }

  function goToProject(index, behavior) {
    if (!maxX || index < 0 || index >= stops.length) return;
    travelFromControl = index;
    window.scrollTo({ top: workTop + stops[index] / maxX * travel, behavior });
    requestDraw();
  }

  function render(now) {
    animation = 0;
    if (layoutNeeded) measure();
    const y = scrollY;
    const changed = y !== previousY;
    if (changed) {
      previousY = y;
      progress.style.setProperty('--reading-progress', pageTravel > 0 ? clamp(y / pageTravel) : 0);
    }
    if (home.hidden) return;
    updateWork(y);
    if (changed) {
      const reveal = ease(clamp((y - filmTop + innerHeight * .77) / Math.max(1, innerHeight * .42)));
      film.style.setProperty('--film-rise', `${(1 - reveal) * 30}px`);
      film.style.setProperty('--film-light-x', `${-20 + reveal * 47}%`);
      film.style.setProperty('--film-copy-opacity', .46 + reveal * .54);
      const exit = ease(clamp(y / Math.max(1, filmTop)));
      hero.style.setProperty('--portrait-y', `${motion.matches ? 0 : exit * 40}px`);
      hero.style.setProperty('--hero-motion-exit', motion.matches ? 0 : exit);
      const filled = motion.matches ? 1 : clamp((innerHeight * .61 + y - careerTop) / careerHeight);
      timeline.style.setProperty('--experience-progress', filled.toFixed(3));
    }
  }

  for (const button of [previous, next]) {
    button.addEventListener('click', () => goToProject(
      (travelFromControl ?? active) + Number(button.dataset.step), motion.matches ? 'instant' : 'smooth'
    ));
  }
  view.addEventListener('pointerdown', event => {
    if (!pin || event.pointerType !== 'touch' || !event.isPrimary) return;
    touch = { id: event.pointerId, x: event.clientX, y: event.clientY, scroll: scrollY, dragging: false };
    clearTimeout(settleTimer);
    settleTouch = true;
  });
  view.addEventListener('pointermove', event => {
    if (!touch || touch.id !== event.pointerId) return;
    const x = event.clientX - touch.x;
    const y = event.clientY - touch.y;
    if (!touch.dragging) {
      if (Math.hypot(x, y) < 10) return;
      if (Math.abs(y) >= Math.abs(x)) {
        touch = null;
        return;
      }
      view.setPointerCapture(event.pointerId);
      touch.dragging = true;
    }
    window.scrollTo({ top: Math.min(workTop + travel, Math.max(workTop, touch.scroll - x * .8)), behavior: 'instant' });
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    view.addEventListener(type, event => { if (touch?.id === event.pointerId) touch = null; });
  }
  view.addEventListener('focusin', event => {
    const card = event.target.closest('.card');
    if (pin && card?.matches(':focus-visible') && cards.indexOf(card) !== active) {
      goToProject(cards.indexOf(card), 'instant');
    }
  });
  function settleProjects() {
    if (!settleTouch || touch || home.hidden || scrollY <= workTop + 2) return;
    settleTouch = false;
    if (scrollY >= workTop + travel || active < 0) return;
    goToProject(active, 'smooth');
  }
  window.addEventListener('scroll', () => {
    requestDraw();
    if (!('onscrollend' in window) && settleTouch) {
      clearTimeout(settleTimer);
      settleTimer = setTimeout(settleProjects, 160);
    }
  }, { passive: true });
  window.addEventListener('scrollend', settleProjects);
  window.addEventListener('wheel', () => { travelFromControl = null; settleTouch = false; }, { passive: true });
  window.addEventListener('resize', () => {
    const width = innerWidth;
    const height = document.documentElement.clientHeight;
    const changed = width !== viewportWidth || (!matchMedia('(pointer: coarse)').matches && height !== viewportHeight);
    if (width !== viewportWidth && pin && active >= 0 && scrollY >= workTop && scrollY <= workTop + travel) resizedProject = active;
    viewportWidth = width;
    viewportHeight = height;
    if (changed) requestLayout();
  }, { passive: true });
  window.addEventListener('hashchange', requestLayout);
  motion.addEventListener('change', requestLayout);
  pinQuery.addEventListener('change', requestLayout);
  curveQuery.addEventListener('change', requestLayout);
  document.addEventListener('visibilitychange', requestDraw);
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(requestLayout);
    observer.observe(hero);
    observer.observe(timeline);
    observer.observe(track);
  }
  document.fonts?.ready.then(requestLayout);
  requestLayout();
}

document.addEventListener('DOMContentLoaded', startCinema, { once: true });
