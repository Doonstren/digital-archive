document.addEventListener('DOMContentLoaded', () => {
    /* ========= Мобільне меню ========= */
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const mainNav   = document.querySelector('.main-nav');
    if (menuToggle && mainNav){
      menuToggle.addEventListener('click', ()=> mainNav.classList.toggle('active'));
    }
  
    /* ========= Підсвічування активного пункту ========= */
    const current = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.main-nav a').forEach(link=>{
      const linkPage = link.getAttribute('href');
      if (linkPage === current) link.classList.add('active');
    });
  
    /* ========= Пошук ========= */
    const searchForm = document.querySelector('.search-form');
    if (searchForm){
      searchForm.addEventListener('submit', e=>{
        if (!searchForm.q.value.trim()){
          e.preventDefault();
          alert('Будь ласка, введіть пошуковий запит.');
        }
      });
    }
  
    /* ========= FAQ – розгортання ========= */
    document.querySelectorAll('.faq-item h3').forEach(title=>{
      title.addEventListener('click', ()=>{
        title.parentElement.classList.toggle('open');
      });
    });
  
    /* ========= Заповнення заголовка на search.html ========= */
    if (document.body.id === 'search-page'){
      const params = new URLSearchParams(location.search);
      const q = params.get('q');
      const title = document.getElementById('search-results-title');
      if (q && title) title.textContent = `Результати пошуку: “${decodeURIComponent(q)}”`;
    }
  
    /* ========= Заглушки для кнопок книги ========= */
    document.querySelectorAll('.read-online-btn').forEach(btn=>{
      btn.addEventListener('click', e=>{
        e.preventDefault();
        alert('Функціонал читання онлайн буде реалізовано пізніше.');
      });
    });
  });
  