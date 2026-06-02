import { Component, inject } from '@angular/core';
import { RouterLink }        from '@angular/router';
import { ContentService }    from '@core/services/content.service';
import { RevealDirective }   from '@core/directives/reveal.directive';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  selector: 'mrf-cta',
  standalone: true,
  imports: [RouterLink, RevealDirective, TranslatePipe],
  templateUrl: './cta.component.html',
  styleUrls: ['./cta.component.scss'],
})
export class CtaComponent {
  protected readonly content = inject(ContentService);
}
