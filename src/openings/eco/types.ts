export interface EcoOpeningRecord {
  eco: string;
  name: string;
  variation?: string;
  aliases: string[];
  moves: string[]; // SAN array e.g. ["e4", "c6", "d4", "d5"]
  fen?: string;
  fingerprintKey?: string;
  color: 'WHITE' | 'BLACK' | 'BOTH';
  category: string; // e.g. "Flank Openings", "Semi-Open Games", "Closed Games"
  parentEco?: string;
}

export interface EcoSearchResult {
  record: EcoOpeningRecord;
  relevanceScore: number;
  matchedBy: 'name' | 'eco' | 'alias' | 'move' | 'category';
}
