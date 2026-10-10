# Filemigo Canvas — Türkçe

**Workflow oluştur, düzenle ve paylaş.** Çevrimdışı masaüstü editörü; 54 şekil, 16 şablon, temalar, otomatik yerleşim ve düzenlenebilir dışa aktarımlar sunar. AI bağlantısı ve skill isteğe bağlıdır.

Bu kaynak kod **0.6.1** sürümünü oluşturur: akış inceleme, sorumluluk ve girdi/çıktı alanları, senaryo takibi ve boş tuvalden kompakt MCP komutlarıyla workflow oluşturma. Tam MCP profilinde 26, agent profilinde 3 araç bulunur.

## Masaüstü kurulumu

Hazır [0.4.0 Windows ZIP paketi](https://github.com/latecafe-tech/filemigo-canvas/releases/tag/v0.4.0) önceki sürümdür; yeni özellikler için bu kaynak koddan 0.6.1 oluştur:

```sh
npm ci --ignore-scripts
node node_modules/electron/install.js
npm run desktop:package
```

Derleme Node.js 22+ gerektirir. Oluşan `out/Filemigo-win32-x64` klasörünün tamamını kalıcı bir konuma kopyalayıp `Filemigo.exe` dosyasını aç. Paketlenmiş uygulamayı çalıştırmak için ayrı Node.js kurulumu gerekmez. Yeni sürümü açmadan önce eski uygulamada çizimini kaydet ve uygulamayı kapat.

Çizimini elle oluşturabilir, düzenleyebilir ve geri alabilirsin. Ctrl+S ile kaydet; Ctrl+Shift+S ile farklı kaydet. Normal editör kullanımı için MCP bağlantısı gerekmez.

## İsteğe bağlı AI bağlantısı

1. **MCP kurulumu** düğmesindeki JSON ayarını yerel stdio MCP istemcine ekle ve istemciyi yeniden başlat.
2. Uygulamada **AI bağlantısını aç** düğmesine bas. Tam profilde asistanından `filemigo_live_start` ve `filemigo_live_read` çağrısını iste.
3. Yalnızca kompakt workflow işlemleri için sunucu ortamına `FILEMIGO_MCP_PROFILE=agent` ekleyebilirsin. `filemigo_agent_contract`, `filemigo_agent_read` ve `filemigo_agent_patch` ile oku, oluştur ve düzenle. [Protokol ve örnekler](agent-protocol.md).

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
