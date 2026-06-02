import {Component, inject, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import {Article} from '@shared/models/Content.model';
import { StrapiService } from '@core/services/strapi.service';
import {FeaturedArticle} from '@pages/blog/common/featured-article/featured-article';
import {RecentArticle} from '@pages/blog/common/recent-article/recent-article';
import {MostReadArticle} from '@pages/blog/common/most-read-article/most-read-article';
import {ActivatedRoute, Router} from '@angular/router';
import {ArticleTopics} from '@pages/blog/common/article-topics/article-topics';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  selector: 'app-blog-index',
  standalone: true,
  imports: [CommonModule, FeaturedArticle, RecentArticle, MostReadArticle, ArticleTopics, TranslatePipe],
  templateUrl: './blog-index.component.html',
  styleUrls: ['./blog-index.component.scss']
})
export class BlogIndexComponent implements OnInit{
  private strapiService = inject(StrapiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  categories: string[] = ['All'];
  activeCategory: string | null = 'All';

  public featuredArticle: Article | null = null;
  public recentArticles: Article[] = [];
  public mostReadArticles: Article[] = [];

  ngOnInit(): void {

    /*----------------- listen to route changes ----------------- */
    this.route.paramMap.subscribe(params => {
      const category = params.get('category');
     this.activeCategory = category ? category : "All";
      this.loadArticles(this.activeCategory);
    });

    /*----------------- API CALLS ------------------*/
    // getting all categories
    this.loadCategories();
  }

  private loadArticles(category: string ) {
    const filterCategory = category === 'All' ? null : category;
    // getting last 7 articles
    this.strapiService.getLatestArticle(filterCategory, 7).subscribe({
      next: (latestArticle) => {
        if (latestArticle && latestArticle.length > 0) {
          this.featuredArticle = latestArticle[0];
          this.recentArticles = [...latestArticle.slice(1)];
          this.mostReadArticles = [...latestArticle.slice(1, 4)];
        }
      },
      error: (err) => console.error('Failed to load articles', err)
    })
  }

  private loadCategories() {
    this.strapiService.getCategories().subscribe({
      next: (apiCategories) => {
        this.categories = ['All', ...apiCategories];
      },
      error: (err) => console.error('Failed to load categories', err)
    });
  }

  setCategory(category: string) {

    if(category === 'All') {
      this.router.navigate(['/insights']);
      return;
    }

    this.router.navigate(['/insights', this.getCategorySlug(category)]);
  }

  // helper used in template to compare display label against
  // URL slug — categories arrive as "AI & Engineering" from Strapi but
  // activeCategory is stored as the slug "ai-engineering" from the route.
  getCategorySlug(category: string): string {
    if (category === 'All') return 'All';
    return category
      .toLowerCase()
      .replace(/&/g, '')
      .replace(/\s+/g, '-')
      .replace(/-{2,}/g, '-')
      .replace(/^-|-$/g, '');
  }
}
