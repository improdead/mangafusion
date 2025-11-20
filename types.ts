export interface Manga {
  id: string;
  title: string;
  image: string;
  tags: string[];
  description?: string;
  author?: string;
}

export interface RecommendationResponse {
  recommendations: Manga[];
  reasoning: string;
}
