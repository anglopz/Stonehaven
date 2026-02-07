/**
 * Campground Form Component
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Textarea } from '@/components/ui';
import { useCampground } from '@/hooks';
import { useUiStore } from '@/stores';
import { ROUTES } from '@/lib/constants';
import { Campground, Image as ImageType } from '@/types';
import { Upload, X } from 'lucide-react';
import Image from 'next/image';

interface CampgroundFormProps {
  campground?: Campground;
  mode: 'create' | 'edit';
}

export function CampgroundForm({ campground, mode }: CampgroundFormProps) {
  const router = useRouter();
  const { addFlashMessage } = useUiStore();
  const { createCampground, updateCampground, isCreating, isUpdating } = useCampground();

  const [formData, setFormData] = useState({
    title: campground?.title || '',
    location: campground?.location || '',
    price: campground?.price || 0,
    description: campground?.description || '',
  });

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [deleteImages, setDeleteImages] = useState<string[]>([]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    // Create previews
    const previews = files.map((file) => URL.createObjectURL(file));
    
    setImages((prev) => [...prev, ...files]);
    setImagePreviews((prev) => [...prev, ...previews]);
  };

  const removeNewImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index]); // Clean up
      return prev.filter((_, i) => i !== index);
    });
  };

  const markImageForDeletion = (filename: string) => {
    setDeleteImages((prev) =>
      prev.includes(filename)
        ? prev.filter((f) => f !== filename)
        : [...prev, filename]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      ...formData,
      images,
      deleteImages: mode === 'edit' ? deleteImages : undefined,
    };

    let result;
    if (mode === 'create') {
      result = await createCampground(data);
    } else {
      result = await updateCampground(campground!._id, data);
    }

    if (result.success && result.data) {
      addFlashMessage({
        type: 'success',
        message: `Campground ${mode === 'create' ? 'created' : 'updated'} successfully!`,
      });
      router.push(ROUTES.CAMPGROUND_DETAIL(result.data._id));
    } else {
      addFlashMessage({
        type: 'error',
        message: result.error || `Failed to ${mode} campground`,
      });
    }
  };

  const isSubmitting = isCreating || isUpdating;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <Input
        label="Campground Title"
        name="title"
        value={formData.title}
        onChange={handleChange}
        required
        placeholder="Enter campground name"
      />

      {/* Location */}
      <Input
        label="Location"
        name="location"
        value={formData.location}
        onChange={handleChange}
        required
        placeholder="Enter location"
      />

      {/* Price */}
      <Input
        label="Price per Night (€)"
        name="price"
        type="number"
        min="0"
        step="0.01"
        value={formData.price}
        onChange={handleChange}
        required
        placeholder="0.00"
      />

      {/* Description */}
      <Textarea
        label="Description"
        name="description"
        value={formData.description}
        onChange={handleChange}
        rows={6}
        required
        placeholder="Describe the campground..."
      />

      {/* Existing Images (Edit mode) */}
      {mode === 'edit' && campground?.images && campground.images.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Current Images
          </label>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {campground.images.map((image: ImageType, index: number) => (
              <div key={index} className="relative">
                <div className="relative h-32 overflow-hidden rounded-lg border-2 border-gray-300">
                  <Image
                    src={image.thumbnail || image.url}
                    alt={`Campground image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  {deleteImages.includes(image.filename) && (
                    <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center">
                      <span className="text-white font-bold">Will Delete</span>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => markImageForDeletion(image.filename)}
                  className={`mt-2 w-full text-sm ${
                    deleteImages.includes(image.filename)
                      ? 'text-green-600 hover:text-green-700'
                      : 'text-red-600 hover:text-red-700'
                  }`}
                >
                  {deleteImages.includes(image.filename) ? 'Undo' : 'Delete'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Images */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          {mode === 'edit' ? 'Add More Images' : 'Upload Images'}
        </label>
        
        {/* Preview */}
        {imagePreviews.length > 0 && (
          <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative">
                <div className="relative h-32 overflow-hidden rounded-lg border-2 border-emerald-300">
                  <Image
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeNewImage(index)}
                  className="absolute -right-2 -top-2 rounded-full bg-red-600 p-1 text-white shadow-lg hover:bg-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload Button */}
        <label className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-8 transition-colors hover:border-emerald-500 hover:bg-emerald-50">
          <div className="text-center">
            <Upload className="mx-auto mb-2 h-8 w-8 text-gray-400" />
            <p className="text-sm text-gray-600">
              Click to upload images
            </p>
            <p className="mt-1 text-xs text-gray-500">
              PNG, JPG up to 10MB
            </p>
          </div>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="hidden"
          />
        </label>
      </div>

      {/* Buttons */}
      <div className="flex gap-4">
        <Button
          type="submit"
          isLoading={isSubmitting}
          className="flex-1"
        >
          {mode === 'create' ? 'Create Campground' : 'Update Campground'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
