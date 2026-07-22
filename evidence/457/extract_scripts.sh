#!/bin/bash
# Extract JSON-LD scripts and compute SHA-256 hashes

cd /Users/jinbo/Documents/AIProject/AutoDevAgent/DevAgent/.worktrees/ticket-457/KTechAICyberWeb

echo "Extracting and hashing JSON-LD scripts..."

# Script 1: Organization (lines 141-165)
SCRIPT1='{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "开泰远景信息科技有限公司",
  "alternateName": "KTech Fintech",
  "url": "https://jasonhou007.github.io/KTechAICyberWeb",
  "logo": "https://jasonhou007.github.io/KTechAICyberWeb/logo.png",
  "foundingDate": "2020-06",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "深圳市",
    "addressRegion": "广东省",
    "addressCountry": "CN"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "sales",
    "email": "contact@ktech.fintech"
  },
  "sameAs": [
    "https://github.com/jasonhou007/KTechAICyberWeb"
  ]
}'

# Script 2: WebSite (lines 167-180)
SCRIPT2='{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "开泰科技 - KTech Fintech",
  "url": "https://jasonhou007.github.io/KTechAICyberWeb",
  "description": "开泰远景信息科技有限公司 - 专注于金融科技创新，提供项目管理、零售信贷、供应链金融、区块链技术等解决方案。",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://jasonhou007.github.io/KTechAICyberWeb/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}'

# Script 3: WebPage (lines 182-196)
SCRIPT3='{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "url": "https://jasonhou007.github.io/KTechAICyberWeb",
  "name": "开泰科技 - KTech Fintech | 金融科技创新",
  "description": "开泰远景信息科技有限公司 - 专注于金融科技创新，提供项目管理、零售信贷、供应链金融、区块链技术等解决方案。",
  "inLanguage": "zh-CN",
  "about": {
    "@type": "Thing",
    "name": "金融科技",
    "description": "金融科技创新解决方案"
  }
}'

# Script 4: Corporation (lines 198-222)
SCRIPT4='{
  "@context": "https://schema.org",
  "@type": "Corporation",
  "name": "开泰远景信息科技有限公司",
  "url": "https://jasonhou007.github.io/KTechAICyberWeb",
  "logo": "https://jasonhou007.github.io/KTechAICyberWeb/logo.png",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "罗湖区",
    "addressLocality": "深圳市",
    "addressRegion": "广东省",
    "postalCode": "518000",
    "addressCountry": "CN"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+86-755-00000000",
    "contactType": "Customer Service",
    "email": "contact@ktech.fintech",
    "areaServed": "CN",
    "availableLanguage": ["zh", "en"]
  }
}'

echo "Hash 1 (Organization):"
echo "$SCRIPT1" | openssl dgst -sha256 -binary | openssl base64
echo ""

echo "Hash 2 (WebSite):"
echo "$SCRIPT2" | openssl dgst -sha256 -binary | openssl base64
echo ""

echo "Hash 3 (WebPage):"
echo "$SCRIPT3" | openssl dgst -sha256 -binary | openssl base64
echo ""

echo "Hash 4 (Corporation):"
echo "$SCRIPT4" | openssl dgst -sha256 -binary | openssl base64
echo ""
