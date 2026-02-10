export interface Session {
  id: number;
  depot: string;
  date: string; // SQL Dates come as strings in JSON
  group_article: string;
  valide: number; // 0 = En cours, 1 = Validé
  id_chef: string;
  id_control: string | null;
}
