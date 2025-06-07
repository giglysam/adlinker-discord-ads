
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, Link, Type, Image } from 'lucide-react';
import { toast } from 'sonner';

interface CreateAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (adData: any) => void;
}

const CreateAdModal: React.FC<CreateAdModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    text: '',
    imageUrl: '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        setFormData(prev => ({ ...prev, imageUrl: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.url || !formData.text) {
      toast.error('Please fill in all required fields');
      return;
    }

    onSubmit(formData);
    toast.success('Ad created successfully! It\'s now pending approval.');
    
    // Reset form
    setFormData({ title: '', url: '', text: '', imageUrl: '' });
    setImageFile(null);
    setImagePreview('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Create New Advertisement</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-gray-300">Ad Title</Label>
            <div className="relative">
              <Type className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="title"
                type="text"
                placeholder="Enter a descriptive title for your ad"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="pl-10 bg-gray-700 border-gray-600 text-white"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="url" className="text-gray-300">Website URL</Label>
            <div className="relative">
              <Link className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="url"
                type="url"
                placeholder="https://yourwebsite.com"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="pl-10 bg-gray-700 border-gray-600 text-white"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="text" className="text-gray-300">Ad Description</Label>
            <Textarea
              id="text"
              placeholder="Write a compelling description for your ad..."
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white"
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image" className="text-gray-300">Ad Image</Label>
            <div className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="image"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-400">
                      <span className="font-semibold">Click to upload</span> an image
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG or GIF (MAX. 5MB)</p>
                  </div>
                  <input
                    id="image"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
              </div>

              {imagePreview && (
                <div className="space-y-2">
                  <Label className="text-gray-300">Preview</Label>
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Preview Card */}
          {(formData.title || formData.text || imagePreview) && (
            <div className="space-y-2">
              <Label className="text-gray-300">Ad Preview</Label>
              <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Ad preview"
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                )}
                {formData.title && (
                  <h3 className="text-white font-semibold mb-2">{formData.title}</h3>
                )}
                {formData.text && (
                  <p className="text-gray-300 text-sm mb-2">{formData.text}</p>
                )}
                {formData.url && (
                  <a
                    href={formData.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 text-sm hover:underline"
                  >
                    {formData.url}
                  </a>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Create Ad
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAdModal;
