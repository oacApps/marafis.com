import { Component } from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  selector: 'mrf-article-topics',
  imports: [
    TranslatePipe
  ],
  templateUrl: './article-topics.html',
  styleUrl: './article-topics.scss',
})
export class ArticleTopics {

}
