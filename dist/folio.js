/* Native scroll, a single frame scheduler, and no continuous render loop. */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const smallScreen = matchMedia('(max-width: 700px)');
const desk = $('.project-desk');
const control = $('#structure-control');
const dialog = $('#project-dialog');
const runway = $('.project-runway');
const identity = $('.identity-wrap');
const contact = $('.contact');
let activeProject = 'orbit';
let frame = 0;
let lastFocus;

const projects = {
  orbit: {
    title: 'Orbit',
    thought: 'A quieter place<br> to keep things<br> <em>moving.</em>',
    discipline: 'Product design<br>Frontend development',
    description: 'A workspace concept for independent makers. The important work gets the space; everything else steps back.',
    structure: 'One overview, three next moves. The layout makes hierarchy do the work: a quiet navigation rail, one clear headline, and a compact view of what comes next.',
    behaviour: 'A responsive dashboard study built with semantic HTML and CSS. The activity chart is illustrative sample data, not a claim about business performance.',
    exercise: 'Try the structure slider on the folio to peel back the visual layer.',
    next: 'forma'
  },
  forma: {
    title: 'Forma',
    thought: 'A little less.<br> A lot more<br> <em>character.</em>',
    discipline: 'Visual direction<br>Editorial commerce',
    description: 'An editorial commerce concept built around type, colour, and deliberate empty space. A study in making less feel complete.',
    structure: 'The oversized letter comes from the identity itself. It gives the collection a recognisable centre while the typography sets the pace.',
    behaviour: 'Three colour studies change the mood without changing the hierarchy. Try Clay, Olive, and Chalk below. This is an interface concept; no products are offered for sale.',
    exercise: 'Choose a colour to see how the same composition changes character.',
    next: 'pulse'
  },
  pulse: {
    title: 'Pulse',
    thought: 'Make room<br> for the next<br> <em>good idea.</em>',
    discipline: 'Interaction design<br>SaaS prototyping',
    description: 'A small productivity tool with one job: make the next move feel manageable. The interface gets quieter as the work gets done.',
    structure: 'A short list replaces a crowded board. Each task has room to breathe, and one shared progress line gives the whole sequence a beginning and an end.',
    behaviour: 'Check off the three sample tasks and watch the progress resolve. Controls work by touch or keyboard. Demo state stays in this page and resets on reload.',
    exercise: 'Finish the three tasks. Small actions, visible progress.',
    next: 'orbit'
  }
};

function setReveal(value) {
  const amount = Math.min(100, Math.max(0, Number(value)));
  desk.style.setProperty('--reveal', amount + '%');
  desk.style.setProperty('--split-visible', amount > 0 && amount < 100 ? '1' : '0');
  control.setAttribute('aria-valuetext', amount + '% structure revealed');
  // Keep covered controls out of the tab order while examining the structure.
  $$('.project-panel').forEach(panel => { panel.inert = amount > 0; });
}

