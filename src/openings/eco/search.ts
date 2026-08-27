import { EcoLoader } from './loader';
import { EcoOpeningRecord, EcoSearchResult } from './types';

export class EcoSearchEngine {
  public static search(query: string): EcoSearchResult[] {
    const records = EcoLoader.loadNormalizedRecords();
    const q = query.trim().toLowerCase();

    if (!q) {
      return records.map(r => ({ record: r, relevanceScore: 100, matchedBy: 'name' }));
    }

    const results: EcoSearchResult[] = [];

    for (const record of records) {
      let score = 0;
      let matchedBy: 'name' | 'eco' | 'alias' | 'move' | 'category' = 'name';

      // 1. ECO Code Match (Exact or prefix e.g. "B12")
      if (record.eco.toLowerCase() === q) {
        score += 100;
        matchedBy = 'eco';
      } else if (record.eco.toLowerCase().startsWith(q)) {
        score += 80;
        matchedBy = 'eco';
      }

      // 2. Name Match
      const nameLower = record.name.toLowerCase();
      if (nameLower === q) {
        score += 95;
        matchedBy = 'name';
      } else if (nameLower.includes(q)) {
        score += 70;
        matchedBy = 'name';
      }

      // 3. Alias Match
      if (record.aliases) {
        for (const alias of record.aliases) {
          if (alias.toLowerCase() === q) {
            score += 90;
            matchedBy = 'alias';
            break;
          } else if (alias.toLowerCase().includes(q)) {
            score += 65;
            matchedBy = 'alias';
            break;
          }
        }
      }

      // 4. Starting Move String Match e.g. "1.e4" or "e4 c6"
      const moveStr = record.moves.join(' ').toLowerCase();
      if (moveStr.includes(q) || q.includes(record.moves[0]?.toLowerCase() || '')) {
        if (score < 50) {
          score += 50;
          matchedBy = 'move';
        }
      }

      // 5. Category Match
      if (record.category.toLowerCase().includes(q) && score < 40) {
        score += 40;
        matchedBy = 'category';
      }

      if (score > 0) {
        results.push({ record, relevanceScore: score, matchedBy });
      }
    }

    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  public static getByEco(eco: string): EcoOpeningRecord | undefined {
    return EcoLoader.loadNormalizedRecords().find(r => r.eco.toLowerCase() === eco.toLowerCase());
  }

  public static getByFingerprint(fingerprintKey: string): EcoOpeningRecord | undefined {
    return EcoLoader.loadNormalizedRecords().find(r => r.fingerprintKey === fingerprintKey);
  }
}
