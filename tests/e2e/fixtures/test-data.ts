/**
 * Test Data Constants
 *
 * Centralized test data to separate data from test logic
 */

// Expected service cards
export const EXPECTED_SERVICES = [
  { title: '项目管理', description: '专业的金融科技项目管理服务' },
  { title: '零售信贷', description: '端到端的零售信贷系统解决方案' },
  { title: '供应链金融', description: '基于区块链的供应链金融平台' },
  { title: '区块链技术', description: '企业级区块链解决方案' },
  { title: '金融科技应用', description: '移动端金融应用开发' },
  { title: '大数据与AI', description: '人工智能与大数据分析' },
];

// Expected honor badges
export const EXPECTED_HONORS = [
  { title: '国家高新技术企业' },
  { title: '深圳市跨国公司总部' },
  { title: 'AAA级信用企业' },
  { title: 'ISO9001认证' },
  { title: 'ISO27001认证' },
  { title: 'ISO20000认证' },
  { title: '深圳市专精特新' },
  { title: '深圳市金融科技协会' },
];

// Expected contact items
export const EXPECTED_CONTACT_ITEMS = [
  { title: '公司地址', value: '深圳市罗湖区' },
  { title: '电子邮箱', value: 'contact@ktech.fintech' },
  { title: '官方网站', value: 'www.kaitai.tech' },
];

// Expected hero content
export const EXPECTED_HERO = {
  mainTitle: '开泰科技',
  subtitle: '开泰远景信息科技有限公司',
};

// Navigation links
export const NAVIGATION_LINKS = [
  { text: '服务', href: '#services' },
  { text: '荣誉', href: '#honors' },
  { text: '联系', href: '#contact' },
];

// Viewport sizes for responsive testing
export const VIEWPORTS = {
  desktop: { width: 1280, height: 720 },
  laptop: { width: 1024, height: 768 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 },
};
