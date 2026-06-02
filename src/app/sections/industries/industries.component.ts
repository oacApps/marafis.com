import { Component, inject } from '@angular/core';
import { ContentService }    from '@core/services/content.service';
import { RevealDirective }   from '@core/directives/reveal.directive';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  selector: 'mrf-industries',
  standalone: true,
  imports: [RevealDirective, TranslatePipe],
  templateUrl: './industries.component.html',
  styleUrls: ['./industries.component.scss'],
})
export class IndustriesComponent {
  protected readonly content = inject(ContentService);
}
