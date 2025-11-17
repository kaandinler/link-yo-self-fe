'use client';

import React, { useState } from "react";
import {
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Link2,
  ExternalLink,
  GripVertical,
  TrendingUp,
  Copy,
  CheckCircle,
  AlertCircle,
  X,
  Save,
  Loader2,
} from "lucide-react";
import {
  useLinks,
  useCreateLink,
  useUpdateLink,
  useDeleteLink,
  useToggleLinkStatus,
  useReorderLinks,
  useLinkAnalytics,
  type Link,
  type CreateLinkRequest,
  type UpdateLinkRequest,
} from "@/services/api/services/links";

// Types
interface LinkFormData {
  title: string;
  url: string;
  description: string;
  icon_url: string;
  background_color: string;
  text_color: string;
  border_radius: number;
  is_active: boolean;
}

// Confirm Modal Component
const ConfirmModal = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  isLoading = false,
}: {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 max-w-sm mx-4">
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-gray-400 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal Component
const LinkModal = ({
  isOpen,
  onClose,
  link,
  onSave,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  link?: Link | null;
  onSave: (data: LinkFormData) => void;
  isLoading: boolean;
}) => {
  const [formData, setFormData] = useState<LinkFormData>({
    title: link?.title || "",
    url: link?.url || "",
    description: link?.description || "",
    icon_url: link?.icon_url || "",
    background_color: link?.background_color || "#1383eb",
    text_color: link?.text_color || "#ffffff",
    border_radius: link?.border_radius || 8,
    is_active: link?.is_active ?? true,
  });

  const [errors, setErrors] = useState<Partial<LinkFormData>>({});

  React.useEffect(() => {
    if (link) {
      setFormData({
        title: link.title,
        url: link.url,
        description: link.description || "",
        icon_url: link.icon_url || "",
        background_color: link.background_color || "#1383eb",
        text_color: link.text_color || "#ffffff",
        border_radius: link.border_radius || 8,
        is_active: link.is_active,
      });
    } else {
      setFormData({
        title: "",
        url: "",
        description: "",
        icon_url: "",
        background_color: "#1383eb",
        text_color: "#ffffff",
        border_radius: 8,
        is_active: true,
      });
    }
    setErrors({});
  }, [link, isOpen]);

  const validateForm = () => {
    const newErrors: Partial<LinkFormData> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.url.trim()) {
      newErrors.url = "URL is required";
    } else if (!/^https?:\/\/.+/.test(formData.url)) {
      newErrors.url = "Please enter a valid URL starting with http:// or https://";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-white">
            {link ? "Edit Link" : "Add New Link"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="e.g., Instagram Profile"
              className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
                errors.title ? "border-red-500" : "border-gray-600"
              }`}
            />
            {errors.title && (
              <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.title}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              URL *
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, url: e.target.value }))
              }
              placeholder="https://example.com"
              className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
                errors.url ? "border-red-500" : "border-gray-600"
              }`}
            />
            {errors.url && (
              <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.url}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Optional description for your link"
              rows={3}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors resize-none"
            />
          </div>

          {/* Appearance Settings */}
          <div className="border-t border-gray-600 pt-4">
            <h4 className="text-sm font-medium text-gray-300 mb-4">Appearance Settings</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Icon URL
                </label>
                <input
                  type="url"
                  value={formData.icon_url}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, icon_url: e.target.value }))
                  }
                  placeholder="https://example.com/icon.png"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Border Radius
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={formData.border_radius}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, border_radius: parseInt(e.target.value) || 8 }))
                  }
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Background Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.background_color}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, background_color: e.target.value }))
                    }
                    className="w-12 h-12 bg-gray-700 border border-gray-600 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.background_color}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, background_color: e.target.value }))
                    }
                    placeholder="#1383eb"
                    className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Text Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.text_color}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, text_color: e.target.value }))
                    }
                    className="w-12 h-12 bg-gray-700 border border-gray-600 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.text_color}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, text_color: e.target.value }))
                    }
                    placeholder="#ffffff"
                    className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Preview
              </label>
              <div 
                className="p-4 rounded-lg text-center transition-all"
                style={{
                  backgroundColor: formData.background_color,
                  color: formData.text_color,
                  borderRadius: `${formData.border_radius}px`,
                }}
              >
                <div className="flex items-center justify-center gap-2">
                  {formData.icon_url && (
                    <img 
                      src={formData.icon_url} 
                      alt="Icon"
                      className="w-5 h-5"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                  <span className="font-medium">
                    {formData.title || "Link Title"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, is_active: e.target.checked }))
              }
              className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
            />
            <label htmlFor="is_active" className="text-sm text-gray-300">
              Make this link active (visible on your page)
            </label>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {link ? "Update Link" : "Create Link"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Link Item Component with Drag & Drop
const LinkItem = ({
  link,
  onEdit,
  onDelete,
  onToggle,
  isDragDisabled = false,
  isDragging = false,
  dragHandleProps,
}: {
  link: Link;
  onEdit: (link: Link) => void;
  onDelete: (linkId: number) => void;
  onToggle: (linkId: number) => void;
  isDragDisabled?: boolean;
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(link.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className={`bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-colors ${
        isDragging ? 'opacity-50 scale-105 shadow-2xl' : ''
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Drag Handle */}
        <div 
          {...dragHandleProps}
          className={`flex-shrink-0 ${!isDragDisabled ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
        >
          <GripVertical className={`h-5 w-5 ${!isDragDisabled ? 'text-gray-500 hover:text-gray-400' : 'text-gray-600'} transition-colors`} />
        </div>

        {/* Link Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {link.icon_url && (
              <img 
                src={link.icon_url} 
                alt="Icon"
                className="w-4 h-4 flex-shrink-0"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            <h3 className="text-white font-medium truncate">{link.title}</h3>
            <div
              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                link.is_active ? "bg-green-400" : "bg-gray-500"
              }`}
            />
          </div>
          <p className="text-gray-400 text-sm truncate">{link.url}</p>
          {link.description && (
            <p className="text-gray-500 text-xs mt-1 truncate">{link.description}</p>
          )}
          {(link.background_color || link.text_color) && (
            <div className="flex items-center gap-2 mt-1">
              {link.background_color && (
                <div 
                  className="w-3 h-3 rounded border border-gray-500"
                  style={{ backgroundColor: link.background_color }}
                  title={`Background: ${link.background_color}`}
                />
              )}
              {link.text_color && (
                <div 
                  className="w-3 h-3 rounded border border-gray-500"
                  style={{ backgroundColor: link.text_color }}
                  title={`Text: ${link.text_color}`}
                />
              )}
              {link.border_radius !== undefined && link.border_radius !== 8 && (
                <span className="text-xs text-gray-500">
                  r:{link.border_radius}px
                </span>
              )}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex-shrink-0 text-center">
          <div className="text-white font-medium">{link.click_count}</div>
          <div className="text-gray-400 text-xs">clicks</div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleCopy}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="Copy URL"
          >
            {copied ? (
              <CheckCircle className="h-4 w-4 text-green-400" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>

          <button
            onClick={() => onToggle(link.id)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title={link.is_active ? "Deactivate" : "Activate"}
          >
            {link.is_active ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </button>

          <button
            onClick={() => window.open(link.url, "_blank")}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="Visit link"
          >
            <ExternalLink className="h-4 w-4" />
          </button>

          <button
            onClick={() => onEdit(link)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="Edit link"
          >
            <Edit3 className="h-4 w-4" />
          </button>

          <button
            onClick={() => onDelete(link.id)}
            className="p-2 text-gray-400 hover:text-red-400 transition-colors"
            title="Delete link"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Simple Drag & Drop Implementation
const DraggableList = ({ 
  links, 
  onReorder, 
  onEdit, 
  onDelete, 
  onToggle,
  isReordering 
}: {
  links: Link[];
  onReorder: (newOrder: number[]) => void;
  onEdit: (link: Link) => void;
  onDelete: (linkId: number) => void;
  onToggle: (linkId: number) => void;
  isReordering: boolean;
}) => {
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [dragOverItem, setDragOverItem] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverItem(index);
  };

  const handleDragEnd = () => {
    if (draggedItem !== null && dragOverItem !== null && draggedItem !== dragOverItem) {
      const newLinks = [...links];
      const draggedLink = newLinks[draggedItem];
      
      // Remove dragged item
      newLinks.splice(draggedItem, 1);
      
      // Insert at new position
      newLinks.splice(dragOverItem, 0, draggedLink);
      
      // Create new order array
      const newOrder = newLinks.map(link => link.id);
      onReorder(newOrder);
    }
    
    setDraggedItem(null);
    setDragOverItem(null);
  };

  return (
    <div className="space-y-4">
      {links.map((link, index) => (
        <div
          key={link.id}
          draggable={!isReordering}
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragEnd={handleDragEnd}
          className={`transition-all ${dragOverItem === index ? 'transform translate-y-1' : ''}`}
        >
          <LinkItem
            link={link}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggle={onToggle}
            isDragDisabled={isReordering}
            isDragging={draggedItem === index}
            dragHandleProps={{
              style: { cursor: isReordering ? 'default' : 'grab' }
            }}
          />
        </div>
      ))}
    </div>
  );
};

// Main Component
const Links: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    linkId?: number;
  }>({ isOpen: false });

  // API Hooks
  const { data: links = [], isLoading: linksLoading, error: linksError } = useLinks(showInactive);
  const { data: analytics, isLoading: analyticsLoading } = useLinkAnalytics();
  const createLinkMutation = useCreateLink();
  const updateLinkMutation = useUpdateLink();
  const deleteLinkMutation = useDeleteLink();
  const toggleLinkMutation = useToggleLinkStatus();
  const reorderLinksMutation = useReorderLinks();

  const filteredLinks = showInactive
    ? links
    : links.filter((link) => link.is_active);

  const handleAddLink = () => {
    setEditingLink(null);
    setModalOpen(true);
  };

  const handleEditLink = (link: Link) => {
    setEditingLink(link);
    setModalOpen(true);
  };

  const handleSaveLink = async (data: LinkFormData) => {
    try {
      if (editingLink) {
        await updateLinkMutation.mutateAsync({
          linkId: editingLink.id,
          linkData: data as UpdateLinkRequest,
        });
      } else {
        await createLinkMutation.mutateAsync(data as CreateLinkRequest);
      }
      setModalOpen(false);
      setEditingLink(null);
    } catch (error) {
      console.error("Error saving link:", error);
    }
  };

  const handleDeleteClick = (linkId: number) => {
    setConfirmModal({ isOpen: true, linkId });
  };

  const handleConfirmDelete = async () => {
    if (confirmModal.linkId) {
      try {
        await deleteLinkMutation.mutateAsync(confirmModal.linkId);
      } catch (error) {
        console.error("Error deleting link:", error);
      }
    }
    setConfirmModal({ isOpen: false });
  };

  const handleToggleLink = async (linkId: number) => {
    try {
      await toggleLinkMutation.mutateAsync(linkId);
    } catch (error) {
      console.error("Error toggling link:", error);
    }
  };

  const handleReorderLinks = async (newOrder: number[]) => {
    try {
      await reorderLinksMutation.mutateAsync(newOrder);
    } catch (error) {
      console.error("Error reordering links:", error);
    }
  };

  const handleCopyProfileUrl = () => {
    const profileUrl = `${window.location.origin}/@username`;
    navigator.clipboard.writeText(profileUrl);
  };

  // Loading state
  if (linksLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="h-12 w-12 text-purple-400 animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Loading your links...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (linksError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-400 mb-4">Failed to load your links</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const activeLinksCount = analytics?.active_links || 0;
  const totalClicks = analytics?.total_clicks || 0;
  const totalLinks = analytics?.total_links || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Link2 className="h-8 w-8" />
              My Links
            </h1>
            <p className="text-gray-400 mt-1">
              Manage your social media and other links • Drag to reorder
            </p>
          </div>

          <button
            onClick={handleAddLink}
            disabled={createLinkMutation.isPending}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 disabled:opacity-50"
          >
            {createLinkMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Plus className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Link2 className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {analyticsLoading ? "..." : totalLinks}
                </div>
                <div className="text-gray-400 text-sm">Total Links</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <Eye className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {analyticsLoading ? "..." : activeLinksCount}
                </div>
                <div className="text-gray-400 text-sm">Active Links</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {analyticsLoading ? "..." : totalClicks}
                </div>
                <div className="text-gray-400 text-sm">Total Clicks</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-gray-300">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
            />
            Show inactive links
          </label>

          {filteredLinks.length > 1 && (
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <GripVertical className="h-4 w-4" />
              Drag to reorder
            </div>
          )}
        </div>

        {/* Links List with Drag & Drop */}
        <div className="space-y-4">
          {filteredLinks.length === 0 ? (
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-12 text-center">
              <Link2 className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                {showInactive ? "No links found" : "No active links"}
              </h3>
              <p className="text-gray-400 mb-6">
                {showInactive 
                  ? "You haven't created any links yet"
                  : "Add your first link to get started sharing your content"
                }
              </p>
              <button
                onClick={handleAddLink}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-semibold transition-all"
              >
                Create Your First Link
              </button>
            </div>
          ) : (
            <DraggableList
              links={filteredLinks}
              onReorder={handleReorderLinks}
              onEdit={handleEditLink}
              onDelete={handleDeleteClick}
              onToggle={handleToggleLink}
              isReordering={reorderLinksMutation.isPending}
            />
          )}
        </div>

        {/* Reordering Status */}
        {reorderLinksMutation.isPending && (
          <div className="bg-blue-900/30 backdrop-blur-sm border border-blue-700/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
              <span className="text-blue-400 font-medium">Updating link order...</span>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {filteredLinks.length > 0 && (
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleCopyProfileUrl}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy Profile URL
              </button>
              <button
                onClick={() => {
                  filteredLinks.forEach(link => {
                    if (link.is_active) {
                      handleToggleLink(link.id);
                    }
                  });
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
                disabled={toggleLinkMutation.isPending}
              >
                Deactivate All Active
              </button>
              <button
                onClick={() => {
                  filteredLinks.forEach(link => {
                    if (!link.is_active) {
                      handleToggleLink(link.id);
                    }
                  });
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
                disabled={toggleLinkMutation.isPending}
              >
                Activate All Inactive
              </button>
            </div>
          </div>
        )}

        {/* Performance Tips */}
        <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 backdrop-blur-sm border border-blue-700/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-400" />
            Pro Tips
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-white font-medium">Use clear titles</div>
                <div className="text-gray-400">Make it easy for visitors to understand what each link is for</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-white font-medium">Order by priority</div>
                <div className="text-gray-400">Drag links to put your most important ones at the top</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-white font-medium">Customize appearance</div>
                <div className="text-gray-400">Use colors and icons to make your links stand out</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-white font-medium">Monitor performance</div>
                <div className="text-gray-400">Check click counts to see what resonates with your audience</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <LinkModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingLink(null);
        }}
        link={editingLink}
        onSave={handleSaveLink}
        isLoading={createLinkMutation.isPending || updateLinkMutation.isPending}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Delete Link"
        message="Are you sure you want to delete this link? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmModal({ isOpen: false })}
        isLoading={deleteLinkMutation.isPending}
      />
    </div>
  );
};

export default Links;