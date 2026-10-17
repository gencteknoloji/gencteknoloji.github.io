# Git Sync Rule

- Occasionally check `git status` and pull updates (`git pull` or hard reset to `origin/main` if histories diverged) from the GitHub remote branch to avoid merge conflicts and ensure you are working on the most up-to-date code.

# Prompt Workflow Rule (İş Akışı Kuralı)

- Her prompt/görev sonunda yaptığın işleri sırasıyla şu adımlarla tamamla:
  1. Yapılan işleri en son doğrulama araçları (linter vb.) ile kontrol et.
  2. Eğer veritabanı şeması veya sorgular değiştiyse, veritabanı migration işlemlerini gerçekleştir.
  3. Projeyi derle/build et (örn: `npm run build`) ve derleme hatası olmadığından emin ol.
  4. Değişiklikleri otomatik olarak git üzerinde commit et ve remote branch'e pushla.
