export interface CoreValue {
  id: string;
  letter: string;
  word: string;
  description: string;
  display_order: number;
}
export interface FacultyMember {
  id: string;
  name: string;
  role: string;
  education: string;
  experience: string;
  academic_rank: string;
  image: string;
  member_type: string;
  display_order: number;
}

export interface AboutStat {
  id: string;
  label: string;
  count: string;
  display_order: number;
}
export interface CoreValueCard {
  id: string;
  value_name: string;
  display_order: number;
}
export interface ClubStatistic {
  id: string;
  label: string;
  value: string;
  display_order: number;
}
export interface Organization {
  id: string;
  name: string;
  type: string;
  description: string;
  members: string;
  motto: string;
  display_order: number;
}
export interface Committee {
  id: string;
  committee_code: string;
  full_name: string;
  description: string;
  focus: string;
  display_order: number;
}

export interface ResearchPublication {
  id: string;
  title: string;
  authors: string;
  journal: string;
  year: string;
  category: string;
  external_link?: string;
  display_order: number;
}

export interface ResearchAchievement {
  id: string;
  title: string;
  recipient: string;
  year: string;
  organization: string;
  display_order: number;
}

export interface FeaturedAlumni {
  id: string;
  name: string;
  graduation_year: string;
  position: string;
  achievement: string;
  image: string;
  display_order: number;
}
