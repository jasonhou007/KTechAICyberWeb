<template>
  <div class="app">
    <nav class="cyber-nav">
      <div class="nav-logo">KTECH<span class="accent">.AI</span></div>
      <div class="nav-links">
        <router-link to="/">Home</router-link>
        <router-link to="/about">About</router-link>
      </div>
    </nav>
    <main class="main-content">
      <router-view />
    </main>
    <footer class="cyber-footer">
      <div class="footer-content">
        <div class="footer-text">© 2025 KTech AI. All systems operational.</div>
        <div class="footer-status">
          <span class="status-dot"></span>
          <span>ONLINE</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
export default { name: 'App' }
</script>

<style scoped>
.app { min-height: 100vh; display: flex; flex-direction: column; }
.cyber-nav {
  display: flex; justify-content: space-between; align-items: center;
  padding: 1.5rem 3rem; background: rgba(10, 10, 15, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 240, 255, 0.2);
  position: sticky; top: 0; z-index: 100;
}
.nav-logo {
  font-family: 'Orbitron', monospace; font-size: 1.5rem; font-weight: 700;
  color: #e0e0e0; letter-spacing: 0.2em;
}
.nav-logo .accent { color: #00f0ff; }
.nav-links { display: flex; gap: 2rem; }
.nav-links a {
  font-family: 'Rajdhani', sans-serif; font-size: 1.1rem; font-weight: 500;
  color: #e0e0e0; text-decoration: none; text-transform: uppercase;
  letter-spacing: 0.15em; padding: 0.5rem 1rem;
  border: 1px solid transparent; transition: all 0.3s ease;
}
.nav-links a:hover {
  color: #00f0ff; border-color: rgba(0, 240, 255, 0.3);
  box-shadow: 0 0 20px rgba(0, 240, 255, 0.2);
}
.nav-links a.router-link-active {
  color: #00f0ff; border-color: rgba(0, 240, 255, 0.5);
}
.main-content { flex: 1; }
.cyber-footer {
  padding: 2rem 3rem; background: rgba(10, 10, 15, 0.8);
  border-top: 1px solid rgba(0, 240, 255, 0.2);
}
.footer-content { display: flex; justify-content: space-between; align-items: center; }
.footer-text { font-family: 'Rajdhani', sans-serif; font-size: 0.9rem; color: #888; }
.footer-status { display: flex; align-items: center; gap: 0.5rem; }
.status-dot {
  width: 8px; height: 8px; background: #00f0ff; border-radius: 50%;
  animation: blink 2s ease-in-out infinite;
}
@keyframes blink {
  0%, 100% { opacity: 1; box-shadow: 0 0 10px #00f0ff; }
  50% { opacity: 0.3; box-shadow: none; }
}
</style>
