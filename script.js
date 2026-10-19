document.addEventListener('DOMContentLoaded', () => {

    const isCaseStudy = document.body.classList.contains('fullscreen-case-study');
    const nav = document.querySelector('.main-nav');
    const navLinks = Array.from(document.querySelectorAll('.nav-item'));
    const navToggle = document.querySelector('.nav-toggle');
    const navLinksContainer = document.querySelector('.nav-links');
    const navScrim = document.querySelector('.nav-scrim');

    // Listener di scroll ottimizzato
    const onScroll = [];
    let rafPending = false;
    function scheduleScroll() {
        if (rafPending) return;
        rafPending = true;
        requestAnimationFrame(() => {
            rafPending = false;
            onScroll.forEach(fn => fn());
        });
    }

    // ==========================================
    // 1. NAVIGAZIONE E SCROLL ATTIVO
    // ==========================================
    const navTargets = navLinks
        .map(link => ({ link, el: document.querySelector(link.getAttribute('href')) }))
        .filter(t => t.el);

    if (navTargets.length) {
        onScroll.push(() => {
            const probe = window.scrollY + window.innerHeight * 0.35;
            let activeId = navTargets[0].el.id;
            navTargets.forEach(t => {
                if (t.el.getBoundingClientRect().top + window.scrollY <= probe) activeId = t.el.id;
            });
            navTargets.forEach(t => t.link.classList.toggle('active', t.el.id === activeId));
        });
    }

    // Telefono: la striscia delle sezioni scorre da sola e tiene al centro la voce attiva
    if (navLinksContainer && navLinks.length) {
        const phone = window.matchMedia('(max-width: 768px)');
        let lastActive = null;
        onScroll.push(() => {
            if (!phone.matches) return;
            const active = navLinks.find(l => l.classList.contains('active'));
            if (!active || active === lastActive) return;
            lastActive = active;
            const c = navLinksContainer;
            c.scrollTo({ left: active.offsetLeft - (c.clientWidth - active.offsetWidth) / 2, behavior: 'smooth' });
        });
    }

    // ==========================================
    // 2. HEADER SMART E MENU MOBILE
    // ==========================================
    let lastScrollY = window.scrollY;
    const menuIsOpen = () => navLinksContainer && navLinksContainer.classList.contains('open');

    if (nav) {
        onScroll.push(() => {
            const y = window.scrollY;
            const goingDown = y > lastScrollY;

            const canHide = !isCaseStudy && !menuIsOpen();
            nav.style.transform = (canHide && goingDown && y > 120) ? 'translateY(-100%)' : 'translateY(0)';

            nav.classList.toggle('scrolled', y > 40);
            lastScrollY = y;
        });
    }

    function setMenu(open) {
        if (!navLinksContainer || !navToggle) return;
        navLinksContainer.classList.toggle('open', open);
        navToggle.classList.toggle('open', open);
        navToggle.setAttribute('aria-expanded', String(open));
        navToggle.setAttribute('aria-label', open ? 'Chiudi menu' : 'Apri menu');
        if (navScrim) {
            if (open) navScrim.hidden = false;
            requestAnimationFrame(() => navScrim.classList.toggle('on', open));
            if (!open) setTimeout(() => { if (!menuIsOpen()) navScrim.hidden = true; }, 400);
        }
        document.body.style.overflow = open ? 'hidden' : '';
    }

    if (navToggle && navLinksContainer) {
        navToggle.addEventListener('click', () => setMenu(!menuIsOpen()));
        navScrim?.addEventListener('click', () => setMenu(false));
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && menuIsOpen()) { setMenu(false); navToggle.focus(); }
        });
        navLinks.forEach(link => link.addEventListener('click', () => setMenu(false)));
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && menuIsOpen()) setMenu(false);
        });
    }

    // ==========================================
    // 3. PARALLASSE HERO (Effetto Scroll Corretto)
    // ==========================================
    const hero = document.getElementById('hero');
    const floatingImgs = document.querySelectorAll('.floating-img');

    if (hero && floatingImgs.length > 0) {
        onScroll.push(() => {
            const scrollY = window.scrollY;
            
            if (scrollY > window.innerHeight) return;

            floatingImgs.forEach(img => {
                const sp = parseFloat(img.getAttribute('data-speed')) || 1;
                const yPos = scrollY * sp * 0.2; 
                
                // Il trucco: muoviamo il parent (.desk-bob) invece di <img>.
                // Così la rotazione CSS dell'immagine non viene sovrascritta!
                const parent = img.parentElement;
                if (parent && parent.classList.contains('desk-bob')) {
                    parent.style.transform = `translate3d(0px, ${yPos}px, 0)`;
                }
            });
        });
    }

    // ==========================================
    // 4. SCROLL REVEAL (Unificato per Portfolio e Case Studies)
    // ==========================================
    const scrollContainer = document.querySelector('.scroll-container');
    
    if (scrollContainer) {
        // Logica per le pagine Branding (Snap Scroll)
        const revealElementsSnap = scrollContainer.querySelectorAll('.reveal');
        if (revealElementsSnap.length > 0) {
            const snapObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('active');
                    }
                });
            }, {
                root: scrollContainer,
                threshold: 0.1,
                rootMargin: "0px"
            });

            revealElementsSnap.forEach(el => {
                snapObserver.observe(el);
            });
        }
    } else {
        // Logica per la Home Page (Scroll Window)
        const revealElements = document.querySelectorAll('.reveal');
        if (revealElements.length > 0) {
            const revealObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('active');
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

            revealElements.forEach(el => revealObserver.observe(el));
        }
    }

    // ==========================================
    // FUNZIONE CONDIVISA PER LO SCROLL DEI CAROSELLI (SOCIAL & DRAW)
    // ==========================================
    const stepOf = (track) => {
        const card = track.querySelector('.draw-card, .ephemera-card');
        if (!card) return 360; // Fallback di sicurezza
        const gap = parseFloat(getComputedStyle(track).columnGap) || 30;
        return card.offsetWidth + gap;
    };

    // CONTROLLI CAROSELLO 4.4 (SOCIAL)
    const socialTrack = document.getElementById('socialTrack');
    const prevSocialBtn = document.querySelector('.prev-social');
    const nextSocialBtn = document.querySelector('.next-social');

    if (socialTrack && prevSocialBtn && nextSocialBtn) {
        prevSocialBtn.addEventListener('click', () => {
            socialTrack.scrollBy({ left: -stepOf(socialTrack), behavior: 'smooth' });
        });
        nextSocialBtn.addEventListener('click', () => {
            socialTrack.scrollBy({ left: stepOf(socialTrack), behavior: 'smooth' });
        });
    }

    // VIDEO SOCIAL: parte solo quando è visibile, sempre muto, va in pausa quando esce
    // dallo schermo. Rispetta "riduci animazioni" e il risparmio dati.
    document.querySelectorAll('.social-video').forEach(video => {
        const frame = video.closest('.draw-frame');
        const btn = frame && frame.querySelector('.video-toggle');
        if (!frame || !btn) return;

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const saveData = navigator.connection && navigator.connection.saveData;
        let userPaused = false;

        const play = () => { const p = video.play(); if (p && p.catch) p.catch(() => {}); };
        const sync = () => frame.classList.toggle('is-playing', !video.paused);
        video.addEventListener('play', sync);
        video.addEventListener('pause', sync);

        btn.addEventListener('click', () => {
            if (video.paused) { userPaused = false; play(); }
            else { userPaused = true; video.pause(); }
        });

        if (!('IntersectionObserver' in window)) return;
        new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    if (!userPaused && !reduceMotion && !saveData) play();
                } else {
                    video.pause();
                }
            });
        }, { threshold: 0.6 }).observe(video);
    });

    // LOGHI: B/N di default; click, tap o Invio/Spazio per vederli a colori (e di nuovo per tornare)
    document.querySelectorAll('.mark-card').forEach(card => {
        const name = card.querySelector('.mark-name');
        card.tabIndex = 0;
        card.setAttribute('role', 'button');
        card.setAttribute('aria-pressed', 'false');
        card.setAttribute('aria-label', (name ? name.textContent : 'Logo') + ': mostra la versione a colori');
        const toggle = () => {
            const on = card.classList.toggle('is-color');
            card.setAttribute('aria-pressed', String(on));
        };
        card.addEventListener('click', toggle);
        card.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
        });
    });

    // ==========================================
    // 5. HORIZONTAL SCROLL BRANDING
    // ==========================================
    const horizontalTrack = document.querySelector('.horizontal-track');
    const horizontalSectionWrapper = document.querySelector('.horizontal-section-wrapper');
    const progressBar = document.querySelector('.horizontal-progress-bar');

    if (horizontalSectionWrapper && horizontalTrack) {
        const updateHorizontal = () => {
            // Telefono: carosello nativo (scroll-snap nel CSS), niente movimento guidato dallo scroll
            if (window.matchMedia('(max-width: 768px)').matches) {
                horizontalTrack.style.transform = '';
                return;
            }
            const rect = horizontalSectionWrapper.getBoundingClientRect();
            const scrollSpace = rect.height - window.innerHeight;
            if (scrollSpace <= 0) return;

            const progress = Math.max(0, Math.min(1, -rect.top / scrollSpace));
            const maxTranslate = horizontalTrack.scrollWidth - window.innerWidth;

            horizontalTrack.style.transform = `translate3d(${-progress * maxTranslate}px, 0, 0)`;
            if (progressBar) progressBar.style.transform = `scaleX(${progress})`;
        };

        onScroll.push(updateHorizontal);
        window.addEventListener('resize', updateHorizontal);
        updateHorizontal();
    }

    // Pallini del carosello Branding (telefono): seguono lo swipe e portano alla card al tocco
    const brandingDots = Array.from(document.querySelectorAll('.carousel-dot'));
    if (horizontalTrack && brandingDots.length) {
        const items = Array.from(horizontalTrack.querySelectorAll('.horizontal-item'));
        const setActive = (i) => brandingDots.forEach((d, n) => {
            d.classList.toggle('is-active', n === i);
            d.setAttribute('aria-current', String(n === i));
        });
        const currentIndex = () => {
            const mid = horizontalTrack.scrollLeft + horizontalTrack.clientWidth / 2;
            let best = 0, bestDist = Infinity;
            items.forEach((it, i) => {
                const dist = Math.abs(it.offsetLeft + it.offsetWidth / 2 - mid);
                if (dist < bestDist) { bestDist = dist; best = i; }
            });
            return best;
        };
        horizontalTrack.addEventListener('scroll', () => setActive(currentIndex()), { passive: true });
        brandingDots.forEach((dot, i) => dot.addEventListener('click', () => {
            const it = items[i];
            if (!it) return;
            horizontalTrack.scrollTo({ left: it.offsetLeft - (horizontalTrack.clientWidth - it.offsetWidth) / 2, behavior: 'smooth' });
        }));
    }

    // ==========================================
    // 6. EDITORIALE (SELEZIONE LIBRI)
    // ==========================================
    const bookItems = Array.from(document.querySelectorAll('.book-item'));
    const bookPanes = document.querySelectorAll('.book-detail-pane');
    const readingTable = document.getElementById('reading-table');

    if (bookItems.length > 0) {
        const selectBook = (item, shouldScroll) => {
            bookItems.forEach(b => {
                const on = b === item;
                b.classList.toggle('active', on);
                b.setAttribute('aria-selected', String(on));
            });
            bookPanes.forEach(p => p.classList.remove('active'));

            const targetPane = document.getElementById(item.getAttribute('data-target'));
            if (!targetPane) return;
            targetPane.classList.add('active');

            if (!shouldScroll || !readingTable) return;
            const rect = readingTable.getBoundingClientRect();
            if (rect.top >= 0 && rect.top < window.innerHeight * 0.6) return;

            setTimeout(() => {
                const offset = rect.top + window.scrollY - 100;
                window.scrollTo({ top: offset, behavior: 'smooth' });
            }, 120);
        };

        bookItems.forEach(item => {
            item.addEventListener('click', () => selectBook(item, true));
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selectBook(item, true);
                }
            });
        });
    }

    // ==========================================
    // 7. SLIDER PAGINE EDITORIALE E SOCIAL
    // ==========================================
    document.querySelectorAll('.page-slider-container').forEach(container => {
        const slider = container.querySelector('.page-slider');
        const pages = container.querySelectorAll('.page-slider-wrapper');
        const prevBtn = container.querySelector('.prev-page');
        const nextBtn = container.querySelector('.next-page');
        const counter = container.querySelector('.page-counter');

        if (!slider || pages.length === 0) return;

        let currentPageIndex = 0;
        if (pages.length < 2 && prevBtn && nextBtn) {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
        }

        let ready = false;
        const hydrate = (i) => {
            const img = pages[i]?.querySelector('img[data-src]');
            if (!img) return;
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
        };

        function updatePageSlider() {
            slider.style.transform = `translateX(-${currentPageIndex * 100}%)`;
            if (ready) {
                hydrate(currentPageIndex);
                hydrate((currentPageIndex + 1) % pages.length);
            }
            if (counter) counter.textContent = `${currentPageIndex + 1} / ${pages.length}`;
        }

        const step = (d) => {
            ready = true;
            currentPageIndex = (currentPageIndex + d + pages.length) % pages.length;
            updatePageSlider();
        };

        nextBtn?.addEventListener('click', (e) => { e.preventDefault(); step(1); });
        prevBtn?.addEventListener('click', (e) => { e.preventDefault(); step(-1); });

        let pageStartX = 0;
        // StopPropagation evita conflitti tra lo scorrimento della singola galleria e quello dell'intera sezione social
        slider.addEventListener('touchstart', (e) => { 
            e.stopPropagation();
            pageStartX = e.changedTouches[0].screenX; 
        }, { passive: true });
        
        slider.addEventListener('touchend', (e) => {
            e.stopPropagation();
            const dx = e.changedTouches[0].screenX - pageStartX;
            if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
        }, { passive: true });

        const wake = () => {
            if (ready) return;
            ready = true;
            updatePageSlider();
        };

        if ('IntersectionObserver' in window) {
            const io = new IntersectionObserver((entries, obs) => {
                if (entries[0].isIntersecting) { wake(); obs.disconnect(); }
            }, { rootMargin: '200px' });
            io.observe(container);
        } else {
            wake();
        }

        updatePageSlider();
    });

    // ==========================================
    // 8. CONTROLLI CAROSELLO 4.5 (DRAW & ILLUSTRATION)
    // ==========================================
    const drawTrack = document.getElementById('drawTrack');
    const prevDrawBtn = document.querySelector('.prev-draw');
    const nextDrawBtn = document.querySelector('.next-draw');

    if (drawTrack && prevDrawBtn && nextDrawBtn) {
        prevDrawBtn.addEventListener('click', () => {
            drawTrack.scrollBy({ left: -stepOf(drawTrack), behavior: 'smooth' });
        });
        nextDrawBtn.addEventListener('click', () => {
            drawTrack.scrollBy({ left: stepOf(drawTrack), behavior: 'smooth' });
        });
    }

    // ==========================================
    // 8.5 FRECCE PER GLI SLIDER ORIZZONTALI (CASE STUDY)
    // Funzionano anche senza trackpad; da tastiera basta mettere a fuoco lo slider
    // e usare le frecce sinistra/destra.
    // ==========================================
    document.querySelectorAll('.edge-slider').forEach(slider => {
        if (slider.children.length < 2) return;

        slider.tabIndex = 0;
        slider.setAttribute('role', 'region');
        slider.setAttribute('aria-label', 'Galleria di immagini, scorri in orizzontale');

        const host = slider.offsetParent || slider.parentElement;
        const makeBtn = (dir) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'slider-arrow slider-arrow--' + (dir < 0 ? 'prev' : 'next');
            b.setAttribute('aria-label', dir < 0 ? 'Immagine precedente' : 'Immagine successiva');
            b.textContent = dir < 0 ? '←' : '→';
            b.addEventListener('click', () => {
                const first = slider.firstElementChild;
                const gap = parseFloat(getComputedStyle(slider).columnGap) || 40;
                const step = first ? first.offsetWidth + gap : slider.clientWidth * 0.8;
                slider.scrollBy({ left: dir * step, behavior: 'smooth' });
            });
            host.appendChild(b);
            return b;
        };
        const prev = makeBtn(-1);
        const next = makeBtn(1);

        const sync = () => {
            const max = slider.scrollWidth - slider.clientWidth;
            const hidden = max <= 2;
            [prev, next].forEach(b => b.classList.toggle('is-hidden', hidden));
            prev.disabled = slider.scrollLeft <= 2;
            next.disabled = slider.scrollLeft >= max - 2;

            // posiziona le frecce sui bordi dello slider, a metà altezza
            const top = slider.offsetTop + slider.offsetHeight / 2 - 24;
            prev.style.top = next.style.top = top + 'px';
            prev.style.left = (slider.offsetLeft + 14) + 'px';
            next.style.left = (slider.offsetLeft + slider.offsetWidth - 14 - 48) + 'px';
        };

        slider.addEventListener('scroll', sync, { passive: true });
        window.addEventListener('resize', sync);
        window.addEventListener('load', sync);
        slider.querySelectorAll('img').forEach(img => img.addEventListener('load', sync));
        if ('ResizeObserver' in window) new ResizeObserver(sync).observe(slider);
        sync();
    });

    // ==========================================
    // 9. EXTRA: PROGRESS BAR & LIGHTBOX
    // ==========================================
    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    document.body.appendChild(bar);
    onScroll.push(() => {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.transform = `scaleX(${h > 0 ? window.scrollY / h : 0})`;
    });

    const zoomImgs = [...document.querySelectorAll('.zoomable')];
    if (zoomImgs.length) {
        const lb = document.createElement('div');
        lb.className = 'lightbox';
        lb.innerHTML = '<img alt=""><button class="lb-close" aria-label="Chiudi">✕</button><button class="lb-prev" aria-label="Precedente">←</button><button class="lb-next" aria-label="Successiva">→</button>';
        document.body.appendChild(lb);
        const big = lb.querySelector('img');
        let idx = 0;

        const sourceOf = (img) => {
            if (img.dataset.src) { img.src = img.dataset.src; img.removeAttribute('data-src'); }
            return img.currentSrc || img.src;
        };

        const show = n => { 
            idx = (n + zoomImgs.length) % zoomImgs.length; 
            big.src = sourceOf(zoomImgs[idx]); 
            big.alt = zoomImgs[idx].alt || 'Ingrandimento'; 
        };

        const close = () => { lb.classList.remove('open'); document.body.classList.remove('lb-open'); };
        zoomImgs.forEach((img, n) => { 
            img.addEventListener('click', () => { show(n); lb.classList.add('open'); document.body.classList.add('lb-open'); }); 
        });

        lb.querySelector('.lb-close').onclick = close;
        lb.querySelector('.lb-prev').onclick = e => { e.stopPropagation(); show(idx - 1); };
        lb.querySelector('.lb-next').onclick = e => { e.stopPropagation(); show(idx + 1); };
        lb.addEventListener('click', e => { if (e.target === lb) close(); });
        // Swipe per cambiare immagine da telefono
        let lbX = 0;
        lb.addEventListener('touchstart', e => { lbX = e.changedTouches[0].clientX; }, { passive: true });
        lb.addEventListener('touchend', e => {
            const dx = e.changedTouches[0].clientX - lbX;
            if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
        }, { passive: true });
        document.addEventListener('keydown', e => {
            if (!lb.classList.contains('open')) return;
            if (e.key === 'Escape') close();
            if (e.key === 'ArrowRight') show(idx + 1);
            if (e.key === 'ArrowLeft') show(idx - 1);
        });
    }

    // ==========================================
    // 10. DRAGGABLE DESK (Drag & Drop solo sugli elementi desk)
    // ==========================================
    const draggables = document.querySelectorAll('.hero-desk .desk-float');
    // Su touch gli sticker non si trascinano: altrimenti bloccano lo scroll della pagina
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
    if (draggables.length && !coarsePointer) {
        let topZIndex = 50;

        draggables.forEach((el) => {
            const imgs = el.querySelectorAll('img');
            imgs.forEach(img => img.addEventListener('dragstart', (e) => e.preventDefault()));

            let isDragging = false;
            let startX = 0, startY = 0;
            let currentX = 0, currentY = 0;
            let lastX = 0, lastY = 0;
            let velocityX = 0, velocityY = 0;
            let rafId = null;

            el.style.touchAction = 'none';

            const getPointerPos = (e) => e.type.startsWith('touch') ? (e.touches[0] || e.changedTouches[0]) : e;

            const updatePosition = (x, y) => {
                el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
            };

           const clampToHero = () => {
                const h = hero.getBoundingClientRect();
                const r = el.getBoundingClientRect();
                let dx = 0, dy = 0;
                if (r.left < h.left) dx = h.left - r.left;
                else if (r.right > h.right) dx = h.right - r.right;
                if (r.top < h.top) dy = h.top - r.top;
                else if (r.bottom > h.bottom) dy = h.bottom - r.bottom;
                if (dx) { currentX += dx; velocityX *= -0.5; }
                if (dy) { currentY += dy; velocityY *= -0.5; }
                if (dx || dy) updatePosition(currentX, currentY);
            };

            const applyInertia = () => {
                if (Math.abs(velocityX) > 0.3 || Math.abs(velocityY) > 0.3) {
                    currentX += velocityX;
                    currentY += velocityY;
                    velocityX *= 0.92;
                    velocityY *= 0.92;
                    updatePosition(currentX, currentY);
                    clampToHero();
                    rafId = requestAnimationFrame(applyInertia);
                } else {
                    clampToHero();
                }
            };
           
            const onMove = (e) => {
                if (!isDragging) return;
                const pointer = getPointerPos(e);

                velocityX = pointer.clientX - lastX;
                velocityY = pointer.clientY - lastY;
                lastX = pointer.clientX;
                lastY = pointer.clientY;

                currentX = pointer.clientX - startX;
                currentY = pointer.clientY - startY;

                updatePosition(currentX, currentY);
            };

            const onEnd = () => {
                if (!isDragging) return;
                isDragging = false;
                el.classList.remove('is-dragging');
                window.removeEventListener('mousemove', onMove);
                window.removeEventListener('mouseup', onEnd);
                window.removeEventListener('touchmove', onMove);
                window.removeEventListener('touchend', onEnd);
                applyInertia();
            };

            const onStart = (e) => {
                if (e.type === 'mousedown' && e.button !== 0) return;
                isDragging = true;
                if (rafId) cancelAnimationFrame(rafId);

                topZIndex++;
                el.style.zIndex = topZIndex;
                el.classList.add('is-dragging');

                const pointer = getPointerPos(e);
                startX = pointer.clientX - currentX;
                startY = pointer.clientY - currentY;
                lastX = pointer.clientX;
                lastY = pointer.clientY;
                velocityX = 0;
                velocityY = 0;

                window.addEventListener('mousemove', onMove);
                window.addEventListener('mouseup', onEnd);
                window.addEventListener('touchmove', onMove, { passive: true });
                window.addEventListener('touchend', onEnd);
            };

            el.addEventListener('mousedown', onStart);
            el.addEventListener('touchstart', onStart, { passive: true });
        });
    }

    // ==========================================
    // 10.5 DYNAMIC QUOTES (Frasi a rotazione)
    // ==========================================
    const quoteElement = document.getElementById('dynamic-quote');
    
    const quotes = [
        `"Less, but better" <br><span class="italic-accent">- Dieter Rams</span>`,
        `"Everyone here is a work of art" <br><span class="italic-accent">- Madonna, Danceteria</span>`,
        `"Il design apre opportunità, non risolve solo problemi. Ti offre la possibilità di vedere le cose in modo diverso, probabilmente prima degli altri." <br><span class="italic-accent">- Giorgia Lupi</span>`,
        `"You've got your passion, you've got your pride<br>But don't you know that only fools are satisfied?" <br><span class="italic-accent">- Billy Joel, Vienna</span>`,
        `"The room is on fire as she's fixing her hair." <br><span class="italic-accent">- The Strokes, Reptilia</span>`
    ];

    if (quoteElement) {
        // Tutte le frasi stanno nella STESSA cella della griglia (vedi .quote-item nel CSS):
        // l'altezza della sezione è sempre quella della frase più lunga, quindi cambiando
        // frase il testo sotto non si sposta mai.
        quotes.forEach(html => {
            const item = document.createElement('span');
            item.className = 'quote-item';
            item.setAttribute('aria-hidden', 'true');
            item.innerHTML = html;
            quoteElement.appendChild(item);
        });

        const items = quoteElement.querySelectorAll('.quote-item');
        let current = 0;

        if (items.length > 1 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setInterval(() => {
                items[current].classList.remove('is-active');
                items[current].setAttribute('aria-hidden', 'true');
                current = (current + 1) % items.length;
                items[current].classList.add('is-active');
                items[current].removeAttribute('aria-hidden');
            }, 5000);
        }
    }

    // ==========================================
    // 11. AVVIO
    // ==========================================
    window.addEventListener('scroll', scheduleScroll, { passive: true });
    onScroll.forEach(fn => fn());

});

