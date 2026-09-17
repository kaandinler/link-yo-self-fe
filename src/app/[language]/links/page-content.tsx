"use client";

import React, { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
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
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import {
  useLinks,
  useCreateLink,
  useUpdateLink,
  useDeleteLink,
  useToggleLinkStatus,
  useReorderLinks,
  type Link,
  type CreateLinkRequest,
  type UpdateLinkRequest,
} from "@/services/api/services/links";
import { useAnalyticsSummary } from "@/services/api/services/analytics";
import useAuth from "@/services/auth/use-auth";
import useLanguage from "@/services/i18n/use-language";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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
      <div className="bg-surface-raised rounded-2xl border border-line p-6 max-w-sm mx-4">
        <h3 className="text-lg font-semibold text-ink mb-2">{title}</h3>
        <p className="text-ink-muted mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 bg-field hover:bg-field-strong text-ink rounded-lg transition-colors disabled:opacity-50"
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
      newErrors.url =
        "Please enter a valid URL starting with http:// or https://";
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
    // TELEFONDA KAYDET DUGMESI: Onceden basligiyla, alanlariyla ve
    // dugmeleriyle butun pencere birlikte kayiyordu; telefonda form
    // ekrandan uzun oldugu icin "Create Link" gorunmuyordu ve kullanicinin
    // once asagi kaydirmasi gerekiyordu. Pencere artik uc parca: sabit
    // baslik, kayan alanlar, sabit dugmeler.
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-line bg-surface-raised">
        <div className="flex shrink-0 items-center justify-between px-6 pb-4 pt-6">
          <h3 className="text-xl font-semibold text-ink">
            {link ? "Edit Link" : "Add New Link"}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-ink-muted hover:text-ink transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 pb-2">
            <div>
              <label className="block text-sm font-medium text-ink-soft mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="e.g., Instagram Profile"
                className={`w-full px-4 py-3 bg-field border rounded-lg text-ink placeholder-ink-muted focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
                  errors.title ? "border-red-500" : "border-line-strong"
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
              <label className="block text-sm font-medium text-ink-soft mb-2">
                URL *
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, url: e.target.value }))
                }
                placeholder="https://example.com"
                className={`w-full px-4 py-3 bg-field border rounded-lg text-ink placeholder-ink-muted focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
                  errors.url ? "border-red-500" : "border-line-strong"
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
              <label className="block text-sm font-medium text-ink-soft mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Optional description for your link"
                rows={3}
                className="w-full px-4 py-3 bg-field border border-line-strong rounded-lg text-ink placeholder-ink-muted focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors resize-none"
              />
            </div>

            {/* Appearance Settings */}
            <div className="border-t border-line-strong pt-4">
              <h4 className="text-sm font-medium text-ink-soft mb-4">
                Appearance Settings
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink-soft mb-2">
                    Icon URL
                  </label>
                  <input
                    type="url"
                    value={formData.icon_url}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        icon_url: e.target.value,
                      }))
                    }
                    placeholder="https://example.com/icon.png"
                    className="w-full px-4 py-3 bg-field border border-line-strong rounded-lg text-ink placeholder-ink-muted focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-soft mb-2">
                    Border Radius
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={formData.border_radius}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        border_radius: parseInt(e.target.value) || 8,
                      }))
                    }
                    className="w-full px-4 py-3 bg-field border border-line-strong rounded-lg text-ink placeholder-ink-muted focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-ink-soft mb-2">
                    Background Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.background_color}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          background_color: e.target.value,
                        }))
                      }
                      className="w-12 h-12 bg-field border border-line-strong rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.background_color}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          background_color: e.target.value,
                        }))
                      }
                      placeholder="#1383eb"
                      className="flex-1 px-4 py-3 bg-field border border-line-strong rounded-lg text-ink placeholder-ink-muted focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-soft mb-2">
                    Text Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.text_color}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          text_color: e.target.value,
                        }))
                      }
                      className="w-12 h-12 bg-field border border-line-strong rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.text_color}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          text_color: e.target.value,
                        }))
                      }
                      placeholder="#ffffff"
                      className="flex-1 px-4 py-3 bg-field border border-line-strong rounded-lg text-ink placeholder-ink-muted focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-ink-soft mb-2">
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
                          e.currentTarget.style.display = "none";
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
                  setFormData((prev) => ({
                    ...prev,
                    is_active: e.target.checked,
                  }))
                }
                className="w-4 h-4 text-purple-600 bg-field border-line-strong rounded focus:ring-purple-500"
              />
              <label htmlFor="is_active" className="text-sm text-ink-soft">
                Make this link active (visible on your page)
              </label>
            </div>
          </div>

          {/* Kayan alanin disinda: pencere ne kadar uzun olursa olsun
              gorunur kaliyor. */}
          <div className="flex shrink-0 gap-3 border-t border-line px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-field hover:bg-field-strong text-ink rounded-lg transition-colors"
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
  onMove,
  canMoveUp,
  canMoveDown,
  isDragDisabled = false,
  isDragging = false,
  dragHandleProps,
}: {
  link: Link;
  onEdit: (link: Link) => void;
  onDelete: (linkId: number) => void;
  onToggle: (linkId: number) => void;
  /** Siralamayi bir basamak degistirir; bkz. TASIMA notu. */
  onMove: (yon: -1 | 1) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
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
      className={`bg-surface/50 backdrop-blur-sm border border-line rounded-xl p-4 hover:border-line-strong transition-colors ${
        isDragging ? "opacity-50 scale-105 shadow-2xl" : ""
      }`}
    >
      {/* Telefonda iki satir: baslik, sayac ve bes dugme tek satira
          sigmiyordu. Sabit genislikteki parcalar 393 pikselin ~285'ini
          aliyor ve basliga 100 piksel kaliyordu -- "Portfolyo s..." degil,
          tek harf: "P...". */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex min-w-0 items-start gap-3 sm:flex-1 sm:items-center">
          {/* Drag Handle: yalnizca isaretleyici cihazlarda anlamli, bkz.
              asagidaki TASIMA notu. */}
          <div
            {...dragHandleProps}
            className={`hidden flex-shrink-0 sm:block ${!isDragDisabled ? "cursor-grab active:cursor-grabbing" : "cursor-default"}`}
          >
            <GripVertical
              className={`h-5 w-5 ${!isDragDisabled ? "text-ink-faint hover:text-ink-muted" : "text-ink-faint"} transition-colors`}
            />
          </div>

          {/* Link Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              {link.icon_url && (
                <img
                  src={link.icon_url}
                  alt="Icon"
                  className="w-4 h-4 flex-shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}
              <h3 className="text-ink font-medium truncate">{link.title}</h3>
              <div
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  link.is_active ? "bg-green-400" : "bg-gray-500"
                }`}
              />
            </div>
            <p className="text-ink-muted text-sm truncate">{link.url}</p>
            {link.description && (
              <p className="text-ink-faint text-xs mt-1 truncate">
                {link.description}
              </p>
            )}
            {(link.background_color || link.text_color) && (
              <div className="flex items-center gap-2 mt-1">
                {link.background_color && (
                  <div
                    className="w-3 h-3 rounded border border-line-stronger"
                    style={{ backgroundColor: link.background_color }}
                    title={`Background: ${link.background_color}`}
                  />
                )}
                {link.text_color && (
                  <div
                    className="w-3 h-3 rounded border border-line-stronger"
                    style={{ backgroundColor: link.text_color }}
                    title={`Text: ${link.text_color}`}
                  />
                )}
                {link.border_radius !== undefined &&
                  link.border_radius !== 8 && (
                    <span className="text-xs text-ink-faint">
                      r:{link.border_radius}px
                    </span>
                  )}
              </div>
            )}
          </div>

          {/*
            TASIMA: Yukari/asagi dugmeleri yalnizca telefonda gorunuyor.
            HTML5 surukle-birak dokunmatik girdide hic olay uretmiyor, yani
            telefonda siralama degistirmek mumkun degildi -- ustelik sayfa
            "Drag to reorder" yaziyordu. Isaretleyici cihazlarda surukleme
            daha hizli oldugu icin orada dugmeler gizli, tutamak duruyor.

            Neden basligin yaninda, eylemlerin yaninda degil: yedi kontrol
            tek satira sigmiyor ve en sagdaki (silme) ekranin disinda
            kaliyordu. Ustelik siralama, linkin kimligine ait bir islem --
            kopyala/duzenle/sil'den farkli bir is.
          */}
          <div className="flex flex-shrink-0 items-center sm:hidden">
            <button
              type="button"
              onClick={() => onMove(-1)}
              disabled={!canMoveUp || isDragDisabled}
              aria-label={`Move ${link.title} up`}
              className="p-3 text-ink-muted transition-colors hover:text-ink disabled:opacity-30"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onMove(1)}
              disabled={!canMoveDown || isDragDisabled}
              aria-label={`Move ${link.title} down`}
              className="p-3 text-ink-muted transition-colors hover:text-ink disabled:opacity-30"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 sm:justify-end sm:gap-4">
          {/* Stats */}
          <div className="flex-shrink-0 text-center">
            <div className="text-ink font-medium">{link.click_count}</div>
            <div className="text-ink-muted text-xs">clicks</div>
          </div>

          {/* Actions. p-3 telefonda 40 piksellik dokunma hedefi veriyor;
              fareyle kullanilan genis ekranda p-2 yeterli. */}
          <div className="flex items-center gap-1 flex-shrink-0 sm:gap-2">
            <button
              onClick={handleCopy}
              className="p-3 sm:p-2 text-ink-muted hover:text-ink transition-colors"
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
              className="p-3 sm:p-2 text-ink-muted hover:text-ink transition-colors"
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
              className="p-3 sm:p-2 text-ink-muted hover:text-ink transition-colors"
              title="Visit link"
            >
              <ExternalLink className="h-4 w-4" />
            </button>

            <button
              onClick={() => onEdit(link)}
              className="p-3 sm:p-2 text-ink-muted hover:text-ink transition-colors"
              title="Edit link"
            >
              <Edit3 className="h-4 w-4" />
            </button>

            <button
              onClick={() => onDelete(link.id)}
              className="p-3 sm:p-2 text-ink-muted hover:text-red-400 transition-colors"
              title="Delete link"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
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
  isReordering,
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
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverItem(index);
  };

  const handleDragEnd = () => {
    if (
      draggedItem !== null &&
      dragOverItem !== null &&
      draggedItem !== dragOverItem
    ) {
      const newLinks = [...links];
      const draggedLink = newLinks[draggedItem];

      // Remove dragged item
      newLinks.splice(draggedItem, 1);

      // Insert at new position
      newLinks.splice(dragOverItem, 0, draggedLink);

      // Create new order array
      const newOrder = newLinks.map((link) => link.id);
      onReorder(newOrder);
    }

    setDraggedItem(null);
    setDragOverItem(null);
  };

  /**
   * Bir linki bir basamak yukari/asagi tasir.
   *
   * Surukle-birak ile ayni ucu kullaniyor (onReorder); iki yol da
   * linklerin yeni sirasini id listesi olarak gonderiyor.
   */
  const tasi = (index: number, yon: -1 | 1) => {
    const hedef = index + yon;
    if (hedef < 0 || hedef >= links.length) return;

    const yeniler = [...links];
    [yeniler[index], yeniler[hedef]] = [yeniler[hedef], yeniler[index]];
    onReorder(yeniler.map((link) => link.id));
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
          className={`transition-all ${dragOverItem === index ? "transform translate-y-1" : ""}`}
        >
          <LinkItem
            link={link}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggle={onToggle}
            onMove={(yon) => tasi(index, yon)}
            canMoveUp={index > 0}
            canMoveDown={index < links.length - 1}
            isDragDisabled={isReordering}
            isDragging={draggedItem === index}
            dragHandleProps={{
              style: { cursor: isReordering ? "default" : "grab" },
            }}
          />
        </div>
      ))}
    </div>
  );
};

