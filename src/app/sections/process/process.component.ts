import { Component, inject } from '@angular/core';
import { ContentService }    from '@core/services/content.service';
import { RevealDirective }   from '@core/directives/reveal.directive';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  selector: 'mrf-process',
  standalone: true,
  imports: [RevealDirective, TranslatePipe],
  templateUrl: './process.component.html',
  styleUrls: ['./process.component.scss'],
})
export class ProcessComponent {
  protected readonly content = inject(ContentService);
}
