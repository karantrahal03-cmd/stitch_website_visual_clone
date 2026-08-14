
  // Check auth immediately
  async function requireAuth() {
    if (localStorage.getItem('admin_auth') === 'true') return;
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) {
        window.location.href = 'login.html';
      }
    } catch(e) {
      window.location.href = 'login.html';
    }
  }
  requireAuth();

  // Listen to auth changes
  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (localStorage.getItem('admin_auth') === 'true') return;
    if (event === 'SIGNED_OUT' || !session) {
      window.location.href = 'login.html';
    }
  });

  function handleLogout() {
    localStorage.removeItem('admin_auth');
    supabaseClient.auth.signOut().finally(() => {
      window.location.href = 'login.html';
    });
  }
