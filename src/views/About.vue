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
        <!-- Hero figure: official-site imagery, eager-loaded (above the fold).
             Responsive srcset (#199): 400w on mobile, 800w on tablet, and the
             1200w descriptor points at the original 800px file (no upscale). -->
        <figure class="about-hero__figure">
          <CyberImage
            src="/images/about/about-who-we-are.webp"
            :alt="t('about.hero.imageAlt')"
            eager
            srcset="/images/about/about-who-we-are-400w.webp 400w, /images/about/about-who-we-are-800w.webp 800w, /images/about/about-who-we-are.webp 1200w"
            sizes="(max-width: 600px) 100vw, 50vw"
          />
        </figure>
      </div>
    </section>

    <!-- Self-Driving dev pipeline flagship demo (#203). Auto-plays the full
         INTAKE -> ... -> RESOLVED loop with zero interaction. Mounted IN-FLOW
         (not as a global fixed background) so the pipeline rail, streaming
         code feed, and status readout are visible page content (AC1). -->
    <section class="self-driving-section">
      <SelfDrivingDemo />
    </section>

    <!-- Who We Are Section -->
    <section class="section who-we-are">
      <div class="container">
        <h2 class="section-title neon-text">{{ t('about.whoWeAre.title') }}</h2>
        <div class="content-grid">
          <div class="content-card cyber-card">
            <div class="card-icon neon-border">
              <AboutIcon name="company" :label="t('about.whoWeAre.icons.companyAlt')" />
            </div>
            <h3>{{ t('about.whoWeAre.companyName') }}</h3>
            <p>{{ t('about.whoWeAre.companyInfo') }}</p>
          </div>
          <div class="content-card cyber-card">
            <div class="card-icon neon-border">
              <AboutIcon name="parentRegion" :label="t('about.whoWeAre.icons.parentRegionAlt')" />
            </div>
            <h3>{{ t('about.whoWeAre.parentCompany') }}</h3>
            <p>{{ t('about.whoWeAre.parentInfo') }}</p>
          </div>
          <div class="content-card cyber-card">
            <div class="card-icon neon-border">
              <AboutIcon name="capital" :label="t('about.whoWeAre.icons.capitalAlt')" />
            </div>
            <h3>{{ t('about.whoWeAre.capital') }}</h3>
            <p>{{ t('about.whoWeAre.capitalAmount') }}</p>
          </div>
          <div class="content-card cyber-card">
            <div class="card-icon neon-border">
              <AboutIcon name="established" :label="t('about.whoWeAre.icons.establishedAlt')" />
            </div>
            <h3>{{ t('about.whoWeAre.established') }}</h3>
            <p>{{ t('about.whoWeAre.establishedDate') }}</p>
          </div>
          <div class="content-card cyber-card">
            <div class="card-icon neon-border">
              <AboutIcon name="services" :label="t('about.whoWeAre.icons.servicesAlt')" />
            </div>
            <h3>{{ t('about.whoWeAre.services') }}</h3>
            <p>{{ t('about.whoWeAre.servicesList') }}</p>
          </div>
        </div>
        <!-- Who-we-are feature figure: regional fintech illustration.
             Single-descriptor srcset at native width (800px) — no new files
             generated (#199; this image is already optimally sized). -->
        <figure class="who-we-are__feature">
          <CyberImage
            src="/images/about/about-regional-fintech.webp"
            :alt="t('about.whoWeAre.featureImageAlt')"
            srcset="/images/about/about-regional-fintech.webp 800w"
            sizes="(max-width: 600px) 100vw, 720px"
          />
        </figure>
      </div>
    </section>

    <!-- Achievements Section -->
    <section class="section achievements">
      <div class="container">
        <h2 class="section-title neon-text">{{ t('about.achievements.title') }}</h2>
        <div class="achievements-grid">
          <div class="achievement-card">
            <div class="badge iso-badge">ISO9001</div>
            <p>{{ t('about.achievements.iso9001') }}</p>
          </div>
          <div class="achievement-card">
            <div class="badge iso-badge">ISO27001</div>
            <p>{{ t('about.achievements.iso27001') }}</p>
          </div>
          <div class="achievement-card">
            <div class="badge iso-badge">ISO20000</div>
            <p>{{ t('about.achievements.iso20000') }}</p>
          </div>
          <div class="achievement-card">
            <div class="badge milestone-badge">
              <AboutIcon name="firstMnc" :size="32" :label="t('about.achievements.firstMncIconAlt')" />
            </div>
            <p>{{ t('about.achievements.firstMnc') }}</p>
          </div>
          <div class="achievement-card">
            <div class="badge milestone-badge">
              <AboutIcon name="firstFintech" :size="32" :label="t('about.achievements.firstFintechIconAlt')" />
            </div>
            <p>{{ t('about.achievements.firstFintech') }}</p>
          </div>
          <div class="achievement-card">
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
            <div class="vmc-icon">
              <AboutIcon name="vision" :size="48" :label="t('about.vision.iconAlt')" />
            </div>
            <h3>{{ t('about.vision.title') }}</h3>
            <p>{{ t('about.vision.description') }}</p>
          </div>
          <div class="vmc-card neon-glow">
            <div class="vmc-icon">
              <AboutIcon name="mission" :size="48" :label="t('about.mission.iconAlt')" />
            </div>
            <h3>{{ t('about.mission.heading') }}</h3>
            <p>{{ t('about.mission.description') }}</p>
          </div>
        </div>

        <h2 class="section-title neon-text" style="margin-top: 3rem;">{{ t('about.culture.title') }}</h2>
        <div class="culture-grid">
          <div class="culture-item cyber-card">
            <div class="culture-icon">
              <AboutIcon name="customer" :size="32" :label="t('about.culture.icons.customerAlt')" />
            </div>
            <h4>{{ t('about.culture.customer') }}</h4>
          </div>
          <div class="culture-item cyber-card">
            <div class="culture-icon">
              <AboutIcon name="collaboration" :size="32" :label="t('about.culture.icons.collaborationAlt')" />
            </div>
            <h4>{{ t('about.culture.collaboration') }}</h4>
          </div>
          <div class="culture-item cyber-card">
            <div class="culture-icon">
              <AboutIcon name="agile" :size="32" :label="t('about.culture.icons.agileAlt')" />
            </div>
            <h4>{{ t('about.culture.agile') }}</h4>
          </div>
          <div class="culture-item cyber-card">
            <div class="culture-icon">
              <AboutIcon name="professional" :size="32" :label="t('about.culture.icons.professionalAlt')" />
            </div>
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
            <div class="stat-value neon-text">20+</div>
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
import SelfDrivingDemo from '../components/SelfDrivingDemo.vue'
import AboutIcon from '../components/icons/AboutIcon.vue'

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

/* Self-Driving demo flagship section (#203). The demo component owns its own
   background + min-height; this wrapper gives it vertical breathing room and a
   relative positioning context above the grid-bg. */
.self-driving-section {
  position: relative;
  z-index: 1;
  width: 100%;
  margin: 2rem auto;
  max-width: 1200px;
  border: 1px solid rgba(0, 255, 204, 0.15);
  border-radius: var(--radius-sm);
  overflow: hidden;
  /* scroll-margin-top: leave head-room for the fixed Header so the demo's
     StatusReadout is NOT occluded by the nav (mobile Chrome E2E gate). */
  scroll-margin-top: 6rem;
}

/* Hero Section */
.about-hero {
  min-height: 50vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: var(--surface-card);
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
  font-family: var(--font-display);
  font-size: 3rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0.2em;
  margin-bottom: 1rem;
  text-transform: uppercase;
}

.page-title .accent {
  color: var(--cyan);
  text-shadow: 0 0 20px rgba(0, 255, 204, 0.8);
}

.page-subtitle {
  font-family: var(--font-body);
  font-size: 1.3rem;
  color: var(--text-section-subtitle);
  max-width: 600px;
  margin: 0 auto;
}

.section-title {
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 700;
  color: var(--cyan);
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
  font-family: var(--font-display);
  font-size: 1.1rem;
  color: var(--cyan);
  margin-bottom: 0.5rem;
}

.content-card p {
  font-family: var(--font-body);
  font-size: 0.95rem;
  color: var(--text-card-meta);
  line-height: 1.6;
}

/* Cyber Card */
.cyber-card {
  background: var(--surface-card);
  border: 1px solid rgba(0, 255, 204, 0.2);
  border-radius: var(--radius-lg);
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
/* NOTE: content-visibility:auto is intentionally NOT applied to .achievements.
   .achievements contains .projects-badge (line 118) which has an active #252
   WCAG contrast AC. content-visibility:auto skips paint of the offscreen
   subtree, so the contrast pixel-sampling reads the unpainted default
   (fg=bg=rgb(10,10,10), ratio=1.00) and fails the >=4.5 AA gate — the same
   lesson as commit d74ea88 (drop cv:auto from subtrees with active
   paint-dependent ACs). The section still gets the perf win via the other
   cv:auto rules below (.vision-mission, .service-provider, .stats-section). */

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.achievement-card {
  padding: 1.5rem;
  text-align: center;
  border: 1px solid rgba(0, 255, 204, 0.2);
  border-radius: var(--radius-lg);
  background: var(--surface-card);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.achievement-card:hover {
  border-color: rgba(0, 255, 204, 0.5);
  box-shadow: 0 0 30px rgba(0, 255, 204, 0.2);
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
  background: linear-gradient(135deg, var(--cyan), var(--cyan));
  color: var(--bg-primary);
}

.milestone-badge {
  background: linear-gradient(135deg, var(--status-warning), var(--status-warning));
  font-size: 1.5rem;
}

.projects-badge {
  background: linear-gradient(135deg, var(--accent-magenta), var(--accent-magenta));
  color: var(--bg-primary);
}

.achievement-card p {
  font-family: var(--font-body);
  font-size: 0.9rem;
  color: var(--text-card-meta);
}

/* VMC Grid */
/* #253 perf: content-visibility:auto on the vision/mission/culture section.
   contain-intrinsic-size reserves the height (two card rows + culture grid)
   before first render (CLS guard — AC #3). */
.vision-mission {
  content-visibility: auto;
  contain-intrinsic-size: 900px;
}

.vmc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.vmc-card {
  padding: 2rem;
  text-align: center;
  border-radius: var(--radius-lg);
}

.vmc-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.vmc-card h3 {
  font-family: var(--font-display);
  font-size: 1.2rem;
  color: var(--cyan);
  margin-bottom: 0.5rem;
}

.vmc-card p {
  font-family: var(--font-body);
  font-size: 1rem;
  color: var(--text-card-meta);
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

/* #273: the Vision/Mission/Culture/Achievements emoji were replaced with
   inline <AboutIcon> SVGs. Emojis were sized by font-size; the SVGs are sized
   by the AboutIcon `size` prop. Force the rendered <svg> to display:block so
   it drops the inline baseline-alignment quirks font-size used to absorb. The
   existing font-size rules above are left in place as harmless no-ops (the
   slots no longer contain text). */
.vmc-icon svg,
.culture-icon svg,
.milestone-badge svg {
  display: block;
}

.culture-item h4 {
  font-family: var(--font-body);
  font-size: 0.9rem;
  color: var(--text-primary);
  text-transform: uppercase;
}

/* Service Provider */
/* #253 perf: content-visibility:auto on the service-provider section.
   contain-intrinsic-size reserves the three-card row height before first
   render (CLS guard — AC #3). */
.service-provider {
  content-visibility: auto;
  contain-intrinsic-size: 500px;
}

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
  font-family: var(--font-display);
  font-size: 3rem;
  font-weight: 700;
  opacity: 0.2;
  position: absolute;
  top: 1rem;
  right: 1rem;
}

.service-card h3 {
  font-family: var(--font-display);
  font-size: 1.1rem;
  color: var(--cyan);
  margin-bottom: 1rem;
  padding-right: 3rem;
}

.service-card p {
  font-family: var(--font-body);
  font-size: 0.95rem;
  color: var(--text-card-meta);
  line-height: 1.6;
}

/* Stats Section */
.stats-section {
  background: rgba(0, 255, 204, 0.05);
  border-top: 1px solid rgba(0, 255, 204, 0.2);
  /* #253 perf: skip rendering/layout/paint of this offscreen subtree until it
     scrolls near the viewport. contain-intrinsic-size reserves the box height
     BEFORE first render so the browser does not reflow (CLS guard — AC #3). */
  content-visibility: auto;
  contain-intrinsic-size: 300px;
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
  font-family: var(--font-display);
  font-size: 3rem;
  font-weight: 700;
  color: var(--cyan);
  margin-bottom: 0.5rem;
}

.stat-label {
  font-family: var(--font-body);
  font-size: 1rem;
  color: var(--text-list-label);
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
