import {Component, effect, inject, input, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {Article} from '@shared/models/Content.model';
import {ArticleCard} from '@pages/blog/common/article-card/article-card';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  selector: 'mrf-recent-article',
  standalone: true,
  imports: [
    ArticleCard,
    TranslatePipe
  ],
  templateUrl: './recent-article.html',
  styleUrls: ['./recent-article.scss']
})
export class RecentArticle implements OnChanges {

  @Input() public recentArticles: Article[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    // Fires whenever the parent pushes a new array reference down
    if (changes['recentArticles']) {
      const current = changes['recentArticles'].currentValue as Article[];
    }
  }
}