function selectProject(key, focus = false) {
  if (!projects[key]) return;
  activeProject = key;
  desk.dataset.world = key;
  $$('.project-index button').forEach(button => {
    const selected = button.dataset.project === key;
    button.setAttribute('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
    if (selected && focus) button.focus({ preventScroll: true });
  });
  $$('.project-panel').forEach(panel => { panel.hidden = panel.id !== 'panel-' + key; });
  $('#project-thought').innerHTML = projects[key].thought;
  $('#project-discipline').innerHTML = projects[key].discipline;
  control.value = '0';
  setReveal(0);
}

$$('[data-project]').forEach(button => button.addEventListener('click', () => selectProject(button.dataset.project)));
$$('[data-select]').forEach(link => link.addEventListener('click', () => selectProject(link.dataset.select)));
$('.project-index').addEventListener('keydown', event => {
  const keys = Object.keys(projects);
  const current = keys.indexOf(activeProject);
  let next = current;
  if (event.key === 'ArrowRight') next = (current + 1) % keys.length;
  else if (event.key === 'ArrowLeft') next = (current + keys.length - 1) % keys.length;
  else if (event.key === 'Home') next = 0;
  else if (event.key === 'End') next = keys.length - 1;
  else return;
  event.preventDefault();
  selectProject(keys[next], true);
});
control.addEventListener('input', () => setReveal(control.value));
setReveal(0);

// Direct manipulation has the same native range input as a keyboard alternative.
const surface = $('.spread-surface');
let dragPointer = null;
surface.addEventListener('pointerdown', event => {
  if (event.target.closest('button,input,label,a')) return;
  dragPointer = event.pointerId;
  surface.setPointerCapture(event.pointerId);
  updateDrag(event);
});
function updateDrag(event) {
  if (dragPointer !== event.pointerId) return;
  const bounds = surface.getBoundingClientRect();
  control.value = Math.round((event.clientX - bounds.left) / bounds.width * 100);
  setReveal(control.value);
}
surface.addEventListener('pointermove', updateDrag);
surface.addEventListener('pointerup', () => { dragPointer = null; });
surface.addEventListener('pointercancel', () => { dragPointer = null; });

function updatePulse(root) {
  const complete = $$('input:checked', root).length;
  root.style.setProperty('--complete', complete / 3);
  $('.pulse-count', root).textContent = complete === 3
    ? '3 of 3 / Space for the next good idea.'
    : complete + ' of 3 / One thing at a time.';
}
document.addEventListener('change', event => {
  if (event.target.matches('.pulse-tasks input')) updatePulse(event.target.closest('.pulse-interface'));
});
document.addEventListener('click', event => {
  const swatch = event.target.closest('[data-tone]');
  if (!swatch) return;
  const root = swatch.closest('.forma-interface');
  const tones = { clay: '#c36c45', olive: '#a4a78c', chalk: '#e7dfd0' };
  root.style.setProperty('--tone', tones[swatch.dataset.tone]);
  $$('.swatch', root).forEach(button => button.setAttribute('aria-pressed', String(button === swatch)));
});

function openStudy(key) {
  const project = projects[key];
  dialog.dataset.world = key;
  $('#study-content').innerHTML =
    '<div class="study-heading"><h2 id="study-title">' + project.title + '.</h2><p>' + project.description + '</p></div>' +
    '<div class="study-demo"></div>' +
    '<div class="study-columns"><div><h3>S / The structure</h3><p>' + project.structure + '</p></div><div><h3>B / The behaviour</h3><p>' + project.behaviour + '</p></div></div>' +
    '<div class="study-end"><span>Independent concept / Design + development</span><button data-next="' + project.next + '">Next: ' + projects[project.next].title + ' ↗</button></div>';
  const demo = $('.project-interface', $('#panel-' + key)).cloneNode(true);
  $('.study-demo', dialog).append(demo);
  if (key === 'pulse') updatePulse(demo);
  if (!dialog.open) {
    lastFocus = document.activeElement;
    dialog.showModal();
    document.body.classList.add('study-open');
  }
  dialog.scrollTop = 0;
}
$('.open-study').addEventListener('click', () => openStudy(activeProject));
$('.close-study').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  const next = event.target.closest('[data-next]');
  if (next) { selectProject(next.dataset.next); openStudy(next.dataset.next); return; }
  if (event.target === dialog) {
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  }
});
dialog.addEventListener('close', () => {
  document.body.classList.remove('study-open');
  if (lastFocus?.isConnected) lastFocus.focus({ preventScroll: true });
});

$$('[data-brief]').forEach(button => button.addEventListener('click', () => {
  $$('[data-brief]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  const subject = "Let's talk: " + button.dataset.brief;
  const body = 'Hi Sounak,\n\nI have an idea for ' + button.dataset.brief.toLowerCase() + '.\n\nHere is what I have in mind:\n';
  $('#email-link').href = 'mailto:baniksounk54@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
}));

const clamp = value => Math.min(1, Math.max(0, value));
function updateScroll() {
  frame = 0;
  document.body.classList.toggle('past-opening', scrollY > 150);
  if (motion.matches || smallScreen.matches) {
    desk.style.setProperty('--fold', '0deg');
    desk.style.setProperty('--spread-scale', '1');
    contact.style.setProperty('--contact-fold', '0deg');
    return;
  }
  const bounds = runway.getBoundingClientRect();
  // A short, native sticky scene. No wheel interception or forced scroll position.
  const progress = clamp((innerHeight * .6 - bounds.top) / (innerHeight * .6));
  desk.style.setProperty('--fold', (-24 * (1 - progress)).toFixed(2) + 'deg');
  desk.style.setProperty('--spread-scale', (.91 + progress * .09).toFixed(4));
  const contactProgress = clamp((innerHeight - contact.getBoundingClientRect().top) / (innerHeight * .9));
  contact.style.setProperty('--contact-fold', (-18 * (1 - contactProgress)).toFixed(2) + 'deg');
}
function scheduleScroll() {
  if (!frame) frame = requestAnimationFrame(updateScroll);
}
addEventListener('scroll', scheduleScroll, { passive: true });
addEventListener('resize', scheduleScroll);
motion.addEventListener('change', scheduleScroll);
smallScreen.addEventListener('change', scheduleScroll);
addEventListener('pageshow', scheduleScroll);
updateScroll();

identity.addEventListener('pointermove', event => {
  if (motion.matches || smallScreen.matches || event.pointerType === 'touch') return;
  const bounds = identity.getBoundingClientRect();
  identity.style.setProperty('--tilt', ((event.clientX - bounds.left) / bounds.width - .5) * 6 + 'deg');
  identity.style.setProperty('--lift', ((event.clientY - bounds.top) / bounds.height - .5) * -4 + 'deg');
});
identity.addEventListener('pointerleave', () => {
  identity.style.setProperty('--tilt', '0deg');
  identity.style.setProperty('--lift', '0deg');
});
addEventListener('pagehide', () => { if (frame) cancelAnimationFrame(frame); frame = 0; });
