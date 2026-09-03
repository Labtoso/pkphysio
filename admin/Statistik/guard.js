(function () {
  try {
    if (!sessionStorage.getItem('pk_admin_token')) {
      window.location.href = '../';
    }
  } catch (e) {
    window.location.href = '../';
  }
})();
