// Menú móvil accesible
const menuToggle = document.getElementById('menuToggle');
const primaryNav = document.getElementById('primaryNav');
const menuClose = document.getElementById('menuClose');

function closeMobileNav() {
  primaryNav.classList.remove('open');
  menuToggle.setAttribute('aria-expanded', 'false');
}

if (menuToggle && primaryNav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = primaryNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });

  // Cerrar con el botón X
  if (menuClose) {
    menuClose.addEventListener('click', closeMobileNav);
  }

  // Cerrar menú móvil al hacer clic en un enlace
  primaryNav.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', closeMobileNav);
  });
}

// Año actual en el footer
const currentYearEl = document.getElementById('currentYear');
if (currentYearEl) {
  currentYearEl.textContent = String(new Date().getFullYear());
}

// Validación de formulario de contacto
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  const formFeedback = document.getElementById('formFeedback');
  const fields = {
    nombre: contactForm.querySelector('#nombre'),
    email: contactForm.querySelector('#email'),
    telefono: contactForm.querySelector('#telefono'),
    mensaje: contactForm.querySelector('#mensaje'),
  };

  const setFeedback = (message, type = '') => {
    if (!formFeedback) return;
    formFeedback.textContent = message;
    formFeedback.className = type ? `form-feedback ${type}` : 'form-feedback';
  };

  const setFieldError = (input, message) => {
    if (!input) return;
    const field = input.closest('.field');
    if (!field) return;
    let error = field.querySelector('.field-error');
    if (message) {
      if (!error) {
        error = document.createElement('p');
        error.className = 'field-error';
        field.appendChild(error);
      }
      error.textContent = message;
      input.setAttribute('aria-invalid', 'true');
    } else {
      if (error) error.remove();
      input.removeAttribute('aria-invalid');
    }
  };

  const validators = {
    nombre: (value) => (value ? '' : 'Ingresá tu nombre completo.'),
    email: (value) => {
      if (!value) return 'Ingresá tu correo.';
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailPattern.test(value) ? '' : 'Usá un formato de correo válido.';
    },
    telefono: (value) => {
      if (!value) return 'Ingresá un teléfono de contacto.';
      const digits = value.replace(/\D/g, '');
      return digits.length >= 8 ? '' : 'El teléfono debe tener al menos 8 dígitos.';
    },
    mensaje: (value) => (value ? '' : 'El mensaje no puede estar vacío.'),
  };

  Object.values(fields).forEach((input) => {
    if (!input) return;
    input.addEventListener('input', () => {
      const name = input.getAttribute('name');
      const value = input.value.trim();
      const error = validators[name]?.(value) || '';
      setFieldError(input, error);
      setFeedback('', '');
    });
  });

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    let isValid = true;

    Object.entries(fields).forEach(([name, input]) => {
      if (!input) return;
      const value = input.value.trim();
      const error = validators[name]?.(value) || '';
      setFieldError(input, error);
      if (error) isValid = false;
    });

    if (!isValid) {
      setFeedback('Revisá los campos marcados antes de enviar.', 'error');
      return;
    }

    // Deshabilitar el botón mientras se envía
    const submitButton = contactForm.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Enviando...';
    setFeedback('Enviando tu consulta...', '');

    // Verificar que EmailJS esté cargado
    if (typeof emailjs === 'undefined') {
      setFeedback('Error: EmailJS no está cargado. Por favor, recargá la página.', 'error');
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
      return;
    }

    try {
      // Preparar los parámetros del email
      const templateParams = {
        from_name: fields.nombre.value.trim(),
        from_email: fields.email.value.trim(),
        telefono: fields.telefono.value.trim(),
        message: fields.mensaje.value.trim(),
        to_email: 'albert.garin1@gmail.com' // Email de destino
      };

      // Enviar el email usando EmailJS
      const response = await emailjs.send('service_nfkeeje', 'template_t9c9w9n', templateParams);
      
      console.log('Email enviado exitosamente:', response);
      setFeedback('¡Gracias! Recibimos tu consulta. Nos contactaremos pronto.', 'success');
      contactForm.reset();
      Object.values(fields).forEach((input) => setFieldError(input, ''));
    } catch (error) {
      console.error('Error al enviar el formulario:', error);
      let errorMessage = 'Hubo un error al enviar tu consulta. ';
      
      if (error.text) {
        errorMessage += `Error: ${error.text}`;
      } else if (error.message) {
        errorMessage += `Error: ${error.message}`;
      } else {
        errorMessage += 'Por favor, intentá nuevamente o contactanos directamente por teléfono.';
      }
      
      setFeedback(errorMessage, 'error');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  });
}

