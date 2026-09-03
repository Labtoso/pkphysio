(function () {
  try {
    var stored = localStorage.getItem('theme');
    var wantsLight = stored ? stored === 'light' : window.matchMedia('(prefers-color-scheme: light)').matches;
    if (wantsLight) document.documentElement.classList.add('light');
  } catch (e) {}
})();
