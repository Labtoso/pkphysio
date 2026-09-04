(function () {
  try {
    var nav = sessionStorage.getItem('pk_admin_nav');
    if (nav) sessionStorage.removeItem('pk_admin_nav');
    if (!nav || !sessionStorage.getItem('pk_admin_token')) {
      window.location.href = '../';
    }
  } catch (e) {
    window.location.href = '../';
  }
})();
