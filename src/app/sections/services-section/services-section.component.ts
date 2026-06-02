import { Component, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ContentService }         from '@core/services/content.service';
import { RevealDirective }        from '@core/directives/reveal.directive';
import { ServiceItem }            from '@shared/models/Service.model';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  selector: 'mrf-services-section',
  standalone: true,
  imports: [RevealDirective, TranslatePipe],
  templateUrl: './services-section.component.html',
  styleUrls: ['./services-section.component.scss'],
})
export class ServicesSectionComponent {
  protected readonly content   = inject(ContentService);
  private  readonly sanitizer  = inject(DomSanitizer);

  safeIcon(service: ServiceItem): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(service.svgPath);
  }

  trackByNum(_: number, s: ServiceItem): string {
    return s.number;
  }
}
