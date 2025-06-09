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
            
            const carouselTrack = document.getElementById('new-arrivals-carousel');
            const prevBtn = document.getElementById('carousel-prev');
            const nextBtn = document.getElementById('carousel-next');

            if (carouselTrack && prevBtn && nextBtn) {
                carouselTrack.innerHTML = bookDatabase.map(renderBookCard).join('');
                let currentIndex = 0;
                const cardWidth = 220; // width of .book-card
                const gap = 24; // 1.5rem gap
                const scrollAmount = cardWidth + gap;

                function updateCarousel() {
                    carouselTrack.style.transform = `translateX(-${currentIndex * scrollAmount}px)`;
                    prevBtn.disabled = currentIndex === 0;
                    
                    const containerWidth = carouselTrack.parentElement.offsetWidth;
                    const trackWidth = carouselTrack.scrollWidth;
                    const currentPosition = currentIndex * scrollAmount;
                    
                    nextBtn.disabled = (currentPosition + containerWidth) >= trackWidth;
                }

                prevBtn.addEventListener('click', () => {
                    if (currentIndex > 0) {
                        currentIndex--;
                        updateCarousel();
                    }
                });

                nextBtn.addEventListener('click', () => {
                     const containerWidth = carouselTrack.parentElement.offsetWidth;
                     const trackWidth = carouselTrack.scrollWidth;
                     const currentPosition = currentIndex * scrollAmount;
                     if((currentPosition + containerWidth) < trackWidth){
                        currentIndex++;
                        updateCarousel();
                     }
                });

                window.addEventListener('resize', updateCarousel);
                updateCarousel();
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

        // Остальной код (neuro_librarian, book.html, reader.html, etc.) остается без изменений
        if (currentPath === 'neuro_librarian.html') {
            const chatMessages = document.getElementById('chatMessages');
            const chatInput = document.getElementById('chatInput');
            const sendMessageBtn = document.getElementById('sendMessageBtn');
            const vercelProxyUrl = 'https://digital-archive-proxy-doonstrens-projects.vercel.app/api/gemini';

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
            
            const constructGeminiPrompt = (userQuery) => {
                const bookContextString = JSON.stringify(bookDatabase.map(b => ({
                    id: b.id,
                    title: b.title,
                    author: b.author,
                    annotation: b.annotation,
                    categories: b.categories
                })));

                return `You are a creative and conversational Ukrainian-speaking library assistant named "Нейро-Бібліотекар". Your task is to analyze the user's request and the provided book database. Your response MUST be a valid JSON object. This is the list of available books in JSON format: ${bookContextString} The user's request is: "${userQuery}" RULES: 1. If you find relevant books, your response MUST be a JSON object with a "recommendations" key. The value should be an array of objects. Each object MUST contain two keys: - "id": The ID of the book from the provided list. - "recommendation_text": A NEW, ORIGINAL, and engaging description (2-4 sentences in Ukrainian) explaining WHY this book is a good match for the user's request. DO NOT simply copy the annotation. Be creative, like a real librarian giving a personal recommendation. Example: {"recommendations": [{"id": "dune", "recommendation_text": "Оскільки ви шукали епічну фантастику, 'Дюна' – це саме те, що треба! Це не просто книга, а цілий всесвіт з глибокою політикою, філософією та незабутньою атмосферою пустельної планети. Вона змусить вас замислитись."}]} 2. If you cannot find any relevant books, or if the user is just greeting you or asking a general question, your response MUST be a JSON object with a "conversation" key. The value should be a friendly, helpful message in Ukrainian. Example: {"conversation": "Вітаю! Радий допомогти вам у пошуку ідеальної книги. Що вас цікавить сьогодні?"}`;
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
                        let introductoryMessage = "Гаразд, я переглянув наші архіви і думаю, що вам може сподобатися ось це:";
                        if (jsonResponse.recommendations.length > 1) {
                           introductoryMessage = "Я знайшов кілька варіантів, які можуть вас зацікавити:";
                        }
                        addMessageToChat(introductoryMessage, 'ai');

                        let responseHtml = '';
                        jsonResponse.recommendations.forEach(rec => {
                            const book = bookDatabase.find(b => b.id === rec.id);
                            if (book) {
                                responseHtml += createBookCardForChat(book, rec.recommendation_text);
                            }
                        });
                        if (responseHtml) {
                            addMessageToChat(responseHtml, 'ai', true);
                        }
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
    }
});