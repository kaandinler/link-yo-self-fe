import { useGetUsersService } from "@/services/api/services/users";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { createQueryKeys } from "@/services/react-query/query-key-factory";
import { useInfiniteQuery } from "@tanstack/react-query";
import { UserFilterType, UserSortType } from "../user-filter-types";

export const usersQueryKeys = createQueryKeys(["users"], {
  list: () => ({
    key: [],
    sub: {
      by: ({
        sort,
        filter,
      }: {
        filter: UserFilterType | undefined;
        sort?: UserSortType | undefined;
      }) => ({
        key: [sort, filter],
      }),
    },
  }),
});

export const useGetUsersQuery = ({
  sort,
  filter,
}: {
  filter?: UserFilterType | undefined;
  sort?: UserSortType | undefined;
} = {}) => {
  const fetch = useGetUsersService();

  const query = useInfiniteQuery({
    queryKey: usersQueryKeys.list().sub.by({ sort, filter }).key,
    initialPageParam: 1,
    queryFn: async ({ pageParam, signal }) => {
      const { status, data } = await fetch(
        {
          page: pageParam,
          limit: 10,
          search: filter?.search,
          isAdmin: filter?.isAdmin,
          orderBy: sort?.orderBy,
          order: sort?.order,
        },
        {
          signal,
        }
      );

      if (status === HTTP_CODES_ENUM.OK) {
        // Backend ortak zarf donuyor: kullanicilar data icinde, sayfalama
        // bilgisi meta icinde. Onceki hali {data, hasNextPage} bekliyordu ve
        // liste hep bos kaliyordu.
        return {
          data: data.data,
          nextPage: data.meta?.has_next_page ? pageParam + 1 : undefined,
        };
      }
    },
    getNextPageParam: (lastPage) => {
      return lastPage?.nextPage;
    },
    gcTime: 0,
  });

  return query;
};
