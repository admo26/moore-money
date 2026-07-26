/**
 * Minimal typings for the shapes we actually use from the Akahu API.
 * See https://developers.akahu.nz/docs/the-account-model and
 * https://developers.akahu.nz/docs/the-transaction-model for the full models.
 */

export interface AkahuMeResponse {
  success: boolean;
  item: {
    _id: string;
    email?: string;
  };
}

export interface AkahuAccount {
  _id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
  type: string;
  formatted_account?: string;
  connection: {
    _id: string;
    name: string;
    logo?: string;
    connection_type?: "classic" | "official";
  };
  balance?: {
    current: number;
    available?: number;
    limit?: number;
    currency: string;
  };
  refreshed?: {
    balance?: string;
    transactions?: string;
    meta?: string;
    party?: string;
  };
}

export interface AkahuTransaction {
  _id: string;
  _account: string;
  _connection?: string;
  created_at: string;
  date: string;
  description: string;
  amount: number;
  balance?: number;
  type?: string;
  category?: {
    _id: string;
    name: string;
    groups?: {
      personal_finance?: { _id: string; name: string };
    };
  };
  merchant?: {
    _id: string;
    name: string;
    website?: string;
  };
  meta?: Record<string, unknown>;
}

export interface AkahuListResponse<T> {
  success: boolean;
  items: T[];
  cursor?: {
    next: string | null;
  };
}
