import {Component, computed, inject, OnDestroy, OnInit, PLATFORM_ID, signal} from '@angular/core';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {DomSanitizer, Meta, SafeHtml, Title} from '@angular/platform-browser';
import {Article} from '@shared/models/Content.model';
import {StrapiService} from '@core/services/strapi.service';
import {DatePipe, isPlatformBrowser} from '@angular/common';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  selector: 'mrf-article-details',
  imports: [RouterLink, DatePipe, TranslatePipe],
  templateUrl: './article-details.html',
  styleUrl: './article-details.scss',
})
export class ArticleDetails implements OnInit, OnDestroy {

  private readonly route      = inject(ActivatedRoute);
  private readonly router     = inject(Router);
  private readonly strapi     = inject(StrapiService);
  private readonly titleSvc   = inject(Title);
  private readonly meta       = inject(Meta);
  private readonly platformId = inject(PLATFORM_ID);
  currentURL='';
  content!: SafeHtml;

  // ── State ─────────────────────────────────────────────────────────
  readonly post  = signal<Article | null>(null);
  readonly related  = signal<Article[]>([]);
  readonly loading  = signal(true);
  readonly progress = signal(0);

  readonly readLabel = computed(() => {
    const p = this.progress();
    if (p < 5)  return 'Just started';
    if (p < 95) return `${Math.round(p)}% through`;
    return 'Finished';
  });

  private scrollHandler?: () => void;

  constructor(private sanitizer: DomSanitizer) {
    this.currentURL = this.router.url;
  }


  // ── Lifecycle ─────────────────────────────────────────────────────
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const slug     = params.get('slug')     ?? '';
      const category = params.get('category') ?? '';

      if (!slug) {
        this.router.navigate(['/insights']);
        return;
      }

      this.loading.set(true);

      // FIX 4a: use dedicated getArticleBySlug() instead of find() on full list
      this.strapi.getArticleBySlug(slug).subscribe({
        next: (article) => {
          if (!article) {
            this.router.navigate(['/insights']);
            return;
          }

          if (typeof article.content === "string") {
            this.content = this.sanitizer.bypassSecurityTrustHtml(
              article.content
            );
          }
          this.post.set(article);
          this.loading.set(false);
          this.updateMeta(article);

          // FIX 4b: use getRelatedArticles() instead of non-existent getRelated()
          this.strapi.getRelatedArticles(
            article.category.slug,
            slug,
            2
          ).subscribe(rel => this.related.set(rel));

          // FIX 4c: SSR-safe scroll and scroll listener
          if (isPlatformBrowser(this.platformId)) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            this.attachScrollListener();
          }
        },
        error: () => this.router.navigate(['/insights']),
      });
    });
  }

  ngOnDestroy(): void {
    // 4d: clean up scroll listener to prevent memory leaks
    if (this.scrollHandler && isPlatformBrowser(this.platformId)) {
      window.removeEventListener('scroll', this.scrollHandler);
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────
  private updateMeta(post: Article): void {
    this.titleSvc.setTitle(`${post.title} | Marafis`);
    this.meta.updateTag({ name: 'description',        content: post.excerpt });
    this.meta.updateTag({ property: 'og:title',       content: post.title  });
    this.meta.updateTag({ property: 'og:description', content: post.excerpt });
  }

  private attachScrollListener(): void {
    this.scrollHandler = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      this.progress.set(docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0);
    };
    window.addEventListener('scroll', this.scrollHandler, { passive: true });
  }

  copyCode(code: string, btn: HTMLButtonElement): void {
    navigator.clipboard.writeText(code).then(() => {
      btn.textContent = 'Copied';
      setTimeout(() => (btn.textContent = 'Copy'), 2000);
    });
  }

}
