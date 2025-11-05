/* ONG A FAMÍLIA É TUDO — app.js
   Terceira entrega: JS avançado (SPA básica, templates, DOM, eventos, validação, LocalStorage)
   Autor: Thiago + ChatGPT
*/

(() => {
  'use strict';

  // ---------- Helpers ----------
  const qs  = (sel, el = document) => el.querySelector(sel);
  const qsa = (sel, el = document) => Array.from(el.querySelectorAll(sel));
  const on  = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);

  const main = qs('#conteudo');
  const toast = qs('#toast');

  // Persist original "Home" as template base
  const HOME_HTML = main.innerHTML;

  // ---------- Templates (SPA) ----------
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

  // ---------- Router (hash-based SPA) ----------
  const normalizeRoute = (hash) => {
    const clean = (hash || '').replace('#', '').trim().toLowerCase();
    if (!clean || clean === '' || clean === 'home') return 'home';
    if (['servicos', 'serviços'].includes(clean)) return 'servicos';
    if (['contato', 'contact'].includes(clean)) return 'contato';
    // Fallback: mantém home e, se existir anchor no home, faz scroll após render
    return 'home';
  };

  const render = (route) => {
    const key = normalizeRoute(route);
    const html = (templates[key] || templates.home)();
    main.innerHTML = html;

    // Após cada render, re-anexa os comportamentos necessários
    attachInteractiveBehaviors();
    attachFormValidation();
    greetReturningUser();
  };

  const router = () => render(location.hash);

  // ---------- Nav (desktop + mobile) ----------
  const markActiveLink = () => {
    const current = normalizeRoute(location.hash);
    const allLinks = qsa('nav.nav a, nav#mobile-drawer a');
    allLinks.forEach(a => a.classList.remove('active'));
    allLinks.forEach(a => {
      const href = a.getAttribute('href') || '';
      const route = normalizeRoute(href.startsWith('#') ? href : '');
      if (route === current) a.classList.add('active');
    });
  };

  const interceptInternalLinks = () => {
    // Intercepta links que começam com "#"
    const linkSelector = 'a[href^="#"]';
    document.addEventListener('click', (e) => {
      const a = e.target.closest(linkSelector);
      if (!a) return;

      const hash = a.getAttribute('href');
      e.preventDefault();
      if (location.hash !== hash) {
        location.hash = hash;
      } else {
        // Força rerender se clicar no mesmo link
        router();
      }
    });
  };

  // ---------- Hamburger + Mobile Drawer ----------
  const setupMobileMenu = () => {
    const btn = qs('#btn-hamburger');
    const drawer = qs('#mobile-drawer');
    if (!btn || !drawer) return;

    on(btn, 'click', () => {
      const open = drawer.classList.toggle('open');
      btn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    });

    // Fechar ao clicar num link
    on(drawer, 'click', (e) => {
      if (e.target.matches('a')) {
        drawer.classList.remove('open');
      }
    });
  };

  // ---------- Dropdown Serviços (desktop) ----------
  const setupDropdown = () => {
    const menu = qs('#menu-servicos');
    if (!menu) return;

    const btn = qs('button', menu);
    const panel = qs('.menu-panel', menu);

    const toggle = (force) => {
      const willOpen = force ?? panel.hidden ?? !panel.classList.contains('open');
      panel.classList.toggle('open', !!willOpen);
      btn.setAttribute('aria-expanded', String(!!willOpen));
    };

    on(btn, 'click', () => toggle());

    // Fecha ao clicar fora
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

    // Evita saudação duplicada
    if (qs('.hero-greet', hero)) return;

    const saudacao = document.createElement('p');
    saudacao.className = 'hero-greet';
    saudacao.textContent = `Bem-vindo novamente, ${ultimo}!`;
    hero.appendChild(saudacao);
  };

  // ---------- Validação de Formulário ----------
  const phoneMask = (v) => {
    // mantém apenas dígitos
    v = v.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length <= 10) {
      // (xx) xxxx-xxxx
      return v
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    } else {
      // (xx) xxxxx-xxxx
      return v
        .replace(/^(\d{2})(\d)/, '($1) $2')
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

    // Máscara dinâmica no WhatsApp
    on(inputWhats, 'input', () => {
      inputWhats.value = phoneMask(inputWhats.value);
    });

    // Validação on-the-fly
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

      // Simula envio
      showToast('Solicitação enviada com sucesso!');
      form.reset();
      clearError();
    });

    // Valida ao sair do campo
    on(inputNome, 'blur', validate);
    on(inputWhats, 'blur', validate);
  };

  // ---------- Interatividades que dependem do DOM atual ----------
  const attachInteractiveBehaviors = () => {
    setupModal();
    setupDropdown();
    setupMobileMenu();
    markActiveLink();
  };

  // ---------- Inicialização ----------
  const init = () => {
    interceptInternalLinks();

    // Primeira renderização baseada no hash atual
    router();

    // Roteamento por hash
    on(window, 'hashchange', () => {
      router();
      markActiveLink();
    });

    // Saudação (se voltar para home por server-side render)
    greetReturningUser();
  };

  // DOM pronto
  on(document, 'DOMContentLoaded', init);
})();
