import {Component, inject, Input, OnInit, signal} from '@angular/core';
import {DatePipe} from '@angular/common';
import {Article} from '@shared/models/Content.model';
import {RouterLink} from '@angular/router';
import {StrapiService} from '@core/services/strapi.service';
import {TranslatePipe} from '@ngx-translate/core';


@Component({
  selector: 'mrf-featured-article',
  standalone: true,
  imports: [DatePipe, RouterLink, TranslatePipe],
  templateUrl: './featured-article.html',
  styleUrls: ['./featured-article.scss']
})
export class FeaturedArticle implements OnInit {

  private strapi = inject(StrapiService);

  @Input() featuredArticle: Article | null = null;

  ngOnInit(): void {
    if (!this.featuredArticle) {
      this.strapi.getLatestArticle(null, 1).subscribe({
        next: (articles) => {
          // @ts-ignore
          this.featuredArticle = articles.length > 0 ? articles[0] : null;
        },
        error: (err) => console.error('FeaturedArticle load error:', err),
      });
    }
  }
}
