/**
 * ─────────────────────────────────────────────────────
 *  SLIDE PLAYER — player.js
 *  jQuery-powered full-screen presentation player.
 *
 *  HOW TO ADD SLIDES:
 *  Add new entries to the SLIDES array below in order.
 *  Files must exist in the slides/ folder.
 * ─────────────────────────────────────────────────────
 */

const SLIDES = [
  'slides/s01.html',
  'slides/s02.html',
  'slides/s03.html',
  'slides/s04.html',
  'slides/s05.html',
  'slides/s06.html',
  'slides/s07.html',
  'slides/s08.html',
  'slides/s09.html',
  'slides/s10.html',
];

$(function () {

  // ── State ─────────────────────────────────────────
  let current = 0;
  let total = SLIDES.length;
  let isFullscreen = false;
  let hideTimer = null;
  let controlsVisible = true;

  const $wrapper = $('#slides-wrapper');
  const $controls = $('#player-controls');
  const $counter = $('#slide-counter');
  const $dots = $('#progress-dots');
  const $btnPrev = $('#btn-prev');
  const $btnNext = $('#btn-next');
  const $btnFS = $('#btn-fullscreen');
  const $iconEnterFS = $('#icon-enter-fs');
  const $iconExitFS = $('#icon-exit-fs');

  // ── Build slides ──────────────────────────────────
  function buildSlides() {
    SLIDES.forEach(function (src, i) {
      const $frame = $('<iframe>', {
        src: src,
        class: 'slide-frame',
        id: 'slide-' + i,
        sandbox: 'allow-scripts allow-same-origin',
        scrolling: 'no',
        'aria-label': 'Slide ' + (i + 1),
      });
      $wrapper.append($frame);
    });

    // Activate first frame after a tick (allows layout)
    setTimeout(function () {
      $('#slide-0').addClass('active');
    }, 50);
  }

  // ── Build progress dots ────────────────────────────
  function buildDots() {
    $dots.empty();
    for (let i = 0; i < total; i++) {
      const $dot = $('<span>', { class: 'progress-dot', 'data-index': i });
      if (i === current) $dot.addClass('active');
      $dot.on('click', function () { goTo(Number($(this).data('index'))); });
      $dots.append($dot);
    }
  }

  // ── Navigate ──────────────────────────────────────
  function goTo(index) {
    if (index < 0 || index >= total) return;
    const prev = current;
    current = index;

    // Swap active slide via opacity
    $('#slide-' + prev).removeClass('active');
    setTimeout(function () {
      $('#slide-' + current).addClass('active');
    }, 50);

    updateUI();
  }

  function goNext() { goTo(current + 1); }
  function goPrev() { goTo(current - 1); }

  // ── Update UI ─────────────────────────────────────
  function updateUI() {
    // Counter
    $counter.text((current + 1) + ' / ' + total);

    // Dots
    $dots.children('.progress-dot').each(function () {
      const idx = Number($(this).data('index'));
      $(this).toggleClass('active', idx === current);
    });

    // Disable buttons at edges
    $btnPrev.prop('disabled', current === 0);
    $btnNext.prop('disabled', current === total - 1);
  }

  // ── Fullscreen ────────────────────────────────────
  function enterFullscreen() {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else if (el.mozRequestFullScreen) el.mozRequestFullScreen();
  }

  function exitFullscreen() {
    if (document.exitFullscreen) document.exitFullscreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
  }

  function toggleFullscreen() {
    if (!isFullscreen) enterFullscreen();
    else exitFullscreen();
  }

  $(document).on('fullscreenchange webkitfullscreenchange mozfullscreenchange', function () {
    isFullscreen = !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement
    );
    $iconEnterFS.toggle(!isFullscreen);
    $iconExitFS.toggle(isFullscreen);
  });

  // ── Controls auto-hide ────────────────────────────
  function showControls() {
    $controls.addClass('visible').removeClass('hidden');
    $('body').removeClass('hide-cursor');
    controlsVisible = true;
    resetHideTimer();
  }

  function hideControls() {
    $controls.addClass('hidden').removeClass('visible');
    $('body').addClass('hide-cursor');
    controlsVisible = false;
  }

  function resetHideTimer() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hideControls, 3000);
  }

  // Show on mouse move
  $(document).on('mousemove touchstart', function () {
    showControls();
  });

  // Keep visible when hovering controls
  $controls.on('mouseenter', function () {
    clearTimeout(hideTimer);
  }).on('mouseleave', function () {
    resetHideTimer();
  });

  // ── Keyboard events ───────────────────────────────
  $(document).on('keydown', function (e) {
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
      case ' ':
      case 'PageDown':
        e.preventDefault();
        goNext();
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
      case 'PageUp':
        e.preventDefault();
        goPrev();
        break;
      case 'f':
      case 'F':
        toggleFullscreen();
        break;
      case 'Escape':
        if (isFullscreen) exitFullscreen();
        break;
      case 'Home':
        goTo(0);
        break;
      case 'End':
        goTo(total - 1);
        break;
    }

    // Show controls on any key
    showControls();
  });

  // ── Button events ─────────────────────────────────
  $btnPrev.on('click', goPrev);
  $btnNext.on('click', goNext);
  $btnFS.on('click', toggleFullscreen);

  // ── Touch / swipe support ─────────────────────────
  let touchStartX = 0;
  $(document).on('touchstart', function (e) {
    touchStartX = e.originalEvent.changedTouches[0].clientX;
  });
  $(document).on('touchend', function (e) {
    const dx = e.originalEvent.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) {
      if (dx < 0) goNext();
      else goPrev();
    }
  });

  // ── 16:9 Viewport Scaling ─────────────────────────
  // Scales the fixed 1280×720 canvas to fit any screen,
  // centering it with letterboxing/pillarboxing as needed.
  const SLIDE_W = 1280;
  const SLIDE_H = 720;

  function scaleSlides() {
    const scaleX = window.innerWidth / SLIDE_W;
    const scaleY = window.innerHeight / SLIDE_H;
    const scale = Math.min(scaleX, scaleY);
    const offsetX = (window.innerWidth - SLIDE_W * scale) / 2;
    const offsetY = (window.innerHeight - SLIDE_H * scale) / 2;
    $wrapper.css(
      'transform',
      'translate(' + offsetX + 'px, ' + offsetY + 'px) scale(' + scale + ')'
    );
  }

  $(window).on('resize', scaleSlides);

  // ── Focus recapture ───────────────────────────────
  $(window).on('blur', function () {
    setTimeout(function () { window.focus(); }, 0);
  });
  $('#slide-viewport').on('click', function () { window.focus(); });

  // ── Init ──────────────────────────────────────────
  buildSlides();
  buildDots();
  updateUI();
  scaleSlides();
  showControls();
  window.focus();

});
