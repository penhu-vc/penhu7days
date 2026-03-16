import Link from "next/link";
import { universeSites, type UniverseSiteStage } from "@/data/penhu-universe-sites";
import styles from "./universe.module.css";

const stageText: Record<UniverseSiteStage, string> = {
  live: "已上線",
  building: "製作中",
  planned: "預留",
};

const stageClassName: Record<UniverseSiteStage, string> = {
  live: styles.live,
  building: styles.building,
  planned: styles.planned,
};

export default function PenhuUniversePage() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.hero}>
          <p className={styles.kicker}>PENHU UNIVERSE</p>
          <h1 className={styles.title}>Penhu 宇宙入口站</h1>
          <p className={styles.subtitle}>本地總入口，後續給 Penhu 的所有網站都會集中在這裡。</p>
          <div className={styles.actions}>
            <a className={styles.primaryBtn} href="http://localhost:3000" target="_blank" rel="noreferrer">
              開啟本地主站
            </a>
            <a className={styles.ghostBtn} href="https://penhu.xyz" target="_blank" rel="noreferrer">
              開啟正式站
            </a>
          </div>
        </header>

        <section className={styles.grid}>
          {universeSites.map((site) => (
            <article key={site.id} className={styles.card}>
              <div className={styles.cardTop}>
                <div>
                  <h2 className={styles.cardTitle}>{site.name}</h2>
                  <p className={styles.cardSubtitle}>{site.subtitle}</p>
                </div>
                <span className={`${styles.badge} ${stageClassName[site.stage]}`}>{stageText[site.stage]}</span>
              </div>

              <p className={styles.cardDesc}>{site.description}</p>

              <div className={styles.tagWrap}>
                {site.tags.map((tag) => (
                  <span key={tag} className={styles.tag}>
                    {tag}
                  </span>
                ))}
              </div>

              <div className={styles.cardActions}>
                {site.href ? (
                  <a className={styles.linkBtn} href={site.href} target="_blank" rel="noreferrer">
                    正式網址
                  </a>
                ) : (
                  <button className={styles.linkBtn} type="button" disabled>
                    尚未建立
                  </button>
                )}

                {site.localHref ? (
                  <a className={styles.linkBtn} href={site.localHref} target="_blank" rel="noreferrer">
                    本地網址
                  </a>
                ) : (
                  <button className={styles.linkBtn} type="button" disabled>
                    本地待建立
                  </button>
                )}
              </div>
            </article>
          ))}
        </section>

        <footer className={styles.footer}>
          <p>要新增新站點：編輯 <code>/Users/yaja/projects/penhu7days/data/penhu-universe-sites.ts</code></p>
          <Link href="/" className={styles.backLink}>
            回到當前主頁
          </Link>
        </footer>
      </div>
    </main>
  );
}
