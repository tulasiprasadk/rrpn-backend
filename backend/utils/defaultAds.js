export const DEFAULT_CMS_ADS = {
  checkout_ads: [
    {
      title: "RR Nagar",
      image: "/images/ads/rrnagar.png",
      link: "https://rrnagar.com",
      text: "Shop local products and services",
      active: true
    },
    {
      title: "iChase Fitness",
      image: "/images/ads/ichase.png",
      link: "https://vchase.in",
      text: "Fitness and wellness around you",
      active: true
    }
  ],
  mega_ads_left: [
    {
      title: "iChase Fitness",
      image: "/images/ads/ichase.png",
      link: "https://vchase.in",
      text: "Fitness and wellness",
      active: true
    },
    {
      title: "RR Nagar",
      image: "/images/ads/rrnagar.png",
      link: "https://rrnagar.com",
      text: "Local shopping and services",
      active: true
    }
  ],
  mega_ads_right: [
    {
      title: "VChase Marketing",
      image: "/images/ads/vchase.png",
      link: "https://vchase.in",
      text: "Marketing and branding support",
      active: true
    },
    {
      title: "Renee Vet",
      image: "/images/ads/reneevet.png",
      link: "https://thevetbuddy.com",
      text: "Pet care and vet services",
      active: true
    },
    {
      title: "Gephyr",
      image: "/images/ads/gephyr.png",
      link: "https://rrnagar.com",
      text: "Discover local business offers",
      active: true
    }
  ],
  scrolling_ads: [
    {
      title: "iChase Fitness",
      image: "/images/ads/ichase.png",
      link: "https://vchase.in",
      text: "Tap to explore",
      active: true
    },
    {
      title: "VChase Marketing",
      image: "/images/ads/vchase.png",
      link: "https://vchase.in",
      text: "Tap to explore",
      active: true
    },
    {
      title: "RR Nagar",
      image: "/images/ads/rrnagar.png",
      link: "https://rrnagar.com",
      text: "Tap to explore",
      active: true
    },
    {
      title: "Renee Vet",
      image: "/images/ads/reneevet.png",
      link: "https://thevetbuddy.com",
      text: "Tap to explore",
      active: true
    }
  ]
};

export function getDefaultCmsAds(key) {
  const items = DEFAULT_CMS_ADS[key];
  return Array.isArray(items) ? items.map((item) => ({ ...item })) : [];
}
