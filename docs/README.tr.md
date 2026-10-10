# Filemigo Canvas — Türkçe

54 vektörel şekil, 16 diyagram şablonu, JavaScript diyagram kütüphanesi ve 15 araçlı yerel MCP sunucusu. Sürüm: **0.2.2**.

## Kurulum

Node.js 22 veya üstünü kur. GitHub'da **Code → Download ZIP** ile indirip klasöre çıkar veya:

```sh
git clone https://github.com/latecafe-tech/filemigo-canvas.git
cd filemigo-canvas
npm ci --ignore-scripts
npm test
```

MCP destekleyen yapay zekâ uygulamasında yerel stdio sunucusu ekle. Komut `node`, argüman ise `src/mcp.mjs` dosyasının tam yolu olmalı. Örnek: `C:/Projects/filemigo-canvas/src/mcp.mjs`. Tam JSON ayarı [ana README](../README.md) içinde. Uygulamaya göre ayar alanları değişebilir. Yalnızca uzak HTTP sunucusu destekleyen istemciler bu yerel pakete doğrudan bağlanamaz.

“Filemigo ile stok kontrolü ve açık Evet/Hayır dalları içeren bir sipariş akışı oluştur; doğrula, SVG ve proje JSON'u üret” diye iste. Sunucu çıktı metni döndürür; dosyayı kaydetmek yapay zekâ uygulamasının dosya araçlarına aittir. Proje JSON'unu [Filemigo tuvalindeki](https://filemigo.com/tr/canvas/) **Aç** düğmesiyle açabilirsin.

Bu paket diyagram motorudur; sürükle bırak editörünü paketlemez ; isteğe bağlı Canlı MCP ile açık tuval düzenlenebilir. `.drawio` içe aktarma yoktur. İlk kurulum npm bağımlılıklarını indirir; Canlı MCP yalnızca bilgisayarında kimlik doğrulamalı bağlantı açar; model çağrısı yapmaz. Kullandığın LLM'nin aboneliği ve veri işleme koşulları ayrıdır.

150 nesne, 200 bağlantı, 1.000.000 girdi karakteri. MCP işlem süresi sınırı 10 saniye. Geçerli yapı, doğru iş mantığı garantisi değildir. İlişkileri ve uyarıları kontrol et. Orijinal Filemigo kaynak kodu MIT lisanslıdır.

## Canlı tuval

MCP istemcisinde `filemigo_live_start` çağrısını iste. [Tuvalde](https://filemigo.com/tr/canvas/) **Canlı MCP** panelini açıp eşleştirme kodunu yapıştır. Bu işlem tuvalini o AI istemcisine açar; kodu paylaşma veya URL içine koyma. Bir oturumda tek sekme eşleşir.

AI önce `filemigo_live_read` ile sürümü okur; `filemigo_live_update` veya `filemigo_live_arrange` çağrısında `expectedRevision` gönderir. Sen arada düzenleme yaparsan eski işlem reddedilir. Değişiklikler geri alınabilir. Duraklatma ve bağlantıyı kesme düğmeleri kontrolü sende tutar. İlişki veya metin değiştirmek için kullanıcı isteğine dayanan `allowSemanticChanges: true` gerekir.

Yerel Node/stdio MCP istemcisi gerekir; yalnızca bulut üzerinden çalışan istemciler bilgisayarındaki köprüye ulaşamaz. Tarayıcı yerel bağlantı izni isteyebilir. Güvenlik ayarlarını kapatma; izin verilmezse dosya aktarımıyla çalışmaya devam edebilirsin. Tuval görünür olmalıdır; arka plan sekmelerinde AI düzenlemesi durur. Bağlantı gecikmesinde başarı varsayılmaz; AI önce güncel tuvali yeniden okumalıdır.

Bir **Late Cafe Games** projesi. Orijinal geliştirici ve katkıcı: **SezerGNDZ**.

WebMCP destekleyen tarayıcılarda **Tarayıcı asistanını bağla** ile kurulum olmadan canlı çalışabilirsin. Diğer istemcilerde yerel bağlantı penceresi açılırsa açık tutup tuvale dön. Pencere engellenirse doğrudan bağlantı için tarayıcı yerel erişim izni isteyebilir.
