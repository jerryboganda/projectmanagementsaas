export interface SearchResultItem {
  entityType: string;
  entityId: string;
  title: string;
  snippet: string | null;
  rank: number;
}

export interface SearchResponse {
  data: SearchResultItem[];
  totalCount: number;
}
