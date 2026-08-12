/* =========================================================================
   Приглашение на свидание

   ВСЁ, ЧТО НУЖНО МЕНЯТЬ, ЛЕЖИТ В ОБЪЕКТЕ CONTENT НИЖЕ.
   Остальной файл трогать не нужно.
   Строки, помеченные ЗАПОЛНИТЬ, обязательны к замене.
   ========================================================================= */

const CONTENT = {

  /* --- Фотографии ---------------------------------------------------
     Пустая строка означает «фото не нужно»: блок просто исчезнет,
     и экран останется чисто типографским. Если путь указан, но файла
     нет, появится заметная заглушка, чтобы ошибку в имени было видно. */
  coverPhoto: '',
  placePhoto: 'assets/img/place.webp',

  coverPlaceholder: 'Сюда фото для обложки',
  placePlaceholder: 'Сюда фото крыши: assets/img/place.webp',

  /* --- 1. Обложка --------------------------------------------------- */
  coverNote: 'Открой, это займёт минуту',

  /* --- 2. Обращение -------------------------------------------------
     Три строки читаются как одна фраза. Средняя подсвечена акцентом. */
  introLine1: 'Я приглашаю',
  introLine2: 'такую прекрасную тебя',
  introLine3: 'на свидание.',

  /* --- 3. Место ------------------------------------------------------ */
  placeTitle:   'Кино под открытым небом',
  filmTitle:    '«8 подруг Оушена»',
  venueName:    'Taganka Roof, крыша на четвёртом этаже',
  venueAddress: 'Большой Дровяной переулок, 6. Четыре минуты от метро Таганская, вход справа от «Сырного сомелье»',

  /* --- 4. Время ------------------------------------------------------ */
  dateLine: 'Воскресенье, 16 августа',
  time:     '20:30',
  timeNote: 'Начало сеанса. Но можно и чуть заранее, чтобы занять место получше.',

  /* --- 5. Вопрос ----------------------------------------------------- */
  askTitle: 'Идём?',

  /* --- 6. Финал после «Да» ------------------------------------------- */
  finalTitle: 'Значит, договорились',
  finalNote:  'Я очень рад. Напиши мне, и обсудим, во сколько встречаемся.',

  /* --- 6b. Экран после «Нет» ------------------------------------------ */
  noTitle: 'Понял тебя',
  noNote:  'Никакой обиды. Если передумаешь, ссылка никуда не денется.',

  /* --- Ссылки --------------------------------------------------------
     Пустое значение убирает соответствующую кнопку с финального экрана. */
  telegram: 'Alex_W_Mironov',
  mapUrl:   'https://yandex.ru/maps/?text=Большой%20Дровяной%20переулок%206%20Москва',

  /* Файл события для календаря. Лежит в корне рядом с index.html.
     Если правишь дату или время выше, поправь и event.ics. */
  calendarFile: 'event.ics',

  /* Сноска под кнопкой календаря. Встроенный браузер Telegram файлы
     событий системе не отдаёт, поэтому честно предупреждаем.
     Пустая строка убирает сноску. */
  calendarHint: 'Работает при открытии в браузере. Из Telegram нажми «...» вверху и выбери Safari.',

  /* --- Поведение кнопки «Нет» -----------------------------------------
     dodges: сколько раз «Нет» увернётся, прежде чем даст себя нажать.
     Поставь очень большое число (например 9999), если поймать её
     не должно получиться никогда. */
  dodges: 7,
};

/* =========================================================================
   Дальше механика. Менять не требуется.
   ========================================================================= */

