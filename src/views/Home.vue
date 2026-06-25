<template>
  <div class="home">
    <section class="hero">
      <div class="hero-content">
        <h1 class="hero-title">
          <span class="title-line">WELCOME TO</span>
          <span class="title-line title-accent">KTECH AI</span>
        </h1>
        <p class="hero-subtitle">Building the future, one innovation at a time</p>
        <div class="hero-cta">
          <button class="cyber-btn">EXPLORE</button>
          <button class="cyber-btn cyber-btn-secondary">CONNECT</button>
        </div>
      </div>
      <div class="hero-visual">
        <div class="grid-circle"></div>
        <div class="grid-circle"></div>
        <div class="grid-circle"></div>
      </div>
    </section>
    <section class="features">
      <h2 class="section-title">CAPABILITIES</h2>
      <div class="feature-grid">
        <div class="feature-card" v-for="i in 3" :key="i">
          <div class="feature-icon">◈</div>
          <h3>Module {{ i }}</h3>
          <p>Advanced AI systems integration</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
export default { name: 'Home' }
</script>

<style scoped>
.hero {
  min-height: 80vh; display: flex; align-items: center; padding: 0 5%;
  position: relative;
}
.hero-content { flex: 1; z-index: 2; }
.hero-title {
  font-family: 'Orbitron', monospace; font-size: 4rem; font-weight: 900;
  line-height: 1.1; margin-bottom: 1.5rem;
}
.title-line { display: block; color: #e0e0e0; letter-spacing: 0.2em; }
.title-accent {
  color: #00f0ff; text-shadow: 0 0 30px rgba(0, 240, 255, 0.5);
}
.hero-subtitle {
  font-family: 'Rajdhani', sans-serif; font-size: 1.3rem; color: #888;
  letter-spacing: 0.15em; margin-bottom: 3rem;
}
.hero-cta { display: flex; gap: 1.5rem; }
.cyber-btn {
  font-family: 'Orbitron', monospace; font-size: 0.9rem; font-weight: 600;
  padding: 1rem 2rem; background: transparent; border: 2px solid #00f0ff;
  color: #00f0ff; cursor: pointer; letter-spacing: 0.2em;
  transition: all 0.3s ease; position: relative; overflow: hidden;
}
.cyber-btn:hover {
  background: rgba(0, 240, 255, 0.1);
  box-shadow: 0 0 30px rgba(0, 240, 255, 0.4);
  transform: translateY(-2px);
}
.cyber-btn-secondary { border-color: #ff006e; color: #ff006e; }
.cyber-btn-secondary:hover {
  background: rgba(255, 0, 110, 0.1);
  box-shadow: 0 0 30px rgba(255, 0, 110, 0.4);
}
.hero-visual { flex: 1; position: relative; height: 500px; }
.grid-circle {
  position: absolute; border: 2px solid rgba(0, 240, 255, 0.3);
  border-radius: 50%; animation: rotate 20s linear infinite;
}
.grid-circle:nth-child(1) {
  width: 300px; height: 300px; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
}
.grid-circle:nth-child(2) {
  width: 200px; height: 200px; top: 50%; left: 50%;
  transform: translate(-50%, -50%); animation-direction: reverse;
}
.grid-circle:nth-child(3) {
  width: 100px; height: 100px; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
}
@keyframes rotate {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to { transform: translate(-50%, -50%) rotate(360deg); }
}
.features { padding: 5rem 5%; }
.section-title {
  font-family: 'Orbitron', monospace; font-size: 2rem; font-weight: 700;
  color: #00f0ff; letter-spacing: 0.3em; text-align: center; margin-bottom: 3rem;
}
.feature-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem;
}
.feature-card {
  background: rgba(0, 240, 255, 0.05);
  border: 1px solid rgba(0, 240, 255, 0.2);
  padding: 2rem; text-align: center; transition: all 0.3s ease;
}
.feature-card:hover {
  background: rgba(0, 240, 255, 0.1);
  border-color: rgba(0, 240, 255, 0.5);
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 240, 255, 0.2);
}
.feature-icon { font-size: 2rem; color: #00f0ff; margin-bottom: 1rem; }
.feature-card h3 {
  font-family: 'Orbitron', monospace; font-size: 1.2rem;
  margin-bottom: 0.5rem; color: #e0e0e0;
}
.feature-card p { font-family: 'Rajdhani', sans-serif; color: #888; }
</style>
