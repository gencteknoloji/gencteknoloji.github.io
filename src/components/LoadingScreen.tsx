"use client";

import { useEffect, useState } from "react";

const LOADING_QUOTES = [
  "Turkcell hattı gibi bağlanıyoruz — bazen 4.5G, bazen sabır G.",
  "Turkcell prim tablosu yükleniyor. Bu ay yıldız mı, gezegen mi — birazdan görürüz.",
  "Turkcell cihaz stoku taranıyor. Kutulu, faturalı, satışa hazır olsun.",
  "Hat aktivasyonu bekler gibi veritabanına bağlanıyoruz. Bip sesi yakında.",
  "Turkcell bayi mottosu: Önce hat, sonra gülümseme, en sonda prim.",
  "Numara taşıma işlemi kadar veri taşıma — ikisi de sabır ister.",
  "Fıkra: Müşteri 'Turkcell mi en hızlı?' der. Bayi: 'Sistem açılınca hız testi yaparız, önce loading.'",
  "Turkcell prim hedefi ekrana geliyor. Kahve hazır, motivasyon hazır.",
  "Cihaz kampanyası var mı? Stok kartları cevap verecek, biraz bekleyin.",
  "Turkcell faturası kesmeden önce ERP açılsın — altın bayi kuralı.",
  "Superbox mu, mobil hat mı? Müşteri karar vermeden stokları yüklüyoruz.",
  "Turkcell Platinum müşterisi gelmeden önce cari hesapları hazırlayalım.",
  "Fıkra: Bayi 'hat taşıyoruz' der. Müşteri: 'Ben mi taşınacağım?' Bayi: 'Numaranız, siz oturun.'",
  "Turkcell cihaz fiyat listesi güncelleniyor. Broşür değil, ERP konuşacak.",
  "Prim raporu hesaplanıyor. Matematik değil, bayi motivasyonu işi.",
  "Turkcell SIM kart stoğu kontrol ediliyor. Nano, micro, eski tip — hepsi sayılıyor.",
  "Fıkra: Stajyer 'Turkcell satışı yaptım' der. Usta: 'Önce sistemde görünsün.'",
  "Hat yükleme paketleri açılıyor. 'Bir GB yetmez' müşterisi için hazırlıklıyız.",
  "Turkcell bayi paneli ruhu burada: hız, stok, prim, gülüş.",
  "MNP başvurusu kadar titiz veri çekiyoruz — eksik satır olmasın.",
  "Fıkra: Müşteri 'Turkcell'de çekim var mı?' der. Bayi: 'Depoda var, sistemde birazdan.'",
  "Turkcell cihaz stok: IMEI temiz mi? Birazdan listede göreceğiz.",
  "Passo, TV+, fizy... Dijital ürün satışı öncesi menü yükleniyor.",
  "Turkcell prim hedefi: 'Bu ay kotayı geçtik mi?' cevabı geliyor.",
  "Fıkra: Patron 'Turkcell prim ne durumda?' der. Kasiyer: 'Loading bitince söylerim.'",
  "Yeni hat satışı formu hazırlanıyor. Kimlik okuma modu: zihinsel.",
  "Turkcell kampanya kodu mu var? Önce stok, sonra coşku.",
  "Cihaz taksit tablosu yükleniyor. 'Kaç taksit?' sorusuna ERP cevap verecek.",
  "Fıkra: Müşteri 'Turkcell'e geçiyorum' der. Rakip operatör ağlamaz, bayi gülümser.",
  "Turkcell faturalı hat mı, faturasız mı? Müşteri soracak, biz hazırlanalım.",
  "Bayi açılış ritüeli: Kahve, kasa, Turkcell stok — sıra loading'de.",
  "Turkcell cihaz primi ayrı, hat primi ayrı; ERP ikisini de sayıyor.",
  "Fıkra: 'En ucuz Turkcell telefonu?' Müşteri sorar. Bayi: 'Önce ekran açılsın.'",
  "Hat iptali değil, veri yüklemesi — bugün her şey aktif kalsın.",
  "Turkcell 5G uyumlu cihaz stoğu geliyor. 'Telefonum eski mi?' sorusuna hazırlık.",
  "Prim kesintisi var mı? Rapor açılınca gerçekleri konuşuruz.",
  "Fıkra: Turkcell bayisinde sabır sınavı: Müşteri 40 paket sorar, bir hat alır.",
  "Turkcell cihaz kampanyası stoğu kritik mi? Birazdan uyarı görürüz.",
  "Numara rezervasyonu yapmadan önce sistem nefes alıyor.",
  "Turkcell kurumsal hat mı bireysel mi? Cari kartlar hazırlanıyor.",
  "Fıkra: Müşteri 'Turkcell'e neden geçeyim?' der. Bayi: 'Loading bitsin, liste uzun.'",
  "Turkcell prim dönemi kapanmadan raporu açalım — stres azalsın.",
  "Eski hat yenileme kampanyası var mı? Stok ve fiyat birlikte geliyor.",
  "Turkcell bayi hedefi: Hat + cihaz + gülümseme. Veriler yükleniyor.",
  "Fıkra: 'Turkcell çekmiyor' diyen müşteriye bayi: 'Burada çeker, sistem de çeksin.'",
  "Turkcell cihaz stok sayımı: Kutulu say, açık satma.",
  "Hat taşıma evrakları dijital; ama müşteri hâlâ 'kaç gün sürer?' diye sorar.",
  "Turkcell prim tablosu açılıyor. Ay sonu sevinci veya draması yakında.",
  "Fıkra: Bayi Turkcell tişörtü giyer. Müşteri: 'Çalışan mısınız?' Bayi: 'Prim için evet.'",
  "Turkcell paket yükseltme satışı öncesi güncel tarifeler geliyor.",
  "Cihaz sigortası mı, ekran koruyucu mu? Turkcell bayisinde ikisi de.",
  "Turkcell hat aktivasyon onayı bekler gibi sunucu yanıt verecek.",
  "Fıkra: Müşteri 'Turkcell bana mesaj attı' der. Bayi: 'Biz de size prim hedefi atacağız, önce ERP.'",
  "Turkcell cihaz stok raporu: Hangi model gidiyor, hangisi rafta kalıyor?",
  "Bayi gün sonu: Turkcell satışları kasaya, primler rapora.",
  "Turkcell faturalı geçiş kampanyası var mı? Kampanya listesi yükleniyor.",
  "Fıkra: 'Turkcell'den ayrılamıyorum' diyen müşteri. Bayi: 'Taşıma kolay, karar zor.'",
  "Turkcell prim kotası: Bir satış daha mı kaldı? Rapor söyleyecek.",
  "Hat ve cihaz birlikte satış — Turkcell bayisinin klasik combo'su.",
  "Turkcell bayi ekranı açılıyor. Sarı-siyah ruh, dijital kasa.",
  "Fıkra: Müşteri 'Turkcell Pass alayım mı?' der. Bayi: 'Önce stok, sonra Pass.'",
  "Turkcell cihaz IMEI listesi geliyor. Temiz kayıt, temiz satış.",
  "Numara taşıma süreci 24 saat; loading biraz daha kısa, söz.",
  "Turkcell prim hedefi tavan mı taban mı — grafik birazdan konuşur.",
  "Fıkra: Bayi açılışta 'Hoş geldiniz, Turkcell bayi' der. ERP açılınca 'Hoş geldiniz, satış.'",
  "Turkcell kurulum ücreti mi kampanya mı? Güncel fiyatlar yükleniyor.",
  "Cihaz stoğu bitmeden prim hedefi bitsin diye dua eden bayi modu: aktif.",
  "Turkcell hat faturası dijital; müşteri yine de 'kağıt verir misiniz?' der.",
  "Fıkra: 'Turkcell en ucuz paket?' Müşteri sorar. Bayi: 'En ucuz paket: sabır. Sistem açılıyor.'",
  "Turkcell bayi prim raporu — ayın gerçek kahramanı rakamlar olacak.",
  "Turkcell cihaz stok ve prim verisi bir arada geliyor. Tek ekran, tek nefes.",
  "Hat satışı, cihaz satışı, prim mutluluğu — sırayla yükleniyor.",
  "Fıkra: Turkcell bayisinde üç soru: 'Hat mı?', 'Cihaz mı?', 'Taksit mi?' — dördüncü: 'Sistem açıldı mı?'",
  "Turkcell'e hoş geldiniz. Veriler de birazdan hoş geldiniz diyecek.",
];

