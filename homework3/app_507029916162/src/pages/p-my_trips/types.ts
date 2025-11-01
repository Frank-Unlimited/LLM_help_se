

export interface TripData {
  id: string;
  title: string;
  destination: string;
  dates: string;
  budget: number;
  spent?: number;
  status: 'draft' | 'active' | 'completed';
  image: string;
  imageAlt: string;
  imageCategory: string;
}

