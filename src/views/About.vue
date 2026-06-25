<template>
  <div class="about">
    <section class="about-hero">
      <h1 class="page-title">ABOUT <span class="accent">KTECH</span></h1>
      <p class="page-subtitle">Innovating at the intersection of AI and humanity</p>
    </section>
    <section class="about-content">
      <div class="content-block">
        <h2>Our Mission</h2>
        <p>KTech is dedicated to building transformative AI solutions that push the boundaries of what's possible.</p>
      </div>
      <div class="stats-grid">
        <div class="stat-item" v-for="stat in stats" :key="stat.label">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  name: 'About',
  data() {
    return {
      stats: [
        { value: '50+', label: 'Projects' },
        { value: '100%', label: 'Commitment' },
        { value: '24/7', label: 'Innovation' }
      ]
    }
  }
}
</script>

<style scoped>
.about-hero {
  padding: 5rem 5%; text-align: center;
  background: rgba(0, 240, 255, 0.05);
  border-bottom: 1px solid rgba(0, 240, 255, 0.2);
}
.page-title {
  font-family: 'Orbitron', monospace; font-size: 3rem; font-weight: 700;
  color: #e0e0e0; letter-spacing: 0.2em; margin-bottom: 1rem;
}
.page-title .accent { color: #00f0ff; }
.page-subtitle {
  font-family: 'Rajdhani', sans-serif; font-size: 1.2rem; color: #888;
}
.about-content { padding: 5rem 5%; max-width: 800px; margin: 0 auto; }
.content-block { margin-bottom: 4rem; }
.content-block h2 {
  font-family: 'Orbitron', monospace; font-size: 1.8rem;
  color: #00f0ff; letter-spacing: 0.15em; margin-bottom: 1.5rem;
}
.content-block p {
  font-family: 'Rajdhani', sans-serif; font-size: 1.1rem;
  line-height: 1.8; color: #aaa;
}
.stats-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem;
}
.stat-item {
  text-align: center; padding: 2rem;
  background: rgba(0, 240, 255, 0.05);
  border: 1px solid rgba(0, 240, 255, 0.2);
}
.stat-value {
  font-family: 'Orbitron', monospace; font-size: 2.5rem; font-weight: 700;
  color: #00f0ff; margin-bottom: 0.5rem;
}
.stat-label {
  font-family: 'Rajdhani', sans-serif; font-size: 1rem; color: #888;
  text-transform: uppercase; letter-spacing: 0.15em;
}
</style>
