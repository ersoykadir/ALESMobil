# ALESMobil

Mobil tarayıcıda kullanılabilen, bağımsız bir ALES kendi kendine çalışma prototipi. Başlangıç koleksiyonu **6 Sayısal + 6 Sözel özgün örnek** içerir. ÖSYM ile bağlantılı değildir.

## Çalıştırma

Node.js 20 veya üzeri gerekir. Harici paket kurulumu ve derleme gerekmez.

```sh
npm run dev
```

Tarayıcıda `http://127.0.0.1:4173` adresini açın. Statik barındırma için `dist/` klasörünü kullanın. ES modülleri nedeniyle dosyaları `file://` ile açmayın.

```sh
npm test
npm run check
```

## Çalışma akışı

- Sayısal veya Sözel bölümünü seçin, bir şık işaretleyin ve **Cevabı kontrol et** düğmesine dokunun.
- Gönderimden sonra şıklar kilitlenir; kendi cevabınız ve doğru cevap metinle gösterilir.
- Yazılı çözümü isteğe bağlı açın. Geometri örneğinde ayrıca **Şekil üzerinde keşfet** ile başlangıç + dört çözüm adımını gezin.
- Soru haritası ve önceki/sonraki düğmeleriyle gezinin. Yanlışlar ve kaydedilenler filtrelerini kullanın.
- **Yeniden dene**, o sorunun cevabını temizler; yıldız işaretini korur. Sayaç, son gönderilen cevapları sayar; geçmiş deneme günlüğü değildir.
- Cevaplar, taslak seçimler, yıldızlar, aktif koleksiyon ve son soru aynı tarayıcıda `localStorage` ile saklanır. Çözüm panelinin açık/kapalı durumu ve filtre kalıcı değildir.
- Kayıt engelliyse veya kota doluysa uygulama oturum boyunca çalışır ve kayıt uyarısını gösterir.

## İçerik ve izinler

Bu depoda sınav PDF’si, taranmış sayfalar, orijinal sınav çizimleri veya tam telifli test bulunmaz. Verilen referans dosyaları yalnızca yerel inceleme amacıyla kullanılmıştır. Başlangıç soruları özgündür; PDF’den doğrulanmış sınav sorusu olarak sunulmaz. Referans geometri sorusunun yerine farklı şekil, kurgu ve değerlerle özgün bir ikizkenar üçgen örneği hazırlanmıştır.

10 sorunun yazılı açıklaması vardır; 2 soruda `explanation: null` durumu özellikle gösterilir. Bu soruların cevap anahtarı vardır, ayrıntılı çözümün henüz eklenmediği açıkça belirtilir.

## İzinli soru verisi ekleme

**İçerik ve ayarlar** bölümünden kullanım hakkı onayını vererek JSON dosyası seçin. Şablon: [`dist/licensed-bank.example.json`](dist/licensed-bank.example.json). Ayrıntılı alan sözleşmesi: [`docs/CONTENT.md`](docs/CONTENT.md).

Dosyalar yalnızca cihazda okunur; bir sunucuya yüklenmez. En çok 1 MB ve 200 soru kabul edilir. Bir içe aktarılmış koleksiyon saklanır; yeni paket bunun yerini alır. Özgün örneklere geri dönülebilir. Paket metni HTML olarak çalıştırılmaz; içe aktarılmış etkileşim veya çizim kabul edilmez.

İçe aktarma lisansın hukuki geçerliliğini veya cevapların kaynakla eşleşmesini doğrulamaz. Her içe aktarılmış soru **Kaynak kontrolü yapılmadı** etiketi alır; dosyada `verified` yazılması bu durumu değiştirmez. İçerik değişirse eski cevaplar yeni içerikle yanlış eşleşmemesi için sıfırlanır.

## Sınırlar

Bu bir örnek koleksiyonudur, tam 2021 ALES/1 testi değildir. Hesap, bulut eşitleme, deneme sınavı puanı veya çevrimdışı uygulama önbelleği yoktur. Tarayıcı verileri silinirse ilerleme de silinir. Geometri etkileşimi bu prototipte tek özgün örnekle sınırlıdır. Kaynak doğrulamalı bir soru bankası yayımlamak için izinli veri ve insan incelemesi gerekir.
