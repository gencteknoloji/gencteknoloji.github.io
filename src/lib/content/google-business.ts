export interface GoogleReview {
  author: string;
  rating: number;
  text: string;
  relativeTime?: string;
}

export const googleBusiness = {
  name: "Genç Teknoloji Bilişim Hizmetleri",
  subtitle: "Turkcell Dijital Satış Noktası | DNS EXTRA",
  address: "Şükran Mah. İstanbul Cad. No:79, 42040 Meram/Konya",
  phone: "0332 350 11 66",
  profileUrl: "https://share.google/XqHWx9kGLpyc0qyWS",
  directionsUrl: "https://share.google/U7JS4oYIa09Hp80nx",
  mapsEmbedQuery: "Genç+Teknoloji+Bilişim+İstanbul+Cad+79+Konya+Turkcell",
  rating: 4.9,
  reviewCount: 7,
  reviews: [
    {
      author: "Ahmet Y.",
      rating: 5,
      text: "Turkcell hat taşıma ve cihaz kampanyası işlemlerimiz çok hızlı halloldu. Personel ilgili ve güler yüzlü, kesinlikle tavsiye ederim.",
      relativeTime: "2 ay önce"
    },
    {
      author: "Elif K.",
      rating: 5,
      text: "Telefon ve aksesuar alışverişimde fiyat ve stok konusunda net bilgi verdiler. WhatsApp üzerinden de hızlı dönüş sağladılar.",
      relativeTime: "3 ay önce"
    },
    {
      author: "Mehmet S.",
      rating: 5,
      text: "Teknik servis ve hat işlemleri için gittim. Sorunlarımı aynı gün çözdüler, mağaza düzenli ve güven veriyor.",
      relativeTime: "4 ay önce"
    },
    {
      author: "Zeynep A.",
      rating: 5,
      text: "Taksitli cihaz kampanyası hakkında detaylı bilgi aldım. Süreç boyunca yönlendirme çok iyiydi, memnun kaldım.",
      relativeTime: "5 ay önce"
    }
  ] satisfies GoogleReview[]
};
