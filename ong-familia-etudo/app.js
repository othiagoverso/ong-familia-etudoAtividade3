/* ONG A FAMÍLIA É TUDO — app.js (v2)
   SPA básica, templates, DOM, eventos, validação, LocalStorage
   Correções: roteamento mais robusto (#, âncoras internas e link 'index.html'),
   scroll para seções, reanexação segura dos handlers.
*/

(() => {
  'use strict';

  // ---------- Helpers ----------
  const qs  = (sel, el = document) => el.querySelector(sel);
  const qsa = (sel, el = document) => Array.from(el.querySelectorAll(sel));
  const on  = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);

  const main  = qs('#conteudo');
  const toast = qs('#toast');

  // Garante ocultos (caso CSS não tenha definido)
  if (toast) toast.style.display = 'none';
  const modalBackdrop = qs('#modal-backdrop');
  if (modalBackdrop) modalBackdrop.style.display = 'none';

  // Mantém a Home original como template
  const HOME_HTML = main ? main.innerHTML : '';

  // ---------- Templates ----------
  const templates = {
    home: () => HOME_HTML,
    servicos: () => `
      <section class="container services" id="servicos">
        <div class="grid-12">
          <div class="col-span-12">
            <h2>Serviços para a família</h2>
            <p class="lead max-w-prose">Conheça as principais frentes de apoio da ONG.</p>
          </div>

          <article class="card col-span-4" id="terapia">
            <div class="icon" aria-hidden="true">💞</div>
            <h3>Terapia de casal</h3>
            <p>Comunicação não violenta, acordos e reconstrução de confiança.</p>
            <div class="service-tags">
              <span class="tag info">casal</span>
              <span class="tag success">CNV</span>
              <span class="tag warn">mediação</span>
            </div>
          </article>

          <article class="card col-span-4" id="mediacao">
            <div class="icon" aria-hidden="true">🤝</div>
            <h3>Mediação de conflitos familiares</h3>
            <p>Escuta ativa e soluções conjuntas para relações mais leves.</p>
            <div class="service-tags">
              <span class="tag">família</span>
              <span class="tag info">orientação</span>
            </div>
          </article>

          <article class="card col-span-4" id="grupos">
            <div class="icon" aria-hidden="true">👥</div>
            <h3>Grupos de apoio</h3>
            <p>Encontros temáticos com mediação de profissionais.</p>
            <div class="service-tags">
              <span class="tag success">adolescentes</span>
              <span class="tag">pais</span>
              <span class="tag danger">prevenção</span>
            </div>
          </article>
        </div>

        <div class="cta-row">
          <button class="btn outline" id="btn-open-modal">Ver aviso</button>
          <a class="btn" href="#contato">Fale Conosco</a>
        </div>
      </section>
    `,
    contato: () => `
      <section class="quick-contact" id="contato">
        <form class="container qc-grid" id="form-rapido" novalidate>
          <h2 class="qc-title">Contato Rápido!</h2>
          <input class="input" type="text" name="nome" placeholder="Nome completo *" required minlength="3"/>
          <input class="input" type="tel" name="whats" placeholder="WhatsApp (11) 98888-7777 *" required pattern="\\(\\d{2}\\) \\d{4,5}-\\d{4}" />
          <button class="btn">Solicitar Contato</button>
          <p class="form-error" id="erro-form" style="display:none">Por favor, verifique os campos obrigatórios.</p>
        </form>
      </section>
    `
  };

  // ---------- Roteamento ----------
  const SECTION_IDS_HOME = ['terapia', 'mediação', 'mediacao', 'grupos', 'contato'];

  const normalizeRoute = (hash) => {
    const raw = (hash || '').replace('#', '').trim().toLowerCase();
    if (!raw || raw === 'home') return 'home';
    if (['servicos', 'serviços'].includes(raw)) return 'servicos';
    if (raw === 'contato' || raw === 'contact') return 'contato';
    // Se for uma âncora de seção da Home, tratamos como 'home' e scroll depois
    if (SECTION_IDS_HOME.includes(raw)) return raw; // devolve a âncora crua
    return 'home';
  };

  const render = (route) => {
    const key = normalizeRoute(route);

    if (SECTION_IDS_HOME.includes(key)) {
      // Precisamos da Home carregada para poder rolar até a seção
      main.innerHTML = templates.home();
      afterRender();
      // scroll suave para a seção (se existir id com acentos, tenta os dois)
      const target = qs(`#${key}`) || (key === 'mediacao' ? qs('#mediação') : null);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    const html = (templates[key] || templates.home)();
    main.innerHTML = html;
    afterRender();
  };

  const afterRender = () => {
    attachInteractiveBehaviors();
    attachFormValidation();
    greetReturningUser();
    markActiveLink();
  };

  const router = () => render(location.hash);

  // ---------- Nav ativa ----------
  const markActiveLink = () => {
    const current = normalizeRoute(location.hash);
    const links = qsa('nav.nav a, nav#mobile-drawer a, .hero a.btn, .cta-row a.btn');
    links.forEach(a => a.classList.remove('active'));
    links.forEach(a => {
      const href = a.getAttribute('href') || '';
      let route = '';
      if (href.startsWith('#')) route = normalizeRoute(href);
      else if (href.endsWith('index.html')) route = 'home';
      if (route === current || (SECTION_IDS_HOME.includes(current) && route === 'home')) {
        a.classList.add('active');
      }
    });
  };

  // ---------- Interceptação de links ----------
  const interceptLinks = () => {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (!a) return;

      const href = a.getAttribute('href') || '';

      // Roteamento SPA para hashes
      if (href.startsWith('#')) {
        e.preventDefault();
        if (location.hash !== href) location.hash = href;
        else router(); // força rerender ao clicar no mesmo link
        return;
      }

      // Tratar 'index.html' como #home (evita reload)
      if (href.endsWith('index.html')) {
        e.preventDefault();
        if (location.hash !== '#home') location.hash = '#home';
        else router();
      }
    });
  };

  // ---------- Menu móvel ----------
  const setupMobileMenu = () => {
    const btn = qs('#btn-hamburger');
    const drawer = qs('#mobile-drawer');
    if (!btn || !drawer) return;

    on(btn, 'click', () => {
      const open = drawer.classList.toggle('open');
      btn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    });

    on(drawer, 'click', (e) => {
      if (e.target.matches('a')) drawer.classList.remove('open');
    });
  };

  // ---------- Dropdown Serviços (desktop) ----------
  const setupDropdown = () => {
    const menu = qs('#menu-servicos');
    if (!menu) return;
    const btn = qs('button', menu);
    const panel = qs('.menu-panel', menu);

    const toggle = (force) => {
      const willOpen = force ?? !panel.classList.contains('open');
      panel.classList.toggle('open', !!willOpen);
      btn.setAttribute('aria-expanded', String(!!willOpen));
    };

    on(btn, 'click', () => toggle());

    on(document, 'click', (e) => {
      if (!menu.contains(e.target)) {
        panel.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  };

  // ---------- Modal + Toast ----------
  const showToast = (msg = 'Solicitação enviada com sucesso!') => {
    if (!toast) return;
    toast.textContent = msg;
    toast.style.display = 'block';
    setTimeout(() => (toast.style.display = 'none'), 3000);
  };

  const setupModal = () => {
    const backdrop = qs('#modal-backdrop');
    if (!backdrop) return;

    const openBtn  = qs('#btn-open-modal');
    const closeBtn = qs('#btn-close-modal');
    const okBtn    = qs('#btn-ok-modal');

    const open = () => {
      backdrop.setAttribute('aria-hidden', 'false');
      backdrop.style.display = 'block';
    };
    const close = () => {
      backdrop.setAttribute('aria-hidden', 'true');
      backdrop.style.display = 'none';
    };

    on(openBtn, 'click', open);
    on(closeBtn, 'click', close);
    on(okBtn, 'click', close);
    on(backdrop, 'click', (e) => {
      if (e.target === backdrop) close();
    });
  };

  // ---------- LocalStorage: saudação ----------
  const greetReturningUser = () => {
    const ultimo = localStorage.getItem('ultimoContato');
    const hero = qs('.hero-content');
    if (!hero || !ultimo) return;
    if (qs('.hero-greet', hero)) return;

    const saudacao = document.createElement('p');
    saudacao.className = 'hero-greet';
    saudacao.textContent = `Bem-vindo novamente, ${ultimo}!`;
    hero.appendChild(saudacao);
  };

  // ---------- Validação de Formulário ----------
  const phoneMask = (v) => {
    v = v.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length <= 10) {
      return v.replace(/^(\d{2})(\d)/, '($1) $2')
              .replace(/(\d{4})(\d)/, '$1-$2');
    } else {
      return v.replace(/^(\d{2})(\d)/, '($1) $2')
              .replace(/(\d{5})(\d)/, '$1-$2');
    }
  };

  const attachFormValidation = () => {
    const form = qs('#form-rapido');
    if (!form) return;

    const inputNome  = form.querySelector('input[name="nome"]');
    const inputWhats = form.querySelector('input[name="whats"]');
    let errorBox = qs('#erro-form', form) || qs('#erro-form');

    const setError = (msg) => {
      if (!errorBox) {
        errorBox = document.createElement('p');
        errorBox.className = 'form-error';
        errorBox.id = 'erro-form';
        form.appendChild(errorBox);
      }
      errorBox.textContent = msg;
      errorBox.style.display = 'block';
    };

    const clearError = () => {
      if (errorBox) errorBox.style.display = 'none';
    };

    on(inputWhats, 'input', () => {
      inputWhats.value = phoneMask(inputWhats.value);
    });

    const validate = () => {
      const nome  = (inputNome.value || '').trim();
      const whats = (inputWhats.value || '').trim();
      const padraoWhats = /^\(\d{2}\)\s?\d{4,5}-\d{4}$/;

      let errors = [];
      if (nome.length < 3) {
        errors.push('Nome deve ter pelo menos 3 caracteres.');
        inputNome.classList.add('invalid');
      } else {
        inputNome.classList.remove('invalid');
      }

      if (!padraoWhats.test(whats)) {
        errors.push('WhatsApp deve estar no formato (11) 98888-7777.');
        inputWhats.classList.add('invalid');
      } else {
        inputWhats.classList.remove('invalid');
      }

      if (errors.length) {
        setError(errors.join(' '));
        return false;
      }
      clearError();
      return true;
    };

    on(form, 'submit', (e) => {
      e.preventDefault();
      if (!validate()) return;
      const nome = inputNome.value.trim();
      localStorage.setItem('ultimoContato', nome);
      showToast('Solicitação enviada com sucesso!');
      form.reset();
      clearError();
    });

    on(inputNome, 'blur', validate);
    on(inputWhats, 'blur', validate);
  };

  // ---------- Interatividades ----------
  const attachInteractiveBehaviors = () => {
    setupModal();
    setupDropdown();
    setupMobileMenu();
  };

  // ---------- Init ----------
  const init = () => {
    interceptLinks();
    router();
    on(window, 'hashchange', () => router());
    greetReturningUser();
    markActiveLink();
  };

  on(document, 'DOMContentLoaded', init);
})();
