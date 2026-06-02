import {Component, effect, inject, Input, input, OnInit} from '@angular/core';
import {DatePipe} from "@angular/common";
import {Article} from '@shared/models/Content.model';
import {Router, RouterLink} from '@angular/router';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  selector: 'mrf-article-card',
  standalone: true,
  imports: [DatePipe, RouterLink, TranslatePipe],
  templateUrl: './article-card.html',
  styleUrl: './article-card.scss',
})
export class ArticleCard {
  private router = inject(Router);

  @Input() article!: Article | null;

  readPost(): void {
    if (!this.article) return;
    this.router.navigate([
      '/insights',
      this.article.category.slug,
      this.article.slug,
    ]);
  }

}
