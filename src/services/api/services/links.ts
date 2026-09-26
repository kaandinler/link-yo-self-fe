// src/services/api/services/links.ts - Daha iyi versiyon
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_URL } from "@/services/api/config";
import useFetch from "@/services/api/use-fetch";
import { ANALYTICS_QUERY_KEY } from "@/services/api/services/analytics";

// Types
export interface Link {
  id: number;
  title: string;
  url: string;
  description?: string;
  icon_url?: string;
  background_color?: string;
  text_color?: string;
  border_radius?: number;
  order_index: number;
  is_active: boolean;
  click_count: number;
  created_at: string;
  updated_at: string;
  user_id: number;
}

export interface CreateLinkRequest {
  title: string;
  url: string;
  description?: string;
  icon_url?: string;
  background_color?: string;
  text_color?: string;
  border_radius?: number;
  is_active?: boolean;
}

export interface UpdateLinkRequest {
  title?: string;
  url?: string;
  description?: string;
  icon_url?: string;
  background_color?: string;
  text_color?: string;
  border_radius?: number;
  is_active?: boolean;
}

export interface ReorderLinksRequest {
  link_ids: number[];
}

// API Response wrapper
interface ApiResponse<T> {
  data: T;
  message: string;
  status: string;
}

// Custom hook for links API
function useLinksAPI() {
  const fetch = useFetch();

  const api = {
    // Get user's links
    getLinks: async (includeInactive = false): Promise<Link[]> => {
      const response = await fetch(
        `${API_URL}/v1/links/?include_inactive=${includeInactive}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch links");
      }

      const result: ApiResponse<Link[]> = await response.json();
      return result.data;
    },

    // Get single link
    getLink: async (linkId: number): Promise<Link> => {
      const response = await fetch(`${API_URL}/v1/links/${linkId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch link");
      }

      const result: ApiResponse<Link> = await response.json();
      return result.data;
    },

    // Create new link
    createLink: async (linkData: CreateLinkRequest): Promise<Link> => {
      const response = await fetch(`${API_URL}/v1/links/`, {
        method: "POST",
        body: JSON.stringify(linkData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create link");
      }

      const result: ApiResponse<Link> = await response.json();
      return result.data;
    },

    // Update link
    updateLink: async (
      linkId: number,
      linkData: UpdateLinkRequest
    ): Promise<Link> => {
      const response = await fetch(`${API_URL}/v1/links/${linkId}`, {
        method: "PUT",
        body: JSON.stringify(linkData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update link");
      }

      const result: ApiResponse<Link> = await response.json();
      return result.data;
    },

    // Delete link
    deleteLink: async (linkId: number): Promise<void> => {
      const response = await fetch(`${API_URL}/v1/links/${linkId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete link");
      }
    },

    // Reorder links
    reorderLinks: async (linkIds: number[]): Promise<Link[]> => {
      const response = await fetch(`${API_URL}/v1/links/reorder`, {
        method: "POST",
        body: JSON.stringify({ link_ids: linkIds }),
      });

      if (!response.ok) {
        throw new Error("Failed to reorder links");
      }

      const result: ApiResponse<Link[]> = await response.json();
      return result.data;
    },

    // Toggle link status
    toggleLinkStatus: async (linkId: number): Promise<Link> => {
      const response = await fetch(`${API_URL}/v1/links/${linkId}/toggle`, {
        method: "PATCH",
      });

      if (!response.ok) {
        throw new Error("Failed to toggle link status");
      }

      const result: ApiResponse<Link> = await response.json();
      return result.data;
    },
  };

  return api;
}

// React Query Hooks
export const useLinks = (includeInactive = false) => {
  const api = useLinksAPI();

  return useQuery({
    queryKey: ["links", includeInactive],
    queryFn: () => api.getLinks(includeInactive),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useLink = (linkId: number) => {
  const api = useLinksAPI();

  return useQuery({
    queryKey: ["links", linkId],
    queryFn: () => api.getLink(linkId),
    enabled: !!linkId,
  });
};

export const useCreateLink = () => {
  const api = useLinksAPI();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.createLink,
    onSuccess: () => {
      // Invalidate and refetch links
      queryClient.invalidateQueries({ queryKey: ["links"] });
      // Link sayisi/aktiflik degisti; ozet de tazelenmeli.
      queryClient.invalidateQueries({ queryKey: ANALYTICS_QUERY_KEY });
    },
  });
};

export const useUpdateLink = () => {
  const api = useLinksAPI();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      linkId,
      linkData,
    }: {
      linkId: number;
      linkData: UpdateLinkRequest;
    }) => api.updateLink(linkId, linkData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["links"] });
      // Link sayisi/aktiflik degisti; ozet de tazelenmeli.
      queryClient.invalidateQueries({ queryKey: ANALYTICS_QUERY_KEY });
    },
  });
};

export const useDeleteLink = () => {
  const api = useLinksAPI();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.deleteLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["links"] });
      // Link sayisi/aktiflik degisti; ozet de tazelenmeli.
      queryClient.invalidateQueries({ queryKey: ANALYTICS_QUERY_KEY });
    },
  });
};

export const useReorderLinks = () => {
  const api = useLinksAPI();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.reorderLinks,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["links"] });
      // Link sayisi/aktiflik degisti; ozet de tazelenmeli.
      queryClient.invalidateQueries({ queryKey: ANALYTICS_QUERY_KEY });
    },
  });
};

export const useToggleLinkStatus = () => {
  const api = useLinksAPI();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.toggleLinkStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["links"] });
      // Link sayisi/aktiflik degisti; ozet de tazelenmeli.
      queryClient.invalidateQueries({ queryKey: ANALYTICS_QUERY_KEY });
    },
  });
};
