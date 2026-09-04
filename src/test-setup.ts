import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';

// Mirrors the registration done in main.ts: components using the "fr" locale
// (e.g. CollectionItemCard's CurrencyPipe) need this data available in tests too.
registerLocaleData(localeFr);
