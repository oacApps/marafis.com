import { Component, inject } from '@angular/core';
import { ContentService }    from '@core/services/content.service';
import { RevealDirective }   from '@core/directives/reveal.directive';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  selector: 'mrf-about',
  standalone: true,
  imports: [RevealDirective, TranslatePipe],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
})
export class AboutComponent {
  protected readonly content = inject(ContentService);
}
