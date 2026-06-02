import {Component, inject, PLATFORM_ID, signal} from '@angular/core';
import {AsyncPipe, isPlatformBrowser} from '@angular/common';
import { RouterLink }          from '@angular/router';
import { ScrollService }        from '@core/services/scroll.service';
import { ContentService }      from '@core/services/content.service';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'mrf-navbar',
  standalone: true,
  imports: [AsyncPipe, RouterLink, TranslatePipe],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent {
  private readonly translate = inject(TranslateService);
  protected readonly scroll   = inject(ScrollService);
  protected readonly content  = inject(ContentService);

  private readonly platformId = inject(PLATFORM_ID);
  protected currentLanguage = signal(this.getInitialLanguage());

  private getInitialLanguage(): string {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('marafis-lang') || this.translate.getCurrentLang() || 'en';
    }
    return 'en';
  }

  switchLanguage(lang: string): void {
    this.translate.use(lang);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('marafis-lang', lang);
    }
    this.currentLanguage.set(lang);
  }
}
