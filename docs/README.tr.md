# Filemigo Canvas — Türkçe

Sürüm **0.4.0**: Windows masaüstü uygulaması, 54 şekil, 16 şablon ve 18 araçlı MCP sunucusu.

## Masaüstü kurulumu

1. [Windows ZIP paketini indir](https://github.com/latecafe-tech/filemigo-canvas/releases/tag/v0.4.0). Tamamını kalıcı bir klasöre çıkar; Filemigo.exe dosyasını aç.
2. **MCP kurulumu** düğmesindeki JSON ayarını yerel stdio MCP istemcine ekle ve istemciyi yeniden başlat. Ayrı Node.js kurulumu gerekmez.
3. Uygulamada **AI bağlantısını aç** düğmesine bas. Asistanından filemigo_live_start ve filemigo_live_read çağrısını iste.
4. Çizdiklerini masaüstündeki tuvalde canlı gör, elle düzenle, duraklat veya geri al. Ctrl+S ile kaydet; Ctrl+Shift+S ile farklı kaydet.

Canlı MCP artık masaüstünde çalışır. Web sitesinde kurulum gerektirmeyen bağımsız editör devam eder. Tarayıcı eşleştirme kodu gerekmez.

[Ayrıntılı masaüstü rehberi](desktop.md) · [SDK ve geliştirici kurulumu](../README.md) · [Değişiklik sözleşmesi](patches.md)

## Kapsam

- İlk masaüstü paketi Windows x64 için taşınabilir ve imzasızdır. Otomatik güncelleme, mağaza kaydı ve macOS/Linux paketi henüz yok.
- AI erişimi kapalı başlar. Açtığında tuvalin yapılandırdığın AI istemcisine aktarılır. AI sağlayıcının internet, ücret ve veri koşulları ayrıdır.
- Eski sürüme yazma, kilitli nesne değiştirme ve aktif düzenlemeyle çakışma reddedilir. Yerleşim ilişkileri korur; iş mantığının doğruluğunu matematiksel olarak kanıtlamaz.
- filemigo_preview_changes değişiklik dökümü verir; filemigo_show_diagram uyumlu MCP Apps istemcisinde sohbet önizlemesi açar. Önizleme açık masaüstü tuvaline otomatik yazılmaz.
- Desteklenen draw.io XML içe/dışa aktarımı ve düzenlenebilir SVG vardır. Çoklu katmanlar, gruplar, özel şekiller ve sıralama blokları draw.io aktarımında desteklenmez.
- 150 nesne / 200 bağlantı. Kalıcı proje yedeği için JSON veya düzenlenebilir SVG kullan.

Bir **Late Cafe Games** projesi. Geliştirici ve katkıcı: **SezerGNDZ**. MIT lisanslı.
