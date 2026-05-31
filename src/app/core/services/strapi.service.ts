import { Injectable, inject } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import {Article, BlogPost} from '@shared/models/Content.model';
import { environment } from '../../../environments/environment';
import qs from "qs";
import {markdownToHtml} from '@shared/rich-text-to-html';

@Injectable({
  providedIn: 'root'
})
export class StrapiService {
  private http = inject(HttpClient);
  private baseUrl = environment.strapiApiUrl;

  // ── Categories ──────────────────────────────────────────────────
  getCategories(): Observable<string[]> {
    // Tell Strapi to only select the 'name' field
    const params = new HttpParams().set('fields[0]', 'name');
    // No headers specified here; the interceptor injects them automatically!
    return this.http.get<{ data: any[] }>(`${this.baseUrl}/categories`, { params }).pipe(
      map(response => response.data.map(item => (item.name || '').trim())),
      catchError(error => {
        console.error('Strapi getCategories error:', error);
        return of([
          'Solution Architecture',
          'Cloud Transformation',
          'Microservices Design',
          'AI-Enabled Systems',
          'DevOps & Observability',
          'Platform Engineering',
          'Digital Modernisation',
          'Event-Driven Architecture',
        ]);
      })
    );
  }

  // ── Articles ────────────────────────────────────────────────────
  /**
   * Fetches the single latest article.
   * If a categoryName is provided, it filters by that category.
   */
  getLatestArticle(categoryName: string | null = null, limit: number = 1): Observable<Article[] | null> {
    const queryObj: any = {
      sort: ['publishedAt:desc'],
      pagination: { limit: limit },
      populate: 'category',
      filters: {},
    };

    if (categoryName && categoryName !== 'all') {
      queryObj.filters = {
        category: {
          slug: { $eq: categoryName.toLowerCase().replace(/\s+/g, '-') },
        },
      };
    }

    const queryString = qs.stringify(queryObj, { encodeValuesOnly: true });

    return this.http.get<{ data: any[] }>(`${this.baseUrl}/articles?${queryString}`).pipe(
      map(response =>
        response.data && response.data.length > 0
          ? this.mapArticles(response.data)
          : []
      ),
      catchError(error => {
        console.error('Strapi getLatestArticle error:', error);
        return of([]);
      })
    );
  }

  /**
   * Fetches a single article by its slug.
   * Uses Strapi filters to target one record.
   */
  getArticleBySlug(slug: string): Observable<Article | null> {
    const queryObj = {
      filters: { slug: { $eq: slug } },
      populate: '*',
    };
    const queryString = qs.stringify(queryObj, { encodeValuesOnly: true });
    console.log("queryString" + queryString);

    return this.http.get<{ data: any[] }>(`${this.baseUrl}/articles?${queryString}`).pipe(
      map(response => {
        if (response.data && response.data.length > 0) {
          console.log(JSON.stringify(response, null, 2));
          return this.mapArticles(response.data)[0];
        }
        return null;
      }),
      catchError(error => {
        console.error('Strapi getArticleBySlug error:', error);
        return of(null);
      })
    );
  }

  /**
   * Fetches related articles in the same category, excluding the current slug.
   */
  getRelatedArticles(categorySlug: string, excludeSlug: string, limit = 2): Observable<Article[]> {
    const queryObj = {
      filters: {
        category:  { slug: { $eq: categorySlug } },
        slug:      { $ne: excludeSlug },
      },
      sort: ['publishedAt:desc'],
      pagination: { limit },
      populate: 'category',
    };
    const queryString = qs.stringify(queryObj, { encodeValuesOnly: true });

    return this.http.get<{ data: any[] }>(`${this.baseUrl}/articles?${queryString}`).pipe(
      map(response =>
        response.data && response.data.length > 0
          ? this.mapArticles(response.data)
          : []
      ),
      catchError(() => of([]))
    );
  }

  // ── Private mapper ───────────────────────────────────────────────

  /**
   * Normalises raw Strapi v4/v5 response into the Article interface.
   * Handles both flattened (v5 unified) and nested attributes (v4) shapes.
   */
  private mapArticles(data: any[]): Article[] {
    return data.map(item => {

      const coreData = item.attributes ? item.attributes : item;

      const categoryRaw = coreData.category?.data?.attributes
        ? coreData.category.data
        : coreData.category;

      return {
        id:          String(item.documentId || item.id),
        slug:        coreData.slug        || '',
        tag:         categoryRaw?.attributes?.name || categoryRaw?.name || 'General',
        title:       coreData.title       || '',
        excerpt:     coreData.excerpt     || coreData.description || '',   // FIX 2b: map excerpt
        description: coreData.description || coreData.excerpt     || '',
        date:        coreData.publishedAt || coreData.date        || '',
        readTime:    coreData.readTime    || '5 min read',
        content:     markdownToHtml(coreData.blocks?.[0]?.body || ''),
        category: categoryRaw ? {
          id:   String(categoryRaw.documentId || categoryRaw.id || '0'),
          name: categoryRaw.attributes?.name || categoryRaw.name || '',
          slug: categoryRaw.attributes?.slug || categoryRaw.slug || '',
        } : { id: '0', name: 'General', slug: 'general' },
      };
    });
  }


}
