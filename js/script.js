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

    function initializeApp() {
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
        
        const faqItems = document.querySelectorAll('.faq-item');
        faqItems.forEach(item => {
            const header = item.querySelector('h3');
            if(header) {
                header.addEventListener('click', () => {
                    item.classList.toggle('open');
                });
            }
        });
        
        const renderBookCard = (book) => `
            <article class="book-card" data-id="${book.id}">
                <a href="book.html?id=${book.id}"><img src="${book.coverUrl}" alt="Обкладинка ${book.title}" loading="lazy"></a>
                <h3><a href="book.html?id=${book.id}">${book.title}</a></h3>
                <p class="author">${book.author}</p>
                <a class="btn" href="book.html?id=${book.id}">Детальніше</a>
            </article>`;

        if (currentPath === 'index.html') {
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
            
            const newArrivalsGrid = document.getElementById('new-arrivals-grid');
            if (newArrivalsGrid) {
                const newBooks = [...bookDatabase].sort((a, b) => b.votes - a.votes).slice(0, 4);
                newArrivalsGrid.innerHTML = newBooks.map(renderBookCard).join('');
            }
        }

        if (currentPath === 'neuro_librarian.html') {
            const chatMessages = document.getElementById('chatMessages');
            const chatInput = document.getElementById('chatInput');
            const sendMessageBtn = document.getElementById('sendMessageBtn');
            const vercelProxyUrl = 'https://digital-archive-proxy-doonstrens-projects.vercel.app/'; 

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
            
            const createBookCardForChat = (book) => {
                if (!book) return '';
                return `
                    <div class="book-card-chat">
                        <img src="${book.coverUrl}" alt="${book.title}">
                        <h4>${book.title}</h4>
                        <p><strong>Автор:</strong> ${book.author}</p>
                        <p>${book.annotation.substring(0, 80)}...</p>
                        <a href="book.html?id=${book.id}" class="btn" target="_blank">Детальніше</a>
                    </div>`;
            };

            const constructGeminiPrompt = (userQuery) => {
                const bookContextString = JSON.stringify(bookDatabase.map(b => ({
                    id: b.id,
                    title: b.title,
                    author: b.author,
                    annotation: b.annotation,
                    categories: b.categories
                })));

                return `You are a helpful Ukrainian-speaking library assistant named "Нейро-Бібліотекар".
                Your task is to analyze the user's request and the provided book database.
                Your response MUST be a valid JSON object.

                This is the list of available books in JSON format:
                ${bookContextString}

                The user's request is: "${userQuery}"

                RULES:
                1. If you can find relevant books, your response MUST be a JSON object with a "recommendations" key. The value should be an array of objects, where each object has an "id" (from the book list) and a "comment" (your short reason for the recommendation in Ukrainian).
                   Example: {"recommendations": [{"id": "clean-code", "comment": "Це чудова книга для програмістів."}]}
                2. If you cannot find any relevant books, or if the user's request is just a greeting or a general question, your response MUST be a JSON object with a "conversation" key. The value should be a friendly, helpful message in Ukrainian.
                   Example for no books found: {"conversation": "На жаль, я не знайшов нічого схожого. Можете уточнити запит?"}
                   Example for a greeting: {"conversation": "Вітаю! Чим можу допомогти?"}
                `;
            };

            const handleSendMessage = async () => {
                const userText = chatInput.value.trim();
                if (!userText) return;

                addMessageToChat(userText, 'user');
                chatInput.value = '';
                sendMessageBtn.disabled = true;

                const loadingMessage = addMessageToChat('Аналізую ваш запит...', 'ai');
                const prompt = constructGeminiPrompt(userText);

                try {
                    const response = await fetch(vercelProxyUrl, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ prompt: prompt })
                    });
                    
                    if (!response.ok) throw new Error(`HTTP помилка! Статус: ${response.status}`);
                    
                    const jsonResponse = await response.json();
                    loadingMessage.remove();

                    if (jsonResponse.recommendations && Array.isArray(jsonResponse.recommendations)) {
                        let responseHtml = `<p>Ось що я знайшов для вас:</p>`;
                        jsonResponse.recommendations.forEach(rec => {
                            const book = bookDatabase.find(b => b.id === rec.id);
                            if (book) {
                                if (rec.comment) {
                                    responseHtml += `<p><em>«${rec.comment}»</em></p>`;
                                }
                                responseHtml += createBookCardForChat(book);
                            }
                        });
                        addMessageToChat(responseHtml, 'ai', true);
                    } else if (jsonResponse.conversation) {
                        addMessageToChat(jsonResponse.conversation, 'ai');
                    } else {
                        throw new Error("Невідома структура відповіді від AI.");
                    }

                } catch (error) {
                    loadingMessage.remove();
                    addMessageToChat(`Вибачте, сталася помилка. Спробуйте, будь ласка, пізніше. (${error.message})`, 'ai');
                    console.error('Error fetching from Gemini proxy:', error);
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
        
        // ... (остальной код script.js остается без изменений) ...
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
                document.getElementById('book-rating-value').textContent = book.rating;
                document.getElementById('book-rating-votes').textContent = book.votes;
                document.getElementById('book-publisher').textContent = book.publisher;
                document.getElementById('book-year').textContent = book.year;
                document.getElementById('book-language').textContent = book.language;
                document.getElementById('book-pages').textContent = book.pages;
                document.getElementById('book-annotation-text').innerHTML = `<p>${book.annotation.replace(/\n/g, '</p><p>')}</p>`;
                document.getElementById('book-cover-img').src = book.coverUrl;
                document.getElementById('book-cover-img').alt = `Обкладинка ${book.title}`;
                document.getElementById('book-formats-list').textContent = book.formats;

                const categoryMap = { it: "IT", programming: "Програмування", fiction: "Художня література", 'sci-fi': "Наукова фантастика", dystopia: "Антиутопія", science: "Наука", history: "Історія", fantasy: "Фентезі", psychology: "Психологія", 'self-help': "Саморозвиток", biography: "Біографії", philosophy: "Філософія", classics: "Класика", thriller: "Трилери", ukrainian: "Українська література" };
                const genreTagsContainer = document.getElementById('book-genre-tags');
                genreTagsContainer.innerHTML = book.categories.map(cat => `<a href="catalog.html?category=${cat}">${categoryMap[cat] || cat}</a>`).join(' ');

                const similarBooksGrid = document.getElementById('similar-books-grid');
                const similarBooks = bookDatabase
                    .filter(b => b.id !== book.id && b.categories.some(cat => book.categories.includes(cat)))
                    .slice(0, 4);
                if (similarBooksGrid) {
                    similarBooksGrid.innerHTML = similarBooks.map(renderBookCard).join('');
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
        
        if(currentPath === 'search.html') {
            const params = new URLSearchParams(window.location.search);
            const query = params.get('q');
            
            const titleEl = document.getElementById('search-results-title');
            const resultsGrid = document.getElementById('search-results-grid');
            const noResultsDiv = document.getElementById('search-no-results');
            const searchInput = document.getElementById('header-search-input');
            
            if (searchInput) searchInput.value = query || '';
            
            if (!query) {
                if(titleEl) titleEl.textContent = 'Будь ласка, введіть пошуковий запит';
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

        if (currentPath === 'contact.html') {
            const contactForm = document.getElementById('contactForm');
            if (contactForm) {
                contactForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const msgEl = document.getElementById('contactFormMessage');
                    if(msgEl) {
                        msgEl.textContent = 'Відправлення...';
                        msgEl.className = 'form-message';
                        await new Promise(res => setTimeout(res, 500));
                        msgEl.textContent = 'Дякуємо! Ваше повідомлення надіслано.';
                        msgEl.classList.add('success');
                    }
                    contactForm.reset();
                });
            }
        }
    }
});