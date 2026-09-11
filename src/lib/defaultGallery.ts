export interface RawGalleryItem {
  _id: string;
  src: string;
  width: number;
  height: number;
  category: string;
  shoot?: string;
  title?: string;
  alt?: string;
  order?: number;
}

export const DEFAULT_SHOOT_GALLERY: RawGalleryItem[] = [
  {
    _id: 'default-newborn-1',
    src: '/api/media/images/home/hero/slideshow/1785523812657-newborn_family_shoot.jpg',
    width: 1200,
    height: 800,
    category: 'newborn',
    title: 'Delicate Newborn Slumber',
    alt: 'Fine art newborn photography session in Mumbai',
    order: 1,
  },
  {
    _id: 'default-newborn-2',
    src: '/api/media/images/home/hero/slideshow/1785523941414-newborn_family_shoot.jpg',
    width: 1200,
    height: 800,
    category: 'newborn',
    title: 'Organic Infant Details',
    alt: 'Peaceful infant photography with natural textures',
    order: 2,
  },
  {
    _id: 'default-newborn-3',
    src: '/api/media/images/home/hero/slideshow/1785524139394-newborn_family_shoot.jpg',
    width: 1200,
    height: 800,
    category: 'newborn',
    title: 'Mother & Baby Connection',
    alt: 'Gentle newborn baby photography in Mumbai studio',
    order: 3,
  },
  {
    _id: 'default-maternity-1',
    src: '/api/media/images/services/maternity-photography/1785609879047-Maternity_shoot_in_nature.jpg',
    width: 1200,
    height: 800,
    category: 'maternity',
    title: 'Graceful Maternity in Nature',
    alt: 'Artistic outdoor maternity photography at golden hour',
    order: 1,
  },
  {
    _id: 'default-maternity-2',
    src: '/api/media/images/home/hero/slideshow/1785524162837-maternity.jpg',
    width: 1200,
    height: 800,
    category: 'maternity',
    title: 'Timeless Motherhood Glow',
    alt: 'Couture studio maternity portrait with artistic drapery',
    order: 2,
  },
  {
    _id: 'default-weddings-1',
    src: '/api/media/images/home/hero/slideshow/1785523973577-wedding_portraits_1_.jpg',
    width: 1200,
    height: 800,
    category: 'weddings',
    title: 'Sacred Rituals & Eternal Vows',
    alt: 'Cinematic documentary wedding ceremony and rituals photography',
    order: 1,
  },
  {
    _id: 'default-weddings-2',
    src: '/api/media/images/home/hero/slideshow/1785523719706-wedding_portraits.jpg',
    width: 1200,
    height: 800,
    category: 'weddings',
    title: 'Royal Heritage Wedding Stories',
    alt: 'Luxury Indian wedding bride and groom editorial portraits',
    order: 2,
  },
  {
    _id: 'default-portraits-1',
    src: '/api/media/images/home/hero/slideshow/1785573522517-IMG_4416_copy_b_w.jpg',
    width: 1200,
    height: 800,
    category: 'portrait',
    title: 'Black & White Studio Heirloom',
    alt: 'Masterfully lit studio portrait photography in Mumbai',
    order: 1,
  },
  {
    _id: 'default-portraits-2',
    src: '/api/media/images/about/story/1785827668424-Indira.jpg',
    width: 1200,
    height: 800,
    category: 'portrait',
    title: 'Authentic Personal Expression',
    alt: 'Fine art personal and corporate portrait photography',
    order: 2,
  },
  {
    _id: 'default-events-1',
    src: '/api/media/images/home/hero/slideshow/1785524109798-event-naming_ceremony.jpg',
    width: 1200,
    height: 800,
    category: 'events',
    title: 'Naming Ceremony Celebration',
    alt: 'Milestone event photography and family celebration documentaries',
    order: 1,
  },
  {
    _id: 'default-brand-1',
    src: '/api/media/images/home/hero/slideshow/1785573149313-47.jpg',
    width: 1200,
    height: 800,
    category: 'brand-collaboration',
    title: 'Couture Brand & Editorial Campaign',
    alt: 'High-end commercial brand campaign and editorial photography',
    order: 1,
  },
];