// Galería: Lightbox por grupo (tiras independientes)
const lightbox = document.getElementById('lightbox');
if (lightbox) {
  const img = lightbox.querySelector('.lightbox-image');
  const caption = lightbox.querySelector('.lightbox-caption');
  const btnClose = lightbox.querySelector('.lightbox-close');
  const btnPrev = lightbox.querySelector('.lightbox-prev');
  const btnNext = lightbox.querySelector('.lightbox-next');
  let currentGroup = [];
  let currentIndex = 0;
  let lastFocus = null;

  function show(index) {
    if (!currentGroup.length) return;
    if (index < 0) index = currentGroup.length - 1;
    if (index >= currentGroup.length) index = 0;
    currentIndex = index;
    const link = currentGroup[currentIndex];
    const imgEl = link.querySelector('img');
    const largeSrc = link.getAttribute('href');
    const text = link.dataset.caption || (imgEl ? imgEl.alt : '');
    img.setAttribute('src', largeSrc);
    img.setAttribute('alt', text);
    caption.textContent = text;
  }

  function openFromLink(link) {
    const strip = link.closest('.gallery-strip');
    if (!strip) return;
    currentGroup = Array.from(strip.querySelectorAll('a'));
    currentIndex = currentGroup.indexOf(link);
    lastFocus = document.activeElement;
    document.body.style.overflow = 'hidden';
    lightbox.classList.add('open');
    // Eliminar aria-hidden es redundante con display:none, pero aseguramos
    lightbox.removeAttribute('aria-hidden'); 
    show(currentIndex);
    // Pequeño delay para asegurar que el navegador procese la visibilidad antes del foco
    setTimeout(() => {
      btnClose.focus();
    }, 10);
    document.addEventListener('keydown', onKeyDown);
  }

  function close() {
    document.body.style.overflow = '';
    lightbox.classList.remove('open');
    // Al cerrar, display:none ya lo oculta del accessibility tree
    document.removeEventListener('keydown', onKeyDown);
    if (lastFocus) lastFocus.focus();
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') show(currentIndex + 1);
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') show(currentIndex - 1);
  }

  document.querySelectorAll('.gallery-strip a').forEach((link) => {
    link.addEventListener('click', (ev) => {
      ev.preventDefault();
      openFromLink(link);
    });
  });

  btnClose.addEventListener('click', close);
  btnNext.addEventListener('click', () => show(currentIndex + 1));
  btnPrev.addEventListener('click', () => show(currentIndex - 1));
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) close();
  });
}

// Arrastre con puntero para tiras de galería (desktop y touch)
document.querySelectorAll('.gallery-strip').forEach((strip) => {
  let isDown = false;
  let startX = 0;
  let scrollLeft = 0;

  const start = (x) => { isDown = true; startX = x - strip.offsetLeft; scrollLeft = strip.scrollLeft; strip.classList.add('dragging'); };
  const move = (x) => { if (!isDown) return; const walk = (x - strip.offsetLeft - startX); strip.scrollLeft = scrollLeft - walk; };
  const end = () => { isDown = false; strip.classList.remove('dragging'); };

  strip.addEventListener('mousedown', (e) => { start(e.pageX); e.preventDefault(); });
  strip.addEventListener('mousemove', (e) => { move(e.pageX); });
  strip.addEventListener('mouseleave', end);
  strip.addEventListener('mouseup', end);

  strip.addEventListener('touchstart', (e) => { const t = e.touches[0]; start(t.pageX); }, { passive: true });
  strip.addEventListener('touchmove', (e) => { const t = e.touches[0]; move(t.pageX); }, { passive: true });
  strip.addEventListener('touchend', end);
});


// Parallax suave para el héroe
(() => {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const ease = 0.08;
  let target = 0;
  let current = 0;

  const onScroll = () => {
    const rect = hero.getBoundingClientRect();
    const viewportH = window.innerHeight || document.documentElement.clientHeight;
    // Solo aplicar cuando el héroe está en pantalla
    if (rect.bottom < 0 || rect.top > viewportH) return;
    // Parallax proporcional al scroll dentro del héroe
    const progress = Math.min(1, Math.max(0, (viewportH - rect.top) / (viewportH + rect.height)));
    target = (progress * 30) - 15; // rango ~[-15px, 15px]
  };

  const raf = () => {
    current += (target - current) * ease;
    hero.style.setProperty('--hero-y', current.toFixed(2) + 'px');
    requestAnimationFrame(raf);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
  raf();
})();


