import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Services Page Object Model
 *
 * Represents the Services page of the KTech website
 */
export class ServicesPage extends BasePage {
  // Page sections
  readonly contentWrapper: Locator;
  readonly cyberHeader: Locator;
  readonly pageTitle: Locator;
  readonly pageSubtitle: Locator;
  readonly servicesGrid: Locator;
  readonly serviceCards: Locator;
  readonly ctaButton: Locator;

  // Background elements
  readonly gridBg: Locator;

  constructor(page: Page) {
    super(page);

    // Page sections
    this.contentWrapper = page.locator('.services .content');
    this.cyberHeader = page.locator('.services .cyber-header');
    this.pageTitle = page.locator('.services .cyber-header h1');
    this.pageSubtitle = page.locator('.services .subtitle');
    this.servicesGrid = page.locator('.services .services-grid');
    this.serviceCards = page.locator('.services .service-card');
    this.ctaButton = page.locator('.services .cyber-button');

    // Background elements
    this.gridBg = page.locator('.services .grid-bg');
  }

  /**
   * Navigate to services page
   */
  async goto() {
    await super.goto('/services');
    await this.waitForLoad();
  }

  /**
   * Get page title text
   */
  async getPageTitle(): Promise<string> {
    await this.pageTitle.waitFor({ state: 'visible' });
    return await this.pageTitle.textContent() || '';
  }

  /**
   * Get page subtitle text
   */
  async getPageSubtitle(): Promise<string> {
    await this.pageSubtitle.waitFor({ state: 'visible' });
    return await this.pageSubtitle.textContent() || '';
  }

  /**
   * Get count of service cards
   */
  async getServiceCardCount(): Promise<number> {
    await this.servicesGrid.waitFor({ state: 'visible' });
    return await this.serviceCards.count();
  }

  /**
   * Get service card details by index
   */
  async getServiceCardDetails(index: number): Promise<{
    icon: string;
    title: string;
    description: string;
    features: string[];
  }> {
    const card = this.serviceCards.nth(index);

    const icon = await card.locator('.service-icon').textContent() || '';
    const title = await card.locator('.service-title').textContent() || '';
    const description = await card.locator('.service-description').textContent() || '';

    // Get features list
    const featureElements = card.locator('.service-features li');
    const count = await featureElements.count();
    const features: string[] = [];

    for (let i = 0; i < count; i++) {
      const featureText = await featureElements.nth(i).textContent();
      if (featureText) {
        // Remove the bullet point character
        features.push(featureText.replace('›', '').trim());
      }
    }

    return { icon, title, description, features };
  }

  /**
   * Click CTA button
   */
  async clickCta() {
    await this.ctaButton.click();
  }

  /**
   * Get CTA button text
   */
  async getCtaText(): Promise<string> {
    return await this.ctaButton.textContent() || '';
  }

  /**
   * Check if grid background is visible
   */
  async isGridBackgroundVisible(): Promise<boolean> {
    return await this.gridBg.first().isVisible();
  }

  /**
   * Hover over service card by index
   */
  async hoverServiceCard(index: number) {
    await this.serviceCards.nth(index).hover();
  }

  /**
   * Check if service card has hover effect
   */
  async hasCardHoverEffect(index: number): Promise<boolean> {
    const card = this.serviceCards.nth(index);
    const boxShadow = await card.evaluate((el) => {
      return window.getComputedStyle(el).boxShadow;
    });
    // Check if box shadow contains neon color values
    return boxShadow.includes('0') && boxShadow.includes('rgba');
  }
}
