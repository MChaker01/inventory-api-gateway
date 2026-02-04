// Represents a Row from the 'Article' Table
export interface IArticle {
  groupe: string;
  famille: string;
  souss_famille: string;
  code_article: string;
  article: string;
  // The '?' means this is optional (it might be null)
  Qrcode?: string | null; // It can be a string, or empty/null
  Prix: number;
}

// Represents a Row from the 'Groupe_stock' Table
export interface ISession {
  id: number;
  depot: string;
  group_article: string;
  valide: number;
  date: Date;
  id_chef: string;
  id_control?: string | null;
}

// Represents a Row from the 'Stock_item' Table
export interface IStockItem {
  id: number;
  id_article: string;
  id_group_stock: number;
  qte_physique: number;
  qte_globale: number;
  date: Date;
  id_control?: string | null;
  qte_perime_ph?: number;
  description?: string | null;
  qte_perime_nr: number;
}

// Represents a Row from the 'Users' Table
export interface IUser {
  username: string;
  password: string;
  role: string;
  Adress?: string | null;
  telephone?: string | null;
  deleted?: string | null;
  date_deleted?: Date | null;
}