// Main Component
const Links: React.FC = () => {
  const { user } = useAuth();
  const language = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    linkId?: number;
  }>({ isOpen: false });

  // API Hooks
  const {
    data: links = [],
    isLoading: linksLoading,
    error: linksError,
  } = useLinks(showInactive);
  const { data: analytics, isLoading: analyticsLoading } =
    useAnalyticsSummary();
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

  // ?new=1 ile gelindiginde form dogrudan acilir. Onboarding sihirbazi,
  // pano ve ust menudeki "Add Link" buraya isaret ediyor; eskiden hepsi
  // "coming soon" yazan /links/add sayfasina gidiyordu.
  //
  // Parametre acilisdan sonra adres cubugundan siliniyor: sayfa yenilendiginde
  // ya da kullanici geri geldiginde form tekrar acilmasin.
  useEffect(() => {
    if (searchParams.get("new") === null) return;

    setEditingLink(null);
    setModalOpen(true);
    router.replace(pathname);
  }, [searchParams, pathname, router]);

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
    // Public profil rotasi /{language}/{username}. Onceki hali sabit bir
    // "/@username" yer tutucusuydu: kopyalanan adres hicbir kullaniciyi
    // gostermiyordu (@ ayrica Next.js'te parallel route slot'u demek).
    if (!user?.username) return;

    const profileUrl = `${window.location.origin}/${language}/${user.username}`;
    navigator.clipboard.writeText(profileUrl);
  };

  // Loading state
  if (linksLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-page via-page-accent to-page p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="h-12 w-12 text-accent animate-spin mx-auto mb-4" />
              <p className="text-ink-muted">Loading your links...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (linksError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-page via-page-accent to-page p-4 md:p-6">
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
    <div className="min-h-screen bg-gradient-to-br from-page via-page-accent to-page p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-ink flex items-center gap-3">
              <Link2 className="h-8 w-8" />
              My Links
            </h1>
            <p className="text-ink-muted mt-1">
              Manage your social media and other links
            </p>
          </div>

          <button
            onClick={handleAddLink}
            disabled={createLinkMutation.isPending}
            // Butonun icinde yalnizca ikon var; erisilebilir bir adi olmali.
            aria-label="Add new link"
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
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          <div className="bg-surface/50 backdrop-blur-sm border border-line rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Link2 className="h-6 w-6 text-accent" />
              </div>
              <div>
                <div className="text-2xl font-bold text-ink">
                  {analyticsLoading ? "..." : totalLinks}
                </div>
                <div className="text-ink-muted text-sm">Total Links</div>
              </div>
            </div>
          </div>

          <div className="bg-surface/50 backdrop-blur-sm border border-line rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <Eye className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-ink">
                  {analyticsLoading ? "..." : activeLinksCount}
                </div>
                <div className="text-ink-muted text-sm">Active Links</div>
              </div>
            </div>
          </div>

          <div className="bg-surface/50 backdrop-blur-sm border border-line rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-ink">
                  {analyticsLoading ? "..." : totalClicks}
                </div>
                <div className="text-ink-muted text-sm">Total Clicks</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-ink-soft">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="w-4 h-4 text-purple-600 bg-field border-line-strong rounded focus:ring-purple-500"
            />
            Show inactive links
          </label>

          {filteredLinks.length > 1 && (
            // Telefonda surukleme yok; oradaki karsiligi satirlardaki
            // yukari/asagi dugmeleri. Ayni cumleyi iki cihazda da
            // gostermek kullaniciyi calismayan bir seye yonlendiriyordu.
            <div className="flex items-center gap-2 text-ink-muted text-sm">
              <GripVertical className="hidden h-4 w-4 sm:block" />
              <span className="hidden sm:inline">Drag to reorder</span>
              <span className="sm:hidden">Use the arrows to reorder</span>
            </div>
          )}
        </div>

        {/* Links List with Drag & Drop */}
        <div className="space-y-4">
          {filteredLinks.length === 0 ? (
            <div className="bg-surface/50 backdrop-blur-sm border border-line rounded-xl p-12 text-center">
              <Link2 className="h-12 w-12 text-ink-faint mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-ink mb-2">
                {showInactive ? "No links found" : "No active links"}
              </h3>
              <p className="text-ink-muted mb-6">
                {showInactive
                  ? "You haven't created any links yet"
                  : "Add your first link to get started sharing your content"}
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
              <span className="text-blue-400 font-medium">
                Updating link order...
              </span>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {filteredLinks.length > 0 && (
          <div className="bg-surface/50 backdrop-blur-sm border border-line rounded-xl p-6">
            <h3 className="text-lg font-semibold text-ink mb-4">
              Quick Actions
            </h3>
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
                  filteredLinks.forEach((link) => {
                    if (link.is_active) {
                      handleToggleLink(link.id);
                    }
                  });
                }}
                className="px-4 py-2 bg-field hover:bg-field-strong text-ink rounded-lg transition-colors text-sm"
                disabled={toggleLinkMutation.isPending}
              >
                Deactivate All Active
              </button>
              <button
                onClick={() => {
                  filteredLinks.forEach((link) => {
                    if (!link.is_active) {
                      handleToggleLink(link.id);
                    }
                  });
                }}
                className="px-4 py-2 bg-field hover:bg-field-strong text-ink rounded-lg transition-colors text-sm"
                disabled={toggleLinkMutation.isPending}
              >
                Activate All Inactive
              </button>
            </div>
          </div>
        )}

        {/* Performance Tips */}
        <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 backdrop-blur-sm border border-blue-700/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-ink mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-400" />
            Pro Tips
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-ink font-medium">Use clear titles</div>
                <div className="text-ink-muted">
                  Make it easy for visitors to understand what each link is for
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-ink font-medium">Order by priority</div>
                <div className="text-ink-muted">
                  Put your most important links at the top
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-ink font-medium">Customize appearance</div>
                <div className="text-ink-muted">
                  Use colors and icons to make your links stand out
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-ink font-medium">Monitor performance</div>
                <div className="text-ink-muted">
                  Check click counts to see what resonates with your audience
                </div>
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

// Link yonetimi kullaniciya ozel veriyi gosteriyor ve token'siz istek atiyor;
// giris yapmamis ziyaretci giris ekranina yonlendirilmeli.
export default withPageRequiredAuth(Links);
