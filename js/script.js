document.addEventListener('DOMContentLoaded', async () => {
    let bookDatabase = [];

    try {
        const response = await fetch('books.json');
        if (!response.ok) throw new Error('Network response was not ok');
        bookDatabase = await response.json();
        initializeApp();
    } catch (error) {
        console.error('Could not fetch book database:', error);
        document.body.innerHTML = '<div style="text-align: center; padding-top: 50px;"><h1>Помилка завантаження даних</h1><p>Не вдалося завантажити базу даних книг. Будь ласка, перевірте наявність файлу books.json та оновіть сторінку.</p></div>';
        return;
    }

    function showToast(message) {
        const existingToast = document.querySelector('.toast-notification');
        if(existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 500);
        }, 3000);
    }

    function initializeApp() {
        const themeToggleBtn = document.getElementById('theme-toggle-btn');
        
        const updateThemeIcon = () => {
            if (themeToggleBtn) {
                if (document.documentElement.classList.contains('dark-theme')) {
                    themeToggleBtn.textContent = '☀️';
                } else {
                    themeToggleBtn.textContent = '🌙';
                }
            }
        };

        if (themeToggleBtn) {
            updateThemeIcon(); // Set initial icon
            themeToggleBtn.addEventListener('click', () => {
                document.documentElement.classList.toggle('dark-theme');
                let theme = 'light';
                if (document.documentElement.classList.contains('dark-theme')) {
                    theme = 'dark';
                }
                localStorage.setItem('theme', theme);
                updateThemeIcon();
            });
        }
        
        const currentPath = window.location.pathname.split('/').pop() || 'index.html';

        const menuToggle = document.querySelector('.mobile-menu-toggle');
        const mainNav = document.querySelector('.main-nav');
        if (menuToggle && mainNav) {
            menuToggle.addEventListener('click', () => mainNav.classList.toggle('active'));
        }

        document.querySelectorAll('.search-form').forEach(searchForm => {
            searchForm.addEventListener('submit', (e) => {
                const searchInput = searchForm.querySelector('input[name="q"]');
                if (!searchInput || !searchInput.value.trim()) {
                    e.preventDefault();
                    alert('Будь ласка, введіть пошуковий запит.');
                }
            });
        });
        
        document.querySelectorAll('.accordion-header').forEach(header => {
            header.addEventListener('click', () => {
                header.parentElement.classList.toggle('open');
            });
        });
        
        const renderBookCard = (book) => `
            <article class="book-card" data-id="${book.id}">
                <a href="book.html?id=${book.id}"><img src="${book.coverUrl}" alt="Обкладинка ${book.title}" loading="lazy"></a>
                <h3><a href="book.html?id=${book.id}">${book.title}</a></h3>
                <p class="author">${book.author}</p>
                <a class="btn" href="book.html?id=${book.id}">Детальніше</a>
            </article>`;

        if (currentPath === 'index.html' || currentPath === '') {
            const neuroSearchInputMain = document.getElementById('neuroSearchInputMain');
            const neuroSearchBtnMain = document.getElementById('neuroSearchBtnMain');
            if (neuroSearchBtnMain) {
                const redirectToNeuroLibrarian = (query = "") => {
                    if (query) {
                        localStorage.setItem('neuroQuery', query);
                    }
                    window.location.href = 'neuro_librarian.html';
                };
                neuroSearchBtnMain.addEventListener('click', () => redirectToNeuroLibrarian(neuroSearchInputMain.value));
                neuroSearchInputMain.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') redirectToNeuroLibrarian(neuroSearchInputMain.value);
                });
            }
            
            const carouselContainer = document.getElementById('carousel-container');
            const carouselTrack = document.getElementById('new-arrivals-carousel');
            const prevBtn = document.getElementById('carousel-prev');
            const nextBtn = document.getElementById('carousel-next');

            if (carouselTrack && prevBtn && nextBtn) {
                carouselTrack.innerHTML = bookDatabase.map(renderBookCard).join('');
                
                carouselTrack.querySelectorAll('img').forEach(img => {
                    img.addEventListener('dragstart', (e) => e.preventDefault());
                });

                let currentTranslate = 0;
                let isDown = false;
                let startX;
                let scrollLeft;
                
                function updateCarouselButtons() {
                    const maxTranslate = 0;
                    const minTranslate = carouselContainer.offsetWidth - carouselTrack.scrollWidth;
                    prevBtn.disabled = currentTranslate >= maxTranslate;
                    nextBtn.disabled = currentTranslate <= minTranslate;
                }
                
                function moveCarousel(amount) {
                    const maxTranslate = 0;
                    const minTranslate = carouselContainer.offsetWidth - carouselTrack.scrollWidth;
                    currentTranslate += amount;
                    if (currentTranslate > maxTranslate) currentTranslate = maxTranslate;
                    if (currentTranslate < minTranslate) currentTranslate = minTranslate;
                    carouselTrack.style.transition = 'transform 0.5s ease-out';
                    carouselTrack.style.transform = `translateX(${currentTranslate}px)`;
                    updateCarouselButtons();
                }

                prevBtn.addEventListener('click', () => moveCarousel(236));
                nextBtn.addEventListener('click', () => moveCarousel(-236));

                carouselContainer.addEventListener('mousedown', (e) => {
                    isDown = true;
                    carouselContainer.classList.add('grabbing');
                    startX = e.pageX - carouselContainer.offsetLeft;
                    scrollLeft = currentTranslate;
                    carouselTrack.style.transition = 'none';
                });
                
                const stopDragging = () => {
                    if (!isDown) return;
                    isDown = false;
                    carouselContainer.classList.remove('grabbing');
                    carouselTrack.style.transition = 'transform 0.5s ease-out';
                };

                carouselContainer.addEventListener('mouseleave', stopDragging);
                carouselContainer.addEventListener('mouseup', stopDragging);
                
                carouselContainer.addEventListener('mousemove', (e) => {
                    if (!isDown) return;
                    e.preventDefault();
                    const x = e.pageX - carouselContainer.offsetLeft;
                    const walk = (x - startX);
                    
                    const maxTranslate = 0;
                    const minTranslate = carouselContainer.offsetWidth - carouselTrack.scrollWidth;
                    
                    let newTranslate = scrollLeft + walk;
                    if(newTranslate > maxTranslate) newTranslate = maxTranslate;
                    if(newTranslate < minTranslate) newTranslate = minTranslate;

                    currentTranslate = newTranslate;
                    carouselTrack.style.transform = `translateX(${currentTranslate}px)`;
                    updateCarouselButtons();
                });

                window.addEventListener('resize', updateCarouselButtons);
                updateCarouselButtons();
            }
        }

        if (currentPath === 'search.html') {
            const params = new URLSearchParams(window.location.search);
            const query = params.get('q');
            
            const titleEl = document.getElementById('search-results-title');
            const resultsGrid = document.getElementById('search-results-grid');
            const noResultsDiv = document.getElementById('search-no-results');
            const searchInput = document.getElementById('header-search-input');
            
            if (searchInput) searchInput.value = query || '';
            
            if (!query) {
                if(titleEl) titleEl.textContent = 'Будь ласка, введіть пошуковий запит';
                if(noResultsDiv) noResultsDiv.classList.remove('hidden');
                if(document.getElementById('searched-query-no-results')) document.getElementById('searched-query-no-results').textContent = '...';
                return;
            }
            
            if(titleEl) titleEl.textContent = `Результати пошуку: “${query}”`;
            
            const lowerQuery = query.toLowerCase();
            const foundBooks = bookDatabase.filter(book => 
                book.title.toLowerCase().includes(lowerQuery) ||
                book.author.toLowerCase().includes(lowerQuery)
            );
            
            if (foundBooks.length > 0) {
                if(resultsGrid) resultsGrid.innerHTML = foundBooks.map(renderBookCard).join('');
                if(noResultsDiv) noResultsDiv.classList.add('hidden');
            } else {
                if(resultsGrid) resultsGrid.innerHTML = '';
                const querySpan = document.getElementById('searched-query-no-results');
                if (querySpan) querySpan.textContent = query;
                if(noResultsDiv) noResultsDiv.classList.remove('hidden');
            }
        }

        if (currentPath === 'catalog.html') {
            const bookGrid = document.getElementById('catalog-book-grid');
            const paginationContainer = document.getElementById('pagination-container');
            const booksFoundCount = document.getElementById('books-found-count');
            const categoryList = document.getElementById('category-filter-list');
            const catalogTitle = document.getElementById('catalog-title');

            let currentPage = 1;
            const itemsPerPage = 12;
            let filteredBooks = [...bookDatabase];
            
            const categoryMap = { it: "IT", programming: "Програмування", fiction: "Художня література", 'sci-fi': "Наукова фантастика", dystopia: "Антиутопія", science: "Наука", history: "Історія", fantasy: "Фентезі", psychology: "Психологія", 'self-help': "Саморозвиток", biography: "Біографії", philosophy: "Філософія", classics: "Класика", thriller: "Трилери", ukrainian: "Українська література" };

            const allCategories = [...new Set(bookDatabase.flatMap(b => b.categories))];
            if(categoryList) {
                categoryList.innerHTML = `<li><a href="#" class="filter-category-link active" data-category="all">Всі категорії</a></li>` +
                    allCategories.sort().map(cat => `<li><a href="#" class="filter-category-link" data-category="${cat}">${categoryMap[cat] || cat}</a></li>`).join('');
            }

            const applyFiltersAndRender = () => {
                const category = document.querySelector('.filter-category-link.active')?.dataset.category || 'all';
                const authorQuery = document.getElementById('author-filter').value.toLowerCase();
                const yearFrom = parseInt(document.getElementById('year-from-filter').value) || 0;
                const yearTo = parseInt(document.getElementById('year-to-filter').value) || 9999;
                const sortOrder = document.getElementById('sort-order').value;

                filteredBooks = bookDatabase.filter(book => {
                    const categoryMatch = category === 'all' || book.categories.includes(category);
                    const authorMatch = !authorQuery || book.author.toLowerCase().includes(authorQuery);
                    const yearMatch = book.year >= yearFrom && book.year <= yearTo;
                    return categoryMatch && authorMatch && yearMatch;
                });
                
                switch (sortOrder) {
                    case 'title_asc': filteredBooks.sort((a,b) => a.title.localeCompare(b.title)); break;
                    case 'title_desc': filteredBooks.sort((a,b) => b.title.localeCompare(a.title)); break;
                    case 'year_desc': filteredBooks.sort((a,b) => b.year - a.year); break;
                    case 'year_asc': filteredBooks.sort((a,b) => a.year - b.year); break;
                    case 'popularity': filteredBooks.sort((a,b) => b.votes - a.votes); break;
                }

                currentPage = 1;
                renderPage(currentPage);
            };
            
            const renderPage = (page) => {
                if(booksFoundCount) booksFoundCount.textContent = `Знайдено ${filteredBooks.length} книг`;
                
                const start = (page - 1) * itemsPerPage;
                const end = start + itemsPerPage;
                const paginatedBooks = filteredBooks.slice(start, end);
                
                if(bookGrid) bookGrid.innerHTML = paginatedBooks.map(renderBookCard).join('');
                renderPagination();
            };

            const renderPagination = () => {
                if(!paginationContainer) return;
                const pageCount = Math.ceil(filteredBooks.length / itemsPerPage);
                paginationContainer.innerHTML = '';
                if (pageCount <= 1) return;

                const createButton = (text, pageNum, isDisabled = false, isActive = false) => {
                    const btn = document.createElement('button');
                    btn.textContent = text;
                    if (pageNum) btn.dataset.page = pageNum;
                    if (isDisabled) btn.disabled = true;
                    if (isActive) btn.classList.add('active');
                    return btn;
                };

                paginationContainer.appendChild(createButton('«', currentPage - 1, currentPage === 1));

                let addedEllipsis = false;
                for (let i = 1; i <= pageCount; i++) {
                     if (i === 1 || i === pageCount || (i >= currentPage - 2 && i <= currentPage + 2)) {
                        paginationContainer.appendChild(createButton(i, i, false, i === currentPage));
                        addedEllipsis = false;
                    } else if (!addedEllipsis) {
                        const span = document.createElement('span');
                        span.textContent = '...';
                        paginationContainer.appendChild(span);
                        addedEllipsis = true;
                    }
                }

                paginationContainer.appendChild(createButton('»', currentPage + 1, currentPage === pageCount));
            };
            
            if(paginationContainer) {
                paginationContainer.addEventListener('click', e => {
                    if (e.target.tagName === 'BUTTON' && !e.target.disabled && e.target.dataset.page) {
                        currentPage = parseInt(e.target.dataset.page);
                        renderPage(currentPage);
                        window.scrollTo(0, 0);
                    }
                });
            }
            
            if(categoryList) {
                categoryList.addEventListener('click', e => {
                    e.preventDefault();
                    if (e.target.classList.contains('filter-category-link')) {
                        document.querySelector('.filter-category-link.active')?.classList.remove('active');
                        e.target.classList.add('active');
                        const categoryName = e.target.dataset.category === 'all' ? 'Каталог книг' : `Категорія: ${e.target.textContent}`;
                        if(catalogTitle) catalogTitle.textContent = categoryName;
                        applyFiltersAndRender();
                    }
                });
            }

            document.getElementById('apply-filters-btn')?.addEventListener('click', applyFiltersAndRender);
            
            document.getElementById('reset-filters-btn')?.addEventListener('click', () => {
                document.querySelector('.filter-category-link.active')?.classList.remove('active');
                const allCatLink = document.querySelector('.filter-category-link[data-category="all"]');
                if(allCatLink) allCatLink.classList.add('active');
                document.getElementById('author-filter').value = '';
                document.getElementById('year-from-filter').value = '';
                document.getElementById('year-to-filter').value = '';
                document.getElementById('sort-order').value = 'popularity';
                if(catalogTitle) catalogTitle.textContent = 'Каталог книг';
                applyFiltersAndRender();
            });
            
            applyFiltersAndRender();
        }

        if (currentPath === 'book.html') {
            const params = new URLSearchParams(window.location.search);
            const bookId = params.get('id');
            const book = bookDatabase.find(b => b.id === bookId);
            
            const contentDiv = document.getElementById('book-page-content');
            const notFoundDiv = document.getElementById('book-not-found');

            if (book) {
                if(contentDiv) contentDiv.style.display = 'block';
                if(notFoundDiv) notFoundDiv.style.display = 'none';

                document.title = `${book.title} – «Цифровий Архів»`;
                document.getElementById('breadcrumb-book-title').textContent = book.title;
                document.getElementById('book-main-title').textContent = book.title;
                document.getElementById('book-author-link').textContent = book.author;
                document.getElementById('book-author-link').href = `search.html?q=${encodeURIComponent(book.author)}`;
                document.getElementById('book-cover-img').src = book.coverUrl;
                document.getElementById('book-cover-img').alt = `Обкладинка книги ${book.title}`;
                document.getElementById('book-rating-value').textContent = book.rating;
                document.getElementById('book-rating-votes').textContent = book.votes;
                document.getElementById('book-publisher').textContent = book.publisher;
                document.getElementById('book-year').textContent = book.year;
                document.getElementById('book-language').textContent = book.language;
                document.getElementById('book-pages').textContent = book.pages;
                document.getElementById('book-annotation-text').innerHTML = `<p>${book.annotation.replace(/\n/g, '</p><p>')}</p>`;
                
                const categoryMap = { it: "IT", programming: "Програмування", fiction: "Художня література", 'sci-fi': "Наукова фантастика", dystopia: "Антиутопія", science: "Наука", history: "Історія", fantasy: "Фентезі", psychology: "Психологія", 'self-help': "Саморозвиток", biography: "Біографії", philosophy: "Філософія", classics: "Класика", thriller: "Трилери", ukrainian: "Українська література" };
                const genreTagsContainer = document.getElementById('book-genre-tags');
                if (genreTagsContainer) {
                    genreTagsContainer.innerHTML = book.categories.map(cat => `<a href="catalog.html?category=${cat}">${categoryMap[cat] || cat}</a>`).join(' ');
                }

                const actionsContainer = document.getElementById('book-actions-container');
                if(actionsContainer && book.filePathPDF) {
                    actionsContainer.innerHTML = '';
                    actionsContainer.innerHTML += `<a class="btn" href="reader.html?id=${book.id}">Читати онлайн</a>`;
                    actionsContainer.innerHTML += `<a class="btn btn-secondary" href="${book.filePathPDF}" download>Завантажити PDF</a>`;
                }

                const similarBooksGrid = document.getElementById('similar-books-grid');
                if (similarBooksGrid) {
                    const similarBooks = bookDatabase.filter(otherBook =>
                        otherBook.id !== book.id &&
                        otherBook.categories.some(cat => book.categories.includes(cat))
                    ).slice(0, 4);

                    if (similarBooks.length > 0) {
                        similarBooksGrid.innerHTML = similarBooks.map(renderBookCard).join('');
                    } else {
                        similarBooksGrid.innerHTML = "<p>Схожих книг не знайдено.</p>";
                    }
                }
            } else {
                if(contentDiv) contentDiv.style.display = 'none';
                if(notFoundDiv) notFoundDiv.style.display = 'block';
            }

            const reviewForm = document.getElementById('reviewForm');
            reviewForm?.addEventListener('submit', (e) => {
                e.preventDefault();
                alert('Дякуємо за ваш відгук! (симуляція)');
                reviewForm.reset();
            });
        }
        
        if (currentPath === 'profile.html') {
            const showLoginBtn = document.getElementById('show-login');
            const showRegisterBtn = document.getElementById('show-register');
            const loginForm = document.getElementById('login-form');
            const registerForm = document.getElementById('register-form');

            if (showLoginBtn && showRegisterBtn && loginForm && registerForm) {
                showLoginBtn.addEventListener('click', () => {
                    loginForm.classList.remove('hidden');
                    registerForm.classList.add('hidden');
                    showLoginBtn.classList.add('active');
                    showRegisterBtn.classList.remove('active');
                });

                showRegisterBtn.addEventListener('click', () => {
                    loginForm.classList.add('hidden');
                    registerForm.classList.remove('hidden');
                    showLoginBtn.classList.remove('active');
                    showRegisterBtn.classList.add('active');
                });
                
                const loginMessage = document.getElementById('login-message');
                loginForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    loginMessage.textContent = 'Обробка...';
                    loginMessage.className = 'form-message';
                    await new Promise(res => setTimeout(res, 500));
                    loginMessage.textContent = 'Вхід успішний! Перенаправлення...';
                    loginMessage.classList.add('success');
                    setTimeout(() => window.location.href = 'index.html', 1500);
                });
                
                const registerMessage = document.getElementById('register-message');
                registerForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    registerMessage.textContent = 'Реєстрація...';
                    registerMessage.className = 'form-message';
                    if (registerForm.registerPassword.value !== registerForm.registerPasswordConfirm.value) {
                        registerMessage.textContent = 'Паролі не співпадають.';
                        registerMessage.classList.add('error');
                        return;
                    }
                    await new Promise(res => setTimeout(res, 500));
                    registerMessage.textContent = 'Реєстрація успішна! Тепер ви можете увійти.';
                    registerMessage.classList.add('success');
                    registerForm.reset();
                    setTimeout(() => showLoginBtn.click(), 1500);
                });
            }
        }
        
        if (currentPath === 'contact.html') {
            const contactForm = document.getElementById('contactForm');
            const formMessage = document.getElementById('contactFormMessage');
            if (contactForm && formMessage) {
                contactForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    formMessage.textContent = 'Надсилання...';
                    formMessage.className = 'form-message';
                    await new Promise(res => setTimeout(res, 1000));
                    formMessage.textContent = 'Ваше повідомлення успішно надіслано!';
                    formMessage.classList.add('success');
                    contactForm.reset();
                });
            }
        }

        if (currentPath === 'neuro_librarian.html') {
            const chatMessages = document.getElementById('chatMessages');
            const chatInput = document.getElementById('chatInput');
            const sendMessageBtn = document.getElementById('sendMessageBtn');
            const vercelProxyUrl = 'https://digital-archive-proxy-doonstrens-projects.vercel.app/api/gemini';
            
            const bookContextString = JSON.stringify(bookDatabase.map(b => ({
                id: b.id,
                title: b.title,
                author: b.author,
                annotation: b.annotation,
                categories: b.categories
            })));

            const systemInstruction = {
                role: 'user',
                parts: [{ text: `You are a creative and conversational Ukrainian-speaking library assistant named "Нейро-Бібліотекар". Your task is to analyze the user's request, the provided chat history, and the book database. Your response MUST be a valid JSON object. This is the list of available books in JSON format: ${bookContextString}. RULES: 1. If you find relevant books, your response MUST be a JSON object with a "recommendations" key. The value should be an array of objects. Each object MUST contain two keys: - "id": The ID of the book from the provided list. - "recommendation_text": A NEW, ORIGINAL, and engaging description (2-4 sentences in Ukrainian) explaining WHY this book is a good match for the user's request. DO NOT simply copy the annotation. Be creative, like a real librarian giving a personal recommendation. 2. If you cannot find any relevant books, or if the user is just greeting you or asking a general question, your response MUST be a JSON object with a "conversation" key. The value should be a friendly, helpful message in Ukrainian.` }]
            };
            
            let chatHistory = [];

            const addMessageToChat = (text, sender, isHtml = false) => {
                const messageDiv = document.createElement('div');
                messageDiv.classList.add('message', `${sender}-message`);
                if (isHtml) {
                    messageDiv.innerHTML = text;
                } else {
                    messageDiv.appendChild(document.createTextNode(text));
                }
                chatMessages.appendChild(messageDiv);
                chatMessages.scrollTop = chatMessages.scrollHeight;
                return messageDiv;
            };
            
            const createBookCardForChat = (book, recommendationText) => {
                if (!book) return '';
                return `
                    <div class="book-card-chat">
                        <img src="${book.coverUrl}" alt="${book.title}">
                        <h4>${book.title}</h4>
                        <p><strong>Автор:</strong> ${book.author}</p>
                        <p>${recommendationText}</p> 
                        <a href="book.html?id=${book.id}" class="btn" target="_blank">Детальніше</a>
                    </div>`;
            };

            const handleSendMessage = async () => {
                const userText = chatInput.value.trim();
                if (!userText) return;

                addMessageToChat(userText, 'user');
                chatInput.value = '';
                sendMessageBtn.disabled = true;
                
                chatHistory.push({ role: 'user', parts: [{ text: userText }] });

                const loadingMessage = addMessageToChat('Аналізую ваш запит...', 'ai');
                
                try {
                    const payload = {
                        history: [systemInstruction, ...chatHistory]
                    };
                    
                    const response = await fetch(vercelProxyUrl, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify(payload)
                    });
                    
                    if (!response.ok) throw new Error(`HTTP помилка! Статус: ${response.status}`);
                    
                    const jsonResponse = await response.json();
                    loadingMessage.remove();
                    
                    let aiResponseTextForHistory = "";
                    
                    if (jsonResponse.recommendations && Array.isArray(jsonResponse.recommendations)) {
                        let introductoryMessage = "Гаразд, я переглянув наші архіви і думаю, що вам може сподобатися ось це:";
                        if (jsonResponse.recommendations.length > 1) {
                           introductoryMessage = "Я знайшов кілька варіантів, які можуть вас зацікавити:";
                        }
                        addMessageToChat(introductoryMessage, 'ai');
                        aiResponseTextForHistory += introductoryMessage;

                        let responseHtml = '';
                        jsonResponse.recommendations.forEach(rec => {
                            const book = bookDatabase.find(b => b.id === rec.id);
                            if (book) {
                                responseHtml += createBookCardForChat(book, rec.recommendation_text);
                                aiResponseTextForHistory += `\nРекомендую '${book.title}': ${rec.recommendation_text}`;
                            }
                        });
                        if (responseHtml) {
                            addMessageToChat(responseHtml, 'ai', true);
                        }
                    } else if (jsonResponse.conversation) {
                        addMessageToChat(jsonResponse.conversation, 'ai');
                        aiResponseTextForHistory = jsonResponse.conversation;
                    } else {
                        throw new Error("Невідома структура відповіді від AI.");
                    }
                    
                    chatHistory.push({
                        role: 'model',
                        parts: [{ text: aiResponseTextForHistory }]
                    });

                } catch (error) {
                    loadingMessage.remove();
                    addMessageToChat(`Вибачте, сталася помилка. Спробуйте, будь ласка, пізніше. (${error.message})`, 'ai');
                    console.error('Error fetching from Gemini proxy:', error);
                    chatHistory.pop();
                }

                sendMessageBtn.disabled = false;
                chatInput.focus();
            };

            sendMessageBtn.addEventListener('click', handleSendMessage);
            chatInput.addEventListener('keypress', (e) => e.key === 'Enter' && handleSendMessage());

            const initialQuery = localStorage.getItem('neuroQuery');
            if (initialQuery) {
                chatInput.value = initialQuery;
                localStorage.removeItem('neuroQuery');
                handleSendMessage();
            }
        }
        
        if (currentPath === 'reader.html') {
            const params = new URLSearchParams(window.location.search);
            const bookId = params.get('id');
            const book = bookDatabase.find(b => b.id === bookId);

            const titleHeader = document.getElementById('book-title-header');
            const loader = document.getElementById('loader');
            const bookmarkBtn = document.getElementById('bookmark-btn');
            
            if (book && book.filePathPDF) {
                document.title = `${book.title} – Читалка`;
                if(titleHeader) titleHeader.textContent = book.title;
                
                const lastPageKey = `lastPage_${book.id}`;
                const primaryBookmarkKey = `primaryBookmark_${book.id}`;

                pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js`;

                let pdfDoc = null,
                    pageNum = 1,
                    pageRendering = false,
                    pageNumPending = null;

                const viewer = document.getElementById('pdf-viewer');
                const pageNumEl = document.getElementById('page-num');
                const pageCountEl = document.getElementById('page-count');

                function renderPage(num) {
                    pageRendering = true;
                    pdfDoc.getPage(num).then(function(page) {
                        const viewport = page.getViewport({ scale: 1.5 });
                        
                        const pageContainer = document.createElement('div');
                        pageContainer.className = 'pdf-page-container';
                        pageContainer.style.width = viewport.width + 'px';
                        pageContainer.style.height = viewport.height + 'px';

                        const canvas = document.createElement('canvas');
                        canvas.height = viewport.height;
                        canvas.width = viewport.width;

                        const textLayerDiv = document.createElement('div');
                        textLayerDiv.className = 'textLayer';

                        pageContainer.appendChild(canvas);
                        pageContainer.appendChild(textLayerDiv);
                        if(viewer) {
                            viewer.innerHTML = '';
                            viewer.appendChild(pageContainer);
                        }
                        
                        const context = canvas.getContext('2d');
                        const renderContext = { canvasContext: context, viewport: viewport };
                        
                        const renderTask = page.render(renderContext);

                        renderTask.promise.then(() => {
                             return page.getTextContent();
                        }).then((textContent) => {
                            pdfjsLib.renderTextLayer({
                                textContent: textContent,
                                container: textLayerDiv,
                                viewport: viewport,
                                textDivs: []
                            });

                            pageRendering = false;
                            if (pageNumPending !== null) {
                                renderPage(pageNumPending);
                                pageNumPending = null;
                            }
                        });
                    });
                    
                    if (pageNumEl) pageNumEl.textContent = num;
                    
                    if (bookmarkBtn) {
                        const primaryBookmark = parseInt(localStorage.getItem(primaryBookmarkKey) || '0');
                        bookmarkBtn.classList.toggle('active', num === primaryBookmark);
                    }
                }

                function queueRenderPage(num) {
                    if (pageRendering) {
                        pageNumPending = num;
                    } else {
                        renderPage(num);
                    }
                }

                document.getElementById('prev-page')?.addEventListener('click', () => {
                    if (pageNum <= 1) return;
                    pageNum--;
                    localStorage.setItem(lastPageKey, pageNum);
                    queueRenderPage(pageNum);
                });

                document.getElementById('next-page')?.addEventListener('click', () => {
                    if (pageNum >= pdfDoc.numPages) return;
                    pageNum++;
                    localStorage.setItem(lastPageKey, pageNum);
                    queueRenderPage(pageNum);
                });
                
                if (bookmarkBtn) {
                    bookmarkBtn.addEventListener('click', () => {
                        let primaryBookmark = parseInt(localStorage.getItem(primaryBookmarkKey) || '0');
                        
                        if (primaryBookmark === pageNum) {
                            localStorage.removeItem(primaryBookmarkKey);
                            showToast(`Закладку на сторінці ${pageNum} видалено`);
                            bookmarkBtn.classList.remove('active');
                        } else {
                            localStorage.setItem(primaryBookmarkKey, pageNum);
                            showToast(`Закладку на сторінці ${pageNum} збережено`);
                            bookmarkBtn.classList.add('active');
                        }
                    });
                }

                pdfjsLib.getDocument(book.filePathPDF).promise.then(function(pdfDoc_) {
                    pdfDoc = pdfDoc_;
                    if (pageCountEl) pageCountEl.textContent = pdfDoc.numPages;
                    
                    const savedBookmark = parseInt(localStorage.getItem(primaryBookmarkKey), 10);
                    const savedPage = parseInt(localStorage.getItem(lastPageKey), 10);

                    if (savedBookmark && savedBookmark > 0 && savedBookmark <= pdfDoc.numPages) {
                        pageNum = savedBookmark;
                        showToast(`Відкрито на закладці, сторінка ${pageNum}`);
                    } else if (savedPage && savedPage > 0 && savedPage <= pdfDoc.numPages) {
                        pageNum = savedPage;
                        showToast(`Відкрито на збереженій сторінці ${pageNum}`);
                    }
                    
                    if (loader) loader.style.display = 'none';
                    renderPage(pageNum);
                }).catch(function(error) {
                    console.error('Error loading PDF:', error);
                    if (loader) loader.textContent = 'Помилка завантаження PDF-файлу.';
                });

            } else {
                if (loader) loader.textContent = 'Помилка: файл книги не знайдено.';
            }
        }
    }
});