// ==========================================
// SCIA DI STELLINE COLORATE DAL CURSORE
// (solo con mouse; disattivata con "riduci movimento")
// ==========================================
(function () {
    const canFine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!canFine || reduce) return;

    const canvas = document.createElement('canvas');
    canvas.id = 'star-trail';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const COLORS = ['#FF7EB6', '#FFD23F', '#5CC8FF', '#B28DFF', '#7DE0A8', '#FF9A5C'];
    const MAX = 140;
    const particles = [];
    let w = 0, h = 0, dpr = 1, running = false;
    let lastX = null, lastY = null, acc = 0;

    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = window.innerWidth; h = window.innerHeight;
        canvas.width = w * dpr; canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    function drawStar(x, y, r, rot) {
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
            const rad = i % 2 === 0 ? r : r * 0.45;
            const a = rot + (Math.PI / 5) * i - Math.PI / 2;
            const px = x + Math.cos(a) * rad, py = y + Math.sin(a) * rad;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
    }

    function spawn(x, y) {
        if (particles.length >= MAX) particles.shift();
        particles.push({
            x: x + (Math.random() - 0.5) * 8,
            y: y + (Math.random() - 0.5) * 8,
            vx: (Math.random() - 0.5) * 1.2,
            vy: Math.random() * 0.8 + 0.3,
            r: Math.random() * 6 + 5,
            rot: Math.random() * Math.PI,
            vr: (Math.random() - 0.5) * 0.12,
            life: 1,
            decay: Math.random() * 0.012 + 0.014,
            color: COLORS[(Math.random() * COLORS.length) | 0]
        });
        if (!running) { running = true; requestAnimationFrame(tick); }
    }

    function tick() {
        ctx.clearRect(0, 0, w, h);
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx; p.y += p.vy; p.vy += 0.03; p.rot += p.vr; p.life -= p.decay;
            if (p.life <= 0) { particles.splice(i, 1); continue; }
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            drawStar(p.x, p.y, p.r * (0.5 + p.life * 0.5), p.rot);
        }
        ctx.globalAlpha = 1;
        if (particles.length) requestAnimationFrame(tick);
        else { running = false; ctx.clearRect(0, 0, w, h); }
    }

    window.addEventListener('mousemove', (e) => {
        if (lastX !== null) {
            acc += Math.hypot(e.clientX - lastX, e.clientY - lastY);
            if (acc > 22) { spawn(e.clientX, e.clientY); acc = 0; }
        }
        lastX = e.clientX; lastY = e.clientY;
    }, { passive: true });
})();