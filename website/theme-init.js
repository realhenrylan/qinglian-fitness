// 防止深色模式闪烁：在 CSS 加载前就应用主题
    (function() {
      try {
        var t = JSON.parse(localStorage.getItem('ql_theme')) || 'auto';
        var dark = t === 'dark' || (t === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
        document.documentElement.dataset.theme = dark ? 'dark' : 'light';
      } catch(e) { document.documentElement.dataset.theme = 'light'; }
    })();
