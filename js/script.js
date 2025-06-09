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
                
                const categoryMap = { it: "IT", programming: "Програмування", fiction: "Художня література", 'sci-fi': "Наукова фантастика", dystopia: "Антиутопія", science: "Наука", history: "Історія", fantasy: "Фентезі", psychology: "Психологія", 'self-help': "Саморозвиток", biography: "Біографії", philosophy: "Філософія", classics: "Класика", thriller: "Трилери", ukrainian: "Українська література" };
                const genreTagsContainer = document.getElementById('book-genre-tags');
                if (genreTagsContainer) {
                    genreTagsContainer.innerHTML = book.categories.map(cat => `<a href="catalog.html?category=${cat}">${categoryMap[cat] || cat}</a>`).join(' ');
                }

                const actionsContainer = document.getElementById('book-actions-container');
                if(actionsContainer && book.filePathPDF) {
                    actionsContainer.innerHTML = '';
                    actionsContainer.innerHTML += `<a class="btn" href="reader.html?bookId=${book.id}">Читати онлайн</a>`;
                    actionsContainer.innerHTML += `<a class="btn btn-secondary" href="${book.filePathPDF}" download>Завантажити PDF</a>`;
                }

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
        
        if (currentPath === 'reader.html') {
            const params = new URLSearchParams(window.location.search);
            const bookId = params.get('bookId');
            const book = bookDatabase.find(b => b.id === bookId);

            const titleHeader = document.getElementById('book-title-header');
            const loader = document.getElementById('loader');
            const bookmarkBtn = document.getElementById('bookmark-btn');
            
            let bookmarkedPages = JSON.parse(sessionStorage.getItem(bookId) || '[]');
            
            if (bookmarkBtn) {
                bookmarkBtn.addEventListener('click', (e) => {
                    const btn = e.currentTarget;
                    const pageNum = parseInt(document.getElementById('page-num').textContent);
                    if (!pageNum) return;

                    const index = bookmarkedPages.indexOf(pageNum);

                    if (index > -1) {
                        bookmarkedPages.splice(index, 1);
                        btn.classList.remove('active');
                        showToast('Закладку видалено.');
                    } else {
                        bookmarkedPages.push(pageNum);
                        btn.classList.add('active');
                        showToast('Закладку додано!');
                    }
                    sessionStorage.setItem(bookId, JSON.stringify(bookmarkedPages));
                });
            }

            if (book && book.filePathPDF) {
                document.title = `${book.title} – Читалка`;
                if(titleHeader) titleHeader.textContent = book.title;
                
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
                        if(bookmarkedPages.includes(num)) {
                           bookmarkBtn.classList.add('active');
                        } else {
                           bookmarkBtn.classList.remove('active');
                        }
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
                    queueRenderPage(pageNum);
                });

                document.getElementById('next-page')?.addEventListener('click', () => {
                    if (pageNum >= pdfDoc.numPages) return;
                    pageNum++;
                    queueRenderPage(pageNum);
                });

                pdfjsLib.getDocument(book.filePathPDF).promise.then(function(pdfDoc_) {
                    pdfDoc = pdfDoc_;
                    if (pageCountEl) pageCountEl.textContent = pdfDoc.numPages;
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