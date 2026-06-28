<template>
  <div class="about" ref="rootRef" :data-parallax="enabled ? 'on' : null">
    <!-- Animated background -->
    <div class="grid-bg"></div>
    <div class="grid-bg grid-bg-2"></div>

    <!-- Hero Section -->
    <section class="about-hero">
      <div class="hero-content">
        <h1 class="page-title neon-text glitch-text" :data-text="t('about.pageTitle')">
          {{ t('about.pageTitle') }} <span class="accent">{{ t('about.pageTitleAccent') }}</span>
        </h1>
        <p class="page-subtitle">{{ t('about.pageSubtitle') }}</p>
        <!-- Hero figure: official-site imagery, eager-loaded (above the fold) -->
        <figure class="about-hero__figure">
          <CyberImage
            src="/images/about/about-who-we-are.webp"
            :alt="t('about.hero.imageAlt')"
            eager
          />
        </figure>
      </div>
    </section>

    <!-- Who We Are Section -->
    <section class="section who-we-are">
      <div class="container">
        <h2 class="section-title neon-text">{{ t('about.whoWeAre.title') }}</h2>
        <div class="content-grid">
          <div class="content-card cyber-card">
            <div class="card-icon neon-border">🏢</div>
            <h3>{{ t('about.whoWeAre.companyName') }}</h3>
            <p>{{ t('about.whoWeAre.companyInfo') }}</p>
          </div>
          <div class="content-card cyber-card">
            <div class="card-icon neon-border">🌏</div>
            <h3>{{ t('about.whoWeAre.parentCompany') }}</h3>
            <p>{{ t('about.whoWeAre.parentInfo') }}</p>
          </div>
          <div class="content-card cyber-card">
            <div class="card-icon neon-border">💰</div>
            <h3>{{ t('about.whoWeAre.capital') }}</h3>
            <p>{{ t('about.whoWeAre.capitalAmount') }}</p>
          </div>
          <div class="content-card cyber-card">
            <div class="card-icon neon-border">📅</div>
            <h3>{{ t('about.whoWeAre.established') }}</h3>
            <p>{{ t('about.whoWeAre.establishedDate') }}</p>
          </div>
          <div class="content-card cyber-card">
            <div class="card-icon neon-border">🚀</div>
            <h3>{{ t('about.whoWeAre.services') }}</h3>
            <p>{{ t('about.whoWeAre.servicesList') }}</p>
          </div>
        </div>
        <!-- Who-we-are feature figure: regional fintech illustration -->
        <figure class="who-we-are__feature">
          <CyberImage
            src="/images/about/about-regional-fintech.webp"
            :alt="t('about.whoWeAre.featureImageAlt')"
          />
        </figure>
      </div>
    </section>

    <!-- Achievements Section -->
    <section class="section achievements">
      <div class="container">
        <h2 class="section-title neon-text">{{ t('about.achievements.title') }}</h2>
        <div class="achievements-grid">
          <div class="achievement-card neon-border">
            <div class="badge iso-badge">ISO9001</div>
            <p>{{ t('about.achievements.iso9001') }}</p>
          </div>
          <div class="achievement-card neon-border">
            <div class="badge iso-badge">ISO27001</div>
            <p>{{ t('about.achievements.iso27001') }}</p>
          </div>
          <div class="achievement-card neon-border">
            <div class="badge iso-badge">ISO20000</div>
            <p>{{ t('about.achievements.iso20000') }}</p>
          </div>
          <div class="achievement-card neon-border">
            <div class="badge milestone-badge">🏆</div>
            <p>{{ t('about.achievements.firstMnc') }}</p>
          </div>
          <div class="achievement-card neon-border">
            <div class="badge milestone-badge">🥇</div>
            <p>{{ t('about.achievements.firstFintech') }}</p>
          </div>
          <div class="achievement-card neon-border">
            <div class="badge projects-badge">20+</div>
            <p>{{ t('about.achievements.projects') }}</p>
          </div>
        </div>

        <!-- Awards strip: official certificate / award images (AC #165) -->
        <div class="awards-strip" role="list">
          <CyberImage
            class="award-item"
            className="award-item"
            src="/images/about/award-aaa-credit.png"
            :alt="t('about.achievements.aaaAlt')"
          />
          <CyberImage
            class="award-item"
            className="award-item"
            src="/images/about/award-mnc-hq-2020.png"
            :alt="t('about.achievements.mncAlt')"
          />
          <CyberImage
            class="award-item"
            className="award-item"
            src="/images/about/award-national-excellent-2020.png"
            :alt="t('about.achievements.nationalAlt')"
          />
          <CyberImage
            class="award-item"
            className="award-item"
            src="/images/about/award-national-excellent-2021.png"
            :alt="t('about.achievements.national2021Alt')"
          />
          <CyberImage
            class="award-item"
            className="award-item"
            src="/images/about/award-iso9001-quality.png"
            :alt="t('about.achievements.iso9001Alt')"
          />
          <CyberImage
            class="award-item"
            className="award-item"
            src="/images/about/award-iso20000-itservice.png"
            :alt="t('about.achievements.iso20000Alt')"
          />
          <CyberImage
            class="award-item"
            className="award-item"
            src="/images/about/award-iso27001-infosec.png"
            :alt="t('about.achievements.iso27001Alt')"
          />
          <CyberImage
            class="award-item"
            className="award-item"
            src="/images/about/award-shenzhen-fintech-member.png"
            :alt="t('about.achievements.shenzhenFintechAlt')"
          />
          <CyberImage
            class="award-item"
            className="award-item"
            src="/images/about/award-guangdong-fintech-member.png"
            :alt="t('about.achievements.guangdongFintechAlt')"
          />
          <CyberImage
            class="award-item"
            className="award-item"
            src="/images/about/award-national-hightech.png"
            :alt="t('about.achievements.hightechAlt')"
          />
          <CyberImage
            class="award-item"
            className="award-item"
            src="/images/about/award-shenzhen-innovative-sme.png"
            :alt="t('about.achievements.innovativeSmeAlt')"
          />
          <CyberImage
            class="award-item"
            className="award-item"
            src="/images/about/award-shenzhen-specialized-sme.png"
            :alt="t('about.achievements.specializedSmeAlt')"
          />
        </div>
      </div>
    </section>

    <!-- Vision/Mission/Culture Section -->
    <section class="section vision-mission">
      <div class="container">
        <div class="vmc-grid">
          <div class="vmc-card neon-glow">
            <div class="vmc-icon">👁️</div>
            <h3>{{ t('about.vision.title') }}</h3>
            <p>{{ t('about.vision.description') }}</p>
          </div>
          <div class="vmc-card neon-glow">
            <div class="vmc-icon">🎯</div>
            <h3>{{ t('about.mission.heading') }}</h3>
            <p>{{ t('about.mission.description') }}</p>
          </div>
        </div>

        <h2 class="section-title neon-text" style="margin-top: 3rem;">{{ t('about.culture.title') }}</h2>
        <div class="culture-grid">
          <div class="culture-item cyber-card">
            <div class="culture-icon">👥</div>
            <h4>{{ t('about.culture.customer') }}</h4>
          </div>
          <div class="culture-item cyber-card">
            <div class="culture-icon">🤝</div>
            <h4>{{ t('about.culture.collaboration') }}</h4>
          </div>
          <div class="culture-item cyber-card">
            <div class="culture-icon">⚡</div>
            <h4>{{ t('about.culture.agile') }}</h4>
          </div>
          <div class="culture-item cyber-card">
            <div class="culture-icon">💼</div>
            <h4>{{ t('about.culture.professional') }}</h4>
          </div>
        </div>

        <!-- Culture image (AC #165) -->
        <figure class="culture-feature">
          <CyberImage
            src="/images/about/culture-icon.png"
            :alt="t('about.culture.imageAlt')"
          />
        </figure>
      </div>
    </section>

    <!-- Service Provider Section -->
    <section class="section service-provider">
      <div class="container">
        <h2 class="section-title neon-text">{{ t('about.serviceProvider.title') }}</h2>
        <div class="service-cards">
          <div class="service-card cyber-card hover-lift">
            <div class="service-number neon-text">01</div>
            <h3>{{ t('about.serviceProvider.service1.title') }}</h3>
            <p>{{ t('about.serviceProvider.service1.description') }}</p>
          </div>
          <div class="service-card cyber-card hover-lift">
            <div class="service-number neon-text">02</div>
            <h3>{{ t('about.serviceProvider.service2.title') }}</h3>
            <p>{{ t('about.serviceProvider.service2.description') }}</p>
          </div>
          <div class="service-card cyber-card hover-lift">
            <div class="service-number neon-text">03</div>
            <h3>{{ t('about.serviceProvider.service3.title') }}</h3>
            <p>{{ t('about.serviceProvider.service3.description') }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats Section -->
    <section class="section stats-section">
      <div class="container">
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value neon-text">50+</div>
            <div class="stat-label">{{ t('about.stats.projects.label') }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-value neon-text">100%</div>
            <div class="stat-label">{{ t('about.stats.commitment.label') }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-value neon-text">24/7</div>
            <div class="stat-label">{{ t('about.stats.innovation.label') }}</div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useLanguage } from '../composables/useLanguage'
import { useParallax } from '../composables/useParallax'
import CyberImage from '../components/CyberImage.vue'

const { t } = useLanguage()

// Root scope ref for the reduced-motion-safe mouse-move parallax (#177).
const rootRef = ref(null)
const { enabled } = useParallax({
  rootRef,
  layers: [
    { selector: '.grid-bg', intensity: 12 },
    { selector: '.grid-bg-2', intensity: 6 },
    { selector: '.about-hero .hero-content', intensity: 20 },
  ],
})
</script>

<style scoped>
.about {
  position: relative;
  min-height: 100vh;
  overflow-x: hidden;
}

.grid-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image:
    linear-gradient(rgba(0, 255, 204, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 204, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  pointer-events: none;
  z-index: 0;
}

.grid-bg-2 {
  background-image:
    linear-gradient(rgba(0, 255, 204, 0.01) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 204, 0.01) 1px, transparent 1px);
  background-size: 100px 100px;
  animation: gridMove 20s linear infinite;
}

@keyframes gridMove {
  0% { transform: translate(0, 0); }
  100% { transform: translate(50px, 50px); }
}

/* Parallax (#177): additive perf hints. No existing rule is restyled — only
   will-change and, for the hero layer only, a short eased transition. The grid
   layers deliberately get NO transform transition because gridMove already
   animates .grid-bg-2's transform and a transition would fight the keyframe. */
.grid-bg,
.grid-bg-2 {
  will-change: transform;
}

.section {
  position: relative;
  padding: 4rem 5%;
  z-index: 1;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

/* Hero Section */
.about-hero {
  min-height: 50vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: rgba(10, 15, 28, 0.9);
  border-bottom: 1px solid rgba(0, 255, 204, 0.2);
  position: relative;
  overflow: hidden;
}

.about-hero::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(0, 255, 204, 0.1) 0%, transparent 70%);
  animation: pulse 10s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.1); }
}

.hero-content {
  position: relative;
  z-index: 2;
  will-change: transform;
  transition: transform 0.15s ease-out;
}

.page-title {
  font-family: 'Orbitron', monospace;
  font-size: 3rem;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.2em;
  margin-bottom: 1rem;
  text-transform: uppercase;
}

.page-title .accent {
  color: #00ffcc;
  text-shadow: 0 0 20px rgba(0, 255, 204, 0.8);
}

.page-subtitle {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1.3rem;
  color: #a0a0a0;
  max-width: 600px;
  margin: 0 auto;
}

.section-title {
  font-family: 'Orbitron', monospace;
  font-size: 2rem;
  font-weight: 700;
  color: #00ffcc;
  letter-spacing: 0.15em;
  text-align: center;
  margin-bottom: 3rem;
  text-transform: uppercase;
}

/* Content Grid */
.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.content-card {
  padding: 2rem;
  text-align: center;
}

.card-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.content-card h3 {
  font-family: 'Orbitron', monospace;
  font-size: 1.1rem;
  color: #00ffcc;
  margin-bottom: 0.5rem;
}

.content-card p {
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.95rem;
  color: #a0a0a0;
  line-height: 1.6;
}

/* Cyber Card */
.cyber-card {
  background: rgba(10, 15, 28, 0.8);
  border: 1px solid rgba(0, 255, 204, 0.2);
  border-radius: 10px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.cyber-card:hover {
  border-color: rgba(0, 255, 204, 0.5);
  box-shadow: 0 0 30px rgba(0, 255, 204, 0.2);
}

.hover-lift:hover {
  transform: translateY(-10px);
}

/* Neon Border */
.neon-border {
  border: 1px solid rgba(0, 255, 204, 0.3);
  border-radius: 50%;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  transition: all 0.3s ease;
}

.neon-border:hover {
  box-shadow: 0 0 20px rgba(0, 255, 204, 0.5), inset 0 0 20px rgba(0, 255, 204, 0.2);
}

/* Neon Glow */
.neon-glow {
  background: rgba(0, 255, 204, 0.05);
  border: 1px solid rgba(0, 255, 204, 0.3);
  box-shadow: 0 0 15px rgba(0, 255, 204, 0.1);
}

.neon-glow:hover {
  box-shadow: 0 0 30px rgba(0, 255, 204, 0.3);
}

/* Achievements Grid */
.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.achievement-card {
  padding: 1.5rem;
  text-align: center;
  border-radius: 10px;
  background: rgba(10, 15, 28, 0.8);
  transition: all 0.3s ease;
}

.achievement-card:hover {
  transform: scale(1.05);
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  font-weight: bold;
  margin-bottom: 1rem;
}

.iso-badge {
  background: linear-gradient(135deg, #00ffcc, #00ccaa);
  color: #000;
}

.milestone-badge {
  background: linear-gradient(135deg, #ffcc00, #ffaa00);
  font-size: 1.5rem;
}

.projects-badge {
  background: linear-gradient(135deg, #ff6600, #cc4400);
  color: #fff;
}

.achievement-card p {
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.9rem;
  color: #a0a0a0;
}

/* VMC Grid */
.vmc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.vmc-card {
  padding: 2rem;
  text-align: center;
  border-radius: 10px;
}

.vmc-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.vmc-card h3 {
  font-family: 'Orbitron', monospace;
  font-size: 1.2rem;
  color: #00ffcc;
  margin-bottom: 0.5rem;
}

.vmc-card p {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1rem;
  color: #a0a0a0;
}

/* Culture Grid */
.culture-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
}

.culture-item {
  padding: 1.5rem;
  text-align: center;
}

.culture-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.culture-item h4 {
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.9rem;
  color: #e0e0e0;
  text-transform: uppercase;
}

/* Service Provider */
.service-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.service-card {
  padding: 2rem;
  position: relative;
}

.service-number {
  font-family: 'Orbitron', monospace;
  font-size: 3rem;
  font-weight: 700;
  opacity: 0.2;
  position: absolute;
  top: 1rem;
  right: 1rem;
}

.service-card h3 {
  font-family: 'Orbitron', monospace;
  font-size: 1.1rem;
  color: #00ffcc;
  margin-bottom: 1rem;
  padding-right: 3rem;
}

.service-card p {
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.95rem;
  color: #a0a0a0;
  line-height: 1.6;
}

/* Stats Section */
.stats-section {
  background: rgba(0, 255, 204, 0.05);
  border-top: 1px solid rgba(0, 255, 204, 0.2);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
}

.stat-item {
  text-align: center;
  padding: 2rem;
}

.stat-value {
  font-family: 'Orbitron', monospace;
  font-size: 3rem;
  font-weight: 700;
  color: #00ffcc;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1rem;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.15em;
}

/* AC #165 — About imagery layout */
.about-hero__figure {
  margin: 2rem auto 0;
  max-width: 720px;
  width: 100%;
}

.about-hero__figure :deep(.cyber-image) {
  width: 100%;
}

.who-we-are__feature {
  margin: 3rem auto 0;
  max-width: 720px;
  width: 100%;
}

.who-we-are__feature :deep(.cyber-image) {
  width: 100%;
}

/* Awards strip — responsive grid of certificate/award CyberImages */
.awards-strip {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1.5rem;
  margin-top: 3rem;
}

.awards-strip .award-item,
.awards-strip :deep(.award-item) {
  margin: 0;
}

.culture-feature {
  margin: 3rem auto 0;
  max-width: 360px;
  width: 100%;
}

.culture-feature :deep(.cyber-image) {
  width: 100%;
}

/* Responsive */
@media (max-width: 768px) {
  .awards-strip {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 1rem;
  }

  .about-hero__figure,
  .who-we-are__feature {
    max-width: 100%;
  }

  .culture-feature {
    max-width: 240px;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .page-title {
    font-size: 2rem;
  }

  .culture-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .section {
    padding: 3rem 5%;
  }
}

@media (max-width: 480px) {
  .content-grid,
  .achievements-grid,
  .vmc-grid,
  .service-cards {
    grid-template-columns: 1fr;
  }

  .culture-grid {
    grid-template-columns: 1fr;
  }
}
</style>
