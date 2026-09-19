import { SortEnum } from "@/services/api/types/sort-type";
import { User } from "@/services/api/types/user";

/**
 * Backend'de rol tablosu yok; yetki tek bir is_admin bayragi.
 * Onceki UserFilterType roles: Role[] bekliyordu ve hicbir uca karsilik
 * gelmiyordu.
 */
export type UserFilterType = {
  /** undefined: hepsi, true: sadece adminler, false: sadece normal kullanicilar. */
  isAdmin?: boolean;
  search?: string;
};

export type UserSortType = {
  orderBy: keyof User;
  order: SortEnum;
};