(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer  = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const deck    = document.getElementById('deck');
  const screens = Array.from(deck.querySelectorAll('.screen'));
  const byName  = name => screens.find(s => s.dataset.screen === name);

  /* Экраны, которые участвуют в линейном проходе и в точках прогресса. */
  const FLOW = ['cover', 'intro', 'place', 'time', 'ask'];

  /* --- Подстановка текста ---------------------------------------------- */
  const fill = (slot, value) => {
    document.querySelectorAll(`[data-slot="${slot}"]`).forEach(el => {
      if (!value) {
        el.remove();
        return;
      }
      el.textContent = value;
    });
  };

  [
    'coverNote', 'introLine1', 'introLine2', 'introLine3',
    'placeTitle', 'filmTitle', 'venueName', 'venueAddress',
    'dateLine', 'time', 'timeNote', 'askTitle',
    'finalTitle', 'finalNote', 'noTitle', 'noNote', 'calendarHint',
  ].forEach(key => fill(key, CONTENT[key]));

  /* Сводка на финальном экране собирается из тех же данных. */
  fill('cardWhen',  [CONTENT.dateLine, CONTENT.time].filter(Boolean).join(', '));
  fill('cardWhat',  `${CONTENT.placeTitle}. ${CONTENT.filmTitle}`);
  fill('cardWhere', CONTENT.venueName);

  /* --- Ссылки ----------------------------------------------------------- */
  const writeMe = document.getElementById('writeMe');
  if (CONTENT.telegram) {
    writeMe.href = `https://t.me/${CONTENT.telegram.replace(/^@/, '')}`;
  } else {
    writeMe.remove();
  }

  const mapLink = document.getElementById('mapLink');
  if (CONTENT.mapUrl) {
    mapLink.href = CONTENT.mapUrl;
  } else {
    mapLink.remove();
  }

  /* Календарь. На айфоне переход по файлу .ics открывает системный лист
     «Добавить событие», ничего не скачивая. Атрибут download здесь не
     нужен и мешает: Safari тогда сохраняет файл вместо открытия. */
  const calLink = document.getElementById('calendar');
  if (CONTENT.calendarFile) {
    calLink.href = CONTENT.calendarFile;
  } else {
    calLink.remove();
    document.querySelector('[data-slot="calendarHint"]')?.remove();
  }

  /* --- Фотографии -------------------------------------------------------
     Путь не задан: блок убирается совсем, экран остаётся типографским.
     Путь задан, но файл не открылся: показываем заметную заглушку,
     чтобы опечатка в имени файла не осталась незамеченной. */
  const setupPhoto = (key, src, placeholder) => {
    const figure = document.querySelector(`[data-photo="${key}"]`);
    if (!figure) return;

    if (!src) {
      figure.remove();
      return;
    }

    const img = figure.querySelector('img');
    figure.dataset.placeholder = placeholder;

    img.addEventListener('load',  () => img.classList.add('is-loaded'));
    img.addEventListener('error', () => figure.classList.add('is-empty'));
    img.src = src;
  };

  setupPhoto('cover', CONTENT.coverPhoto, CONTENT.coverPlaceholder);
  setupPhoto('place', CONTENT.placePhoto, CONTENT.placePlaceholder);

  /* --- Переключение экранов --------------------------------------------- */
  const dots = document.getElementById('dots');
  let current = 'cover';

  FLOW.forEach((name, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', `Страница ${i + 1}`);
    b.addEventListener('click', () => show(name));
    dots.appendChild(b);
  });

  /* Шаг между элементами держим в районе 60 мс. Больше начинает читаться
     как медлительность, меньше сливается в одно движение. */
  function stagger(screen) {
    screen.querySelectorAll('[data-reveal]').forEach((el, i) => {
      el.style.setProperty('--delay', `${0.06 * i + 0.04}s`);
    });
  }

  function show(name) {
    const next = byName(name);
    if (!next || name === current) return;

    byName(current)?.classList.remove('is-active');
    current = name;

    /* Сброс, чтобы появление проигралось заново при возврате. */
    next.querySelectorAll('[data-reveal]').forEach(el => {
      el.style.transition = 'none';
      el.style.opacity = '';
      el.style.transform = '';
    });
    void next.offsetWidth;
    next.querySelectorAll('[data-reveal]').forEach(el => { el.style.transition = ''; });

    stagger(next);
    next.classList.add('is-active');
    next.scrollTop = 0;

    const index = FLOW.indexOf(name);
    dots.classList.toggle('is-hidden', index < 0 || name === 'ask');
    Array.from(dots.children).forEach((b, i) => {
      b.setAttribute('aria-current', String(i === index));
    });
  }

  deck.addEventListener('click', e => {
    const next = e.target.closest('[data-next]');
    if (next) {
      const i = FLOW.indexOf(current);
      if (i > -1 && i < FLOW.length - 1) show(FLOW[i + 1]);
      return;
    }

    const back = e.target.closest('[data-back-to]');
    if (back) show(back.dataset.backTo);
  });

  /* Стрелки на десктопе. */
  window.addEventListener('keydown', e => {
    const i = FLOW.indexOf(current);
    if (i < 0) return;
    if (e.key === 'ArrowRight' && i < FLOW.length - 1) show(FLOW[i + 1]);
    if (e.key === 'ArrowLeft'  && i > 0)               show(FLOW[i - 1]);
  });

  /* Обложка помечена активной прямо в разметке, чтобы страница была видна
     даже если скрипт не отработает. Из-за этого её содержимое отрисовалось
     бы сразу, без появления. Снимаем метку и возвращаем через два кадра,
     тогда переход проигрывается по-настоящему. */
  (() => {
    const cover = byName('cover');
    stagger(cover);
    cover.classList.remove('is-active');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => cover.classList.add('is-active'));
    });
  })();

  /* --- Кнопка «Нет» -----------------------------------------------------
     Работает и мышью, и пальцем. На тач-устройствах нет наведения,
     поэтому уворот вешается на pointerdown: он срабатывает раньше клика,
     мы его отменяем и уводим кнопку в сторону. */
  const choice = document.getElementById('choice');
  const yesBtn = document.getElementById('yes');
  const noBtn  = document.getElementById('no');

  let dodged = 0;
  let loose  = false;

  const caught = () => dodged >= CONTENT.dodges;

  function moveNo() {
    const box = choice.getBoundingClientRect();
    const btn = noBtn.getBoundingClientRect();

    if (!loose) {
      /* Фиксируем текущее место, чтобы первый прыжок не был рывком из угла. */
      noBtn.style.setProperty('--no-x', `${btn.left - box.left}px`);
      noBtn.style.setProperty('--no-y', `${btn.top - box.top}px`);
      noBtn.classList.add('is-loose');
      loose = true;
      void noBtn.offsetWidth;
    }

    const maxX = Math.max(0, box.width  - btn.width);
    const maxY = Math.max(0, box.height - btn.height);
    const curX = parseFloat(noBtn.style.getPropertyValue('--no-x')) || 0;
    const curY = parseFloat(noBtn.style.getPropertyValue('--no-y')) || 0;

    /* Новая точка должна быть заметно дальше прежней, иначе прыжок
       выглядит как дрожание на месте. */
    let x = 0, y = 0;
    for (let i = 0; i < 12; i++) {
      x = Math.random() * maxX;
      y = Math.random() * maxY;
      if (Math.hypot(x - curX, y - curY) > Math.min(maxX, 120)) break;
    }

    noBtn.style.setProperty('--no-x', `${x}px`);
    noBtn.style.setProperty('--no-y', `${y}px`);

    dodged++;

    /* «Да» набирает вес, «Нет» теряет. */
    yesBtn.style.setProperty('--yes-scale', String(Math.min(1 + dodged * 0.075, 1.5)));
    noBtn.style.setProperty('--no-scale',  String(Math.max(1 - dodged * 0.055, 0.62)));
    noBtn.style.opacity = String(Math.max(1 - dodged * 0.06, 0.5));

    if (caught()) {
      noBtn.style.opacity = '0.55';
    }
  }

  noBtn.addEventListener('pointerdown', e => {
    if (caught()) return;
    e.preventDefault();
    moveNo();
  });

  noBtn.addEventListener('click', e => {
    if (caught()) {
      show('soft-no');
      return;
    }
    e.preventDefault();
  });

  /* Мышь: убегает уже при приближении, не дожидаясь нажатия. */
  if (finePointer) {
    choice.addEventListener('pointermove', e => {
      if (caught()) return;
      const b = noBtn.getBoundingClientRect();
      const dx = e.clientX - (b.left + b.width  / 2);
      const dy = e.clientY - (b.top  + b.height / 2);
      if (Math.hypot(dx, dy) < b.width * 0.9) moveNo();
    });
  }

  /* --- «Да» -------------------------------------------------------------- */
  yesBtn.addEventListener('click', () => {
    show('final');
    celebrate();
  });

  /* --- Конфетти ---------------------------------------------------------
     Лёгкий канвас на три секунды. При включённом «уменьшить движение»
     не запускается вовсе. */
  function celebrate() {
    if (reduceMotion) return;

    const canvas = document.getElementById('confetti');
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      canvas.width  = window.innerWidth  * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    /* Оттенки подобраны под тёмный фон: на графите тёмные частицы пропадают. */
    const colors = ['#E07C5E', '#F2A184', '#EBCDB6', '#C9603F'];
    const parts = Array.from({ length: 90 }, () => ({
      x: window.innerWidth * (0.15 + Math.random() * 0.7),
      y: window.innerHeight * 0.42 + (Math.random() - 0.5) * 60,
      vx: (Math.random() - 0.5) * 9,
      vy: -6 - Math.random() * 8,
      size: 5 + Math.random() * 7,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.24,
      color: colors[(Math.random() * colors.length) | 0],
      heart: Math.random() < 0.28,
    }));

    canvas.classList.add('is-on');

    const start = performance.now();
    const DURATION = 3000;

    const frame = now => {
      const t = now - start;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      parts.forEach(p => {
        p.vy += 0.26;
        p.vx *= 0.995;
        p.x  += p.vx;
        p.y  += p.vy;
        p.rot += p.vr;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, 1 - t / DURATION);
        ctx.fillStyle = p.color;

        if (p.heart) {
          const s = p.size / 10;
          ctx.beginPath();
          ctx.moveTo(0, 3 * s);
          ctx.bezierCurveTo(-6 * s, -3 * s, -3 * s, -8 * s, 0, -4 * s);
          ctx.bezierCurveTo(3 * s, -8 * s, 6 * s, -3 * s, 0, 3 * s);
          ctx.fill();
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        }
        ctx.restore();
      });

      if (t < DURATION) {
        requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        canvas.classList.remove('is-on');
        window.removeEventListener('resize', resize);
      }
    };

    window.addEventListener('resize', resize);
    requestAnimationFrame(frame);
  }
})();