const DEFAULT_QUOTE = LOADING_QUOTES[0];
const INITIAL_QUOTE_DELAY_MS = 1800;
const QUOTE_ROTATE_INTERVAL_MS = 6500;

function pickRandomQuote(exclude?: string) {
  if (LOADING_QUOTES.length <= 1) return LOADING_QUOTES[0];
  let next = LOADING_QUOTES[Math.floor(Math.random() * LOADING_QUOTES.length)];
  while (next === exclude) {
    next = LOADING_QUOTES[Math.floor(Math.random() * LOADING_QUOTES.length)];
  }
  return next;
}

type LoadingScreenProps = {
  variant?: "auth" | "content";
};

function LoadingQuote({ quote, visible }: { quote: string; visible: boolean }) {
  return (
    <p
      className={`text-slate-300 text-lg sm:text-xl font-medium leading-relaxed transition-opacity duration-700 ${
        visible ? "opacity-100" : "opacity-40"
      }`}
    >
      {quote}
    </p>
  );
}

export function LoadingScreen({ variant = "content" }: LoadingScreenProps) {
  const [quote, setQuote] = useState(DEFAULT_QUOTE);
  const [quoteVisible, setQuoteVisible] = useState(false);

  useEffect(() => {
    let rotateId: number | undefined;

    const initialTimer = window.setTimeout(() => {
      setQuote(pickRandomQuote(DEFAULT_QUOTE));
      setQuoteVisible(true);

      rotateId = window.setInterval(() => {
        setQuoteVisible(false);
        window.setTimeout(() => {
          setQuote((current) => pickRandomQuote(current));
          setQuoteVisible(true);
        }, 350);
      }, QUOTE_ROTATE_INTERVAL_MS);
    }, INITIAL_QUOTE_DELAY_MS);

    return () => {
      window.clearTimeout(initialTimer);
      if (rotateId !== undefined) window.clearInterval(rotateId);
    };
  }, []);

  if (variant === "auth") {
    return (
      <div className="min-h-screen min-h-dvh bg-[#060913] text-white flex items-center justify-center font-sans pwa-auth-screen px-8">
        <div className="flex flex-col items-center gap-6 text-center max-w-xl min-h-[140px]">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center font-extrabold text-3xl text-white shadow-lg shadow-indigo-500/20">
            GT
          </div>
          <div className="w-8 h-8 border-[3px] border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <LoadingQuote quote={quote} visible={quoteVisible} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 px-8 text-center">
      <div className="w-8 h-8 border-[3px] border-indigo-500 border-t-transparent rounded-full animate-spin" />
      <div className="max-w-2xl min-h-[80px] flex items-center justify-center">
        <LoadingQuote quote={quote} visible={quoteVisible} />
      </div>
    </div>
  );
}
