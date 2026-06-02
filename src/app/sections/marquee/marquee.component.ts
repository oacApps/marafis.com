import { Component, inject } from '@angular/core';
import { ContentService } from '@core/services/content.service';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  selector: 'mrf-marquee',
  standalone: true,
  imports: [
    TranslatePipe
  ],
  templateUrl: './marquee.component.html',
  styleUrls: ['./marquee.component.scss'],
})
export class MarqueeComponent {
  protected readonly content = inject(ContentService);

  // Duplicate items to create seamless loop
  get doubledItems(): string[] {
    return [...this.content.marqueeItems, ...this.content.marqueeItems];
  }
}
