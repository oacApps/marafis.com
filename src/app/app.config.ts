import {ApplicationConfig, provideZoneChangeDetection} from '@angular/core';
import { provideRouter, withViewTransitions, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { strapiInterceptor } from '@core/interceptors/strapi.interceptor';
import {provideHttpClient, withFetch, withInterceptors} from '@angular/common/http';
import {provideTranslateService} from '@ngx-translate/core';
import {provideTranslateHttpLoader} from '@ngx-translate/http-loader';

// Directly check localStorage BEFORE configuring the service
const savedLanguage = typeof window !== 'undefined'
  ? localStorage.getItem('marafis-lang') || 'en'
  : 'en';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withViewTransitions(),
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled',
      })
    ),
    provideClientHydration(withEventReplay()),
    provideHttpClient(
      withFetch(),
      withInterceptors([strapiInterceptor])
    ),
    provideTranslateService({
      lang: savedLanguage,
      fallbackLang: 'en',
      // This automatically sets up the default /assets/i18n/*.json loader
      loader: provideTranslateHttpLoader()
    })
  ],
};
