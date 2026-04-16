/* ============================================================
   NANCY VUU — theme.js  v2.0.0
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {

  // ── SCROLL PROGRESS ───────────────────────────────────────
  var progressBar = document.getElementById('scroll-progress');
  if (progressBar) {
    window.addEventListener('scroll', function() {
      var total = document.body.scrollHeight - window.innerHeight;
      progressBar.style.width = (total > 0 ? window.scrollY / total * 100 : 0) + '%';
    }, { passive: true });
  }

  // ── NAVBAR SCROLL SHADOW ──────────────────────────────────
  var navbar = document.querySelector('.site-nav');
  if (navbar) {
    window.addEventListener('scroll', function() {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
  }

  // ── MENU TOGGLE ───────────────────────────────────────────
  window.toggleMenu = function() {
    var menu   = document.getElementById('menu-overlay');
    var toggle = document.getElementById('menu-toggle-btn');
    if (!menu) return;

    var isOpen = !menu.classList.contains('menu-overlay--closed');
    if (isOpen) {
      menu.classList.add('menu-overlay--closed');
      document.body.classList.remove('menu-open');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
    } else {
      menu.classList.remove('menu-overlay--closed');
      document.body.classList.add('menu-open');
      if (toggle) toggle.setAttribute('aria-expanded', 'true');
      var closeBtn = document.getElementById('menu-close-btn');
      if (closeBtn) setTimeout(function() { closeBtn.focus(); }, 100);
    }
  };

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      var menu = document.getElementById('menu-overlay');
      if (menu && !menu.classList.contains('menu-overlay--closed')) window.toggleMenu();
      closeCart();
      window.closeAudienceModal();
      window.closeGatewayModal();
    }
  });

  // ── CART DRAWER ───────────────────────────────────────────
  window.openCart = function() {
    var drawer = document.getElementById('cart-drawer');
    if (drawer) {
      drawer.setAttribute('aria-hidden', 'false');
      document.body.classList.add('menu-open');
      var closeBtn = drawer.querySelector('.cart-drawer__close');
      if (closeBtn) setTimeout(function() { closeBtn.focus(); }, 100);
    }
  };

  window.closeCart = function() {
    var drawer = document.getElementById('cart-drawer');
    if (drawer && drawer.getAttribute('aria-hidden') === 'false') {
      drawer.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('menu-open');
      var toggle = document.getElementById('cart-toggle-btn');
      if (toggle) toggle.focus();
    }
  };

  window.updateCartItem = function(key, qty) {
    fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: key, quantity: qty })
    })
    .then(function(r) { return r.json(); })
    .then(function(cart) {
      updateCartCount(cart.item_count);
      refreshCartDrawer();
    })
    .catch(function(err) { console.error('Cart update error:', err); });
  };

  function updateCartCount(count) {
    var badge = document.getElementById('cart-count');
    if (!badge) return;
    badge.textContent = count;
    badge.classList.toggle('cart-count--hidden', count === 0);
  }

  function formatMoney(cents) {
    return '$' + (cents / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function refreshCartDrawer() {
    fetch('/cart.js')
      .then(function(r) { return r.json(); })
      .then(function(cart) {
        updateCartCount(cart.item_count);
        var body   = document.getElementById('cart-items');
        var footer = document.querySelector('.cart-drawer__footer');
        if (!body) return;

        if (cart.item_count === 0) {
          body.innerHTML =
            '<div class="cart-drawer__empty">' +
              '<p class="body-copy">Your cart is empty.</p>' +
              '<a href="/collections/all" class="btn-editorial" onclick="closeCart()">Shop Now</a>' +
            '</div>';
          if (footer) footer.style.display = 'none';
          return;
        }

        var html = '';
        cart.items.forEach(function(item) {
          var imgHtml = item.image
            ? '<img src="' + item.image + '" alt="" loading="lazy" width="80" height="80" style="width:80px;height:80px;object-fit:cover;">'
            : '';
          var variantHtml = (item.variant_title && item.variant_title !== 'Default Title')
            ? '<p class="cart-item__variant eyebrow" style="margin-bottom:.25rem;">' + item.variant_title + '</p>'
            : '';
          var key = item.key;
          html +=
            '<div class="cart-item" data-key="' + key + '">' +
              '<div class="cart-item__image">' + imgHtml + '</div>' +
              '<div class="cart-item__details">' +
                '<p class="cart-item__title serif-font">' + item.product_title + '</p>' +
                variantHtml +
                '<div class="cart-item__bottom">' +
                  '<div class="cart-item__qty">' +
                    '<button class="qty-btn" onclick="updateCartItem(\'' + key + '\',' + (item.quantity - 1) + ')">−</button>' +
                    '<span>' + item.quantity + '</span>' +
                    '<button class="qty-btn" onclick="updateCartItem(\'' + key + '\',' + (item.quantity + 1) + ')">+</button>' +
                  '</div>' +
                  '<span class="cart-item__price">' + formatMoney(item.final_line_price) + '</span>' +
                '</div>' +
              '</div>' +
              '<button class="cart-item__remove" onclick="updateCartItem(\'' + key + '\',0)" aria-label="Remove ' + item.product_title + '">✕</button>' +
            '</div>';
        });
        body.innerHTML = html;

        if (footer) {
          footer.style.display = '';
          var totalEl = footer.querySelector('.cart-drawer__total');
          if (totalEl) totalEl.textContent = formatMoney(cart.total_price);
        }
      })
      .catch(function(err) { console.error('Cart refresh error:', err); });
  }

  // Add to cart with drawer open
  var productForm = document.getElementById('product-form');
  if (productForm) {
    productForm.addEventListener('submit', function(e) {
      e.preventDefault();
      var btn = document.getElementById('add-to-cart-btn');
      if (btn) { btn.textContent = 'Adding…'; btn.disabled = true; }

      var formData = new FormData(productForm);
      fetch('/cart/add.js', {
        method: 'POST',
        body: formData
      })
      .then(function(r) { return r.json(); })
      .then(function() {
        if (btn) { btn.textContent = 'Added!'; }
        return fetch('/cart.js');
      })
      .then(function(r) { return r.json(); })
      .then(function(cart) {
        updateCartCount(cart.item_count);
        refreshCartDrawer();
        window.openCart();
        setTimeout(function() {
          if (btn) { btn.textContent = 'Add to Cart'; btn.disabled = false; }
        }, 1500);
      })
      .catch(function(err) {
        console.error('Add to cart error:', err);
        productForm.submit();
      });
    });
  }

  // ── SCROLL REVEAL ─────────────────────────────────────────
  var revealObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(function(el) {
    revealObserver.observe(el);
  });

  // ── PILLAR NAV SMOOTH SCROLL ──────────────────────────────
  document.querySelectorAll('.academy-pillar-nav__link[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      var target = document.querySelector(this.getAttribute('href'));
      if (!target) return;
      var nav = document.querySelector('.academy-pillar-nav');
      var offset = nav ? nav.offsetHeight + 20 : 80;
      window.scrollTo({
        top: target.offsetTop - offset,
        behavior: 'smooth'
      });
    });
  });

  // ── SETH EDEN SPLIT HERO INTERACTION ──────────────────────
  var splitPanels = document.querySelectorAll('.seth-split-hero__panel');
  if (splitPanels.length === 2) {
    splitPanels.forEach(function(panel) {
      panel.addEventListener('mouseenter', function() {
        splitPanels.forEach(function(p) {
          p.style.flex = p === panel ? '1.3' : '0.7';
          var img = p.querySelector('.seth-split-hero__img');
          if (img) img.style.filter = p === panel ? 'grayscale(0%)' : 'grayscale(100%)';
        });
      });
      panel.addEventListener('mouseleave', function() {
        splitPanels.forEach(function(p) {
          p.style.flex = '1';
          var img = p.querySelector('.seth-split-hero__img');
          if (img) img.style.filter = '';
        });
      });
    });
  }

  // ── LEGACY GATEWAY MODAL ─────────────────────────────────
  window.openGatewayModal = function() {
    var modal = document.getElementById('nv-gateway-modal');
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('nv-gateway-modal--open');
    document.body.style.overflow = 'hidden';
  };

  window.closeGatewayModal = function() {
    var modal = document.getElementById('nv-gateway-modal');
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'true');
    modal.classList.remove('nv-gateway-modal--open');
    document.body.style.overflow = '';
  };

  // ── AUDIENCE MODAL ────────────────────────────────────────
  window.openAudienceModal = function(retreatType) {
    var modal = document.getElementById('audience-modal');
    if (!modal) return;
    if (retreatType) {
      var retreatProgramInput = modal.querySelector('[data-retreat-program-input]');
      if (retreatProgramInput) retreatProgramInput.value = retreatType;
    }
    modal.setAttribute('aria-hidden', 'false');
    modal.style.display = 'flex';
    document.body.classList.add('menu-open');
  };

  window.closeAudienceModal = function() {
    var modal = document.getElementById('audience-modal');
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'true');
    modal.style.display = 'none';
    document.body.classList.remove('menu-open');
  };

  // ── COLLECTION PAGINATION SCROLL TO TOP ───────────────────
  if (sessionStorage.getItem('paginationScrollTop') === '1') {
    sessionStorage.removeItem('paginationScrollTop');
    var grid = document.getElementById('product-grid');
    if (grid) {
      grid.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
  }
  document.addEventListener('click', function(e) {
    var link = e.target.closest('.pagination__link');
    if (link && link.getAttribute('href') && link.getAttribute('href') !== '#') {
      sessionStorage.setItem('paginationScrollTop', '1');
    }
  });

  // ── PHOTOGRAPHY PARALLAX ───────────────────────────────
  var parallaxSections = document.querySelectorAll('[data-parallax]');
  if (parallaxSections.length) {
    var ticking = false;
    function updateParallax() {
      parallaxSections.forEach(function(section) {
        var factor = parseFloat(section.dataset.parallax) || 0.3;
        var rect = section.getBoundingClientRect();
        var offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * factor;
        section.style.setProperty('--py', offset.toFixed(2) + 'px');
      });
      ticking = false;
    }
    window.addEventListener('scroll', function() {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }, { passive: true });
    updateParallax();
  }

  // Delegate [data-audience-open] clicks
  document.addEventListener('click', function(e) {
    // Gateway modal
    var gatewayOpen = e.target.closest('[data-gateway-open]');
    if (gatewayOpen) {
      e.preventDefault();
      window.openGatewayModal();
      return;
    }
    var gatewayClose = e.target.closest('[data-gateway-close]');
    if (gatewayClose) {
      e.preventDefault();
      window.closeGatewayModal();
      return;
    }
    // Backdrop click closes gateway modal
    var gatewayModal = document.getElementById('nv-gateway-modal');
    if (gatewayModal && gatewayModal.classList.contains('nv-gateway-modal--open') && e.target === gatewayModal) {
      window.closeGatewayModal();
      return;
    }

    var openBtn = e.target.closest('[data-audience-open]');
    if (openBtn) {
      e.preventDefault();
      window.openAudienceModal();
    }
    var closeBtn = e.target.closest('[data-audience-close]');
    if (closeBtn) {
      e.preventDefault();
      window.closeAudienceModal();
      return;
    }
    var audienceModal = document.getElementById('audience-modal');
    if (audienceModal && audienceModal.getAttribute('aria-hidden') === 'false' && e.target === audienceModal) {
      window.closeAudienceModal();
    }
  });

  document.addEventListener('keydown', function(e) {
    if (e.key !== 'Escape') return;
    var audienceModal = document.getElementById('audience-modal');
    if (audienceModal && audienceModal.getAttribute('aria-hidden') === 'false') {
      window.closeAudienceModal();
    }
  });

  // ── FORM VERTICAL DETECTION ────────────────────────────────
  var nvFormMap = [
    { selector: '#atelier-contact-form', vertical: 'bridal' },
    { selector: '#seth-commission-form', vertical: 'sartorial' },
    { selector: '#booknv-booking-form', vertical: 'global' },
    { selector: '#nv-alignment-form', vertical: 'immersion' },
    { selector: '#retreat_inline_form form', vertical: 'immersion' }
  ];

  nvFormMap.forEach(function(item) {
    var form = document.querySelector(item.selector);
    if (!form) return;
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var vertical = item.vertical;
      if (item.selector === '#atelier-contact-form' && window.location.pathname === '/pages/retreats') {
        vertical = 'immersion';
      }
      var formData = new FormData(form);
      fetch('/', {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      }).then(function() {
        form.reset();
        window.nvShowSuccess(vertical);
      }).catch(function() {
        // Fallback: native submit
        form.submit();
      });
    });
  });

});

// ── NV POST-SUBMISSION SUCCESS OVERLAY ───────────────────
var nvSuccessMessages = {
  bridal: {
    eyebrow: 'Bridal Commission Secured',
    title: 'Your Vision Has Been Received.',
    body: 'Your private bridal inquiry has been secured. Nancy Vuu will review your vision personally. While we schedule your initial private consultation, explore the artistry and silhouettes we have crafted for the sovereign bride.',
    cta: 'Enter the Bridal House',
    href: '/collections/bridal'
  },
  sartorial: {
    eyebrow: 'Commission Initialized',
    title: 'Your File Has Been Opened.',
    body: 'Your private commission inquiry for an Executive or Groom suit has been initialized. While your file is finalized, explore the architecture and bespoke options of the Seth Eden collection.',
    cta: 'Explore Seth Eden',
    href: '/pages/seth-eden'
  },
  global: {
    eyebrow: 'Engagement Inquiry Logged',
    title: 'Your Inquiry Has Been Secured.',
    body: 'Your organizational inquiry for a keynote or media appearance has been secured and logged. We are reviewing event logistics and availability. Review Nancy Vuu\'s latest prime-time broadcast, validated by KTVU Fox 2.',
    cta: 'Latest Broadcast',
    href: '/pages/nancy-uvv-press'
  },
  immersion: {
    eyebrow: 'Application Received',
    title: 'Your Vetting Process Has Begun.',
    body: 'Your private application for an Executive Immersion has been received. This initiates our formal vetting process. We are reviewing your specific leadership focus for the upcoming calendar year.',
    cta: 'Executive Immersions',
    href: '/pages/retreats'
  }
};

window.nvShowSuccess = function(vertical) {
  var msg = nvSuccessMessages[vertical];
  if (!msg) return;
  document.getElementById('nv-success-eyebrow').textContent = msg.eyebrow;
  document.getElementById('nv-success-title').textContent = msg.title;
  document.getElementById('nv-success-body').textContent = msg.body;
  var ctaEl = document.getElementById('nv-success-cta');
  ctaEl.textContent = msg.cta;
  ctaEl.href = msg.href;
  var overlay = document.getElementById('nv-success-overlay');
  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
};

window.nvCloseSuccess = function() {
  document.getElementById('nv-success-overlay').style.display = 'none';
  document.body.style.overflow = '';
};

// ── DOSSIER MODAL ─────────────────────────────────────────
window.nvOpenDossier = function() {
  var modal = document.getElementById('nv-dossier-modal');
  if (!modal) return;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
};
window.nvCloseDossier = function() {
  var modal = document.getElementById('nv-dossier-modal');
  if (!modal) return;
  modal.classList.remove('active');
  document.body.style.overflow = '';
  setTimeout(function() {
    var wrap = document.getElementById('nv-dossier-form-wrap');
    var success = document.getElementById('nv-dossier-success');
    if (wrap) wrap.style.display = 'block';
    if (success) success.style.display = 'none';
    var form = document.getElementById('nv-dossier-form');
    if (form) form.reset();
    var errors = document.getElementById('nv-dossier-errors');
    if (errors) { errors.style.display = 'none'; errors.textContent = ''; }
  }, 400);
};

var dossierModal = document.getElementById('nv-dossier-modal');
if (dossierModal) {
  dossierModal.addEventListener('click', function(e) {
    if (e.target === this) window.nvCloseDossier();
  });
}

var dossierForm = document.getElementById('nv-dossier-form');
if (dossierForm) {
  dossierForm.addEventListener('submit', function(e) {
    e.preventDefault();
    var legalCheck = document.getElementById('dossier-legal');
    if (!legalCheck || !legalCheck.checked) {
      var errors = document.getElementById('nv-dossier-errors');
      if (errors) {
        errors.style.display = 'block';
        errors.textContent = 'Please accept the terms to proceed.';
      }
      return;
    }
    var formData = new FormData(dossierForm);
    fetch('/contact', {
      method: 'POST',
      body: formData,
      headers: { 'Accept': 'application/json' }
    }).then(function() {
      document.getElementById('nv-dossier-form-wrap').style.display = 'none';
      document.getElementById('nv-dossier-success').style.display = 'block';
    }).catch(function() {
      dossierForm.submit();
    });
  });
}

// ── GENERIC INQUIRY MODAL ─────────────────────────────────
var nvInquiryData = {
  academy: {
    eyebrow: 'The Creative Academy',
    title: 'Enrollment Inquiry',
    desc: 'Submit your interest in The Creative Academy. Our team will reach out with enrollment details and available pathways.',
    tag: 'creative-academy-inquiry'
  },
  womenceo: {
    eyebrow: 'Women CEO Collective',
    title: 'Apply for Access',
    desc: 'Submit your application for the Women CEO Collective. This is an elite, invitation-based network for high-level female executives.',
    tag: 'women-ceo-inquiry'
  }
};

function nvSetInquiryProductContext(payload) {
  var productFieldWrap = document.getElementById('nv-inquiry-product-field');
  var productDisplay = document.getElementById('nv-inquiry-product-display');
  var productTitleInput = document.getElementById('nv-inquiry-product-title');
  var productUrlInput = document.getElementById('nv-inquiry-product-url');
  var productVariantInput = document.getElementById('nv-inquiry-product-variant');
  var productCollectionInput = document.getElementById('nv-inquiry-product-collection');
  var inquiryBody = document.querySelector('#nv-inquiry-form textarea[name="contact[body]"]');

  if (!payload || !payload.title) {
    if (productFieldWrap) productFieldWrap.style.display = 'none';
    if (productDisplay) productDisplay.value = '';
    if (productTitleInput) productTitleInput.value = '';
    if (productUrlInput) productUrlInput.value = '';
    if (productVariantInput) productVariantInput.value = '';
    if (productCollectionInput) productCollectionInput.value = '';
    return;
  }

  var displayText = 'Product of Interest: ' + payload.title;
  if (payload.variant) displayText += ' | Variant: ' + payload.variant;

  if (productFieldWrap) productFieldWrap.style.display = 'block';
  if (productDisplay) productDisplay.value = displayText;
  if (productTitleInput) productTitleInput.value = payload.title;
  if (productUrlInput) productUrlInput.value = payload.url || '';
  if (productVariantInput) productVariantInput.value = payload.variant || '';
  if (productCollectionInput) productCollectionInput.value = payload.collection || '';

  if (inquiryBody && !inquiryBody.value.trim()) {
    inquiryBody.value =
      'Product Inquiry: ' + payload.title +
      (payload.variant ? '\nPreferred Variant: ' + payload.variant : '') +
      (payload.collection ? '\nCollection: ' + payload.collection : '') +
      (payload.url ? '\nProduct URL: ' + payload.url : '');
  }
}

window.nvOpenInquiry = function(vertical) {
  var data = nvInquiryData[vertical];
  if (!data) return;
  nvSetInquiryProductContext(null);
  document.getElementById('nv-inquiry-eyebrow').textContent = data.eyebrow;
  document.getElementById('nv-inquiry-title').textContent = data.title;
  document.getElementById('nv-inquiry-desc').textContent = data.desc;
  var tag = document.getElementById('nv-inquiry-tag');
  if (tag) tag.value = data.tag;
  var modal = document.getElementById('nv-inquiry-modal');
  if (!modal) return;
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
};

window.nvOpenProductInquiry = function(payload) {
  if (!payload || !payload.title) return;
  document.getElementById('nv-inquiry-eyebrow').textContent = 'Private Product Inquiry';
  document.getElementById('nv-inquiry-title').textContent = 'Request Availability';
  document.getElementById('nv-inquiry-desc').textContent = 'Submit your details and our atelier concierge will contact you with pricing, availability, and customization options for this piece.';
  var tag = document.getElementById('nv-inquiry-tag');
  if (tag) tag.value = 'bridal-product-inquiry';
  nvSetInquiryProductContext(payload);
  var modal = document.getElementById('nv-inquiry-modal');
  if (!modal) return;
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
};

window.nvCloseInquiry = function() {
  var modal = document.getElementById('nv-inquiry-modal');
  if (!modal) return;
  modal.style.display = 'none';
  document.body.style.overflow = '';
  setTimeout(function() {
    var wrap = document.getElementById('nv-inquiry-form-wrap');
    var success = document.getElementById('nv-inquiry-success');
    if (wrap) wrap.style.display = 'block';
    if (success) success.style.display = 'none';
    var form = document.getElementById('nv-inquiry-form');
    if (form) form.reset();
    nvSetInquiryProductContext(null);
  }, 400);
};

document.addEventListener('click', function(e) {
  var trigger = e.target.closest('.js-product-inquiry-trigger');
  if (!trigger) return;
  e.preventDefault();

  var variant = trigger.getAttribute('data-product-variant') || '';
  if (trigger.getAttribute('data-product-variant-source') === 'product-page') {
    var select = document.getElementById('product-variant-select');
    if (select && select.selectedIndex >= 0) {
      var selectedText = select.options[select.selectedIndex].text || '';
      variant = selectedText.split(' — ')[0] || variant;
      if (variant === 'Default Title') variant = '';
    }
  }

  window.nvOpenProductInquiry({
    title: trigger.getAttribute('data-product-title') || '',
    url: trigger.getAttribute('data-product-url') || '',
    collection: trigger.getAttribute('data-product-collection') || '',
    variant: variant
  });
});

var inquiryModal = document.getElementById('nv-inquiry-modal');
if (inquiryModal) {
  inquiryModal.addEventListener('click', function(e) {
    if (e.target === this) window.nvCloseInquiry();
  });
}

var inquiryForm = document.getElementById('nv-inquiry-form');
if (inquiryForm) {
  inquiryForm.addEventListener('submit', function(e) {
    e.preventDefault();
    var formData = new FormData(inquiryForm);
    fetch('/contact', {
      method: 'POST',
      body: formData,
      headers: { 'Accept': 'application/json' }
    }).then(function() {
      document.getElementById('nv-inquiry-form-wrap').style.display = 'none';
      document.getElementById('nv-inquiry-success').style.display = 'block';
    }).catch(function() {
      inquiryForm.submit();
    });
  });
}

