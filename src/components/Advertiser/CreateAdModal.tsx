import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Link, Type, Image } from 'lucide-react';
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
    mediaUrl: '', // new field for image or video URL
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.url || !formData.text || !formData.mediaUrl) {
      toast.error('Please fill in all fields');
      return;
    }

    onSubmit(formData);
    toast.success('Ad created successfully!');

    setFormData({ title: '', url: '', text: '', mediaUrl: '' });
  };

  const isImage = (url: string) => /\.(jpeg|jpg|gif|png|webp)$/i.test(url);
  const isVideo = (url: string) => /\.(mp4|webm|ogg)$/i.test(url);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Create New Advertisement</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-gray-300">Ad Title</Label>
            <div className="relative">
              <Type className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="title"
                type="text"
                placeholder="Enter ad title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="pl-10 bg-gray-700 border-gray-600 text-white"
                required
              />
            </div>
          </div>

          {/* URL */}
          <div className="space-y-2">
            <Label htmlFor="url" className="text-gray-300">Target Website</Label>
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

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="text" className="text-gray-300">Ad Description</Label>
            <Textarea
              id="text"
              placeholder="Describe your ad content..."
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white"
              rows={3}
              required
            />
          </div>

          {/* Media URL */}
          <div className="space-y-2">
            <Label htmlFor="mediaUrl" className="text-gray-300">Media URL (Image or Video)</Label>
            <Input
              id="mediaUrl"
              type="url"
              placeholder="https://example.com/ad.jpg or .mp4"
              value={formData.mediaUrl}
              onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white"
              required
            />
          </div>

          {/* Preview */}
          {(formData.mediaUrl || formData.title || formData.text) && (
            <div className="space-y-2">
              <Label className="text-gray-300">Ad Preview</Label>
              <div className="bg-gray-700 p-4 rounded-lg border border-gray-600 space-y-2">
                {isImage(formData.mediaUrl) && (
                  <img
                    src={formData.mediaUrl}
                    alt="Ad preview"
                    className="w-full h-32 object-cover rounded"
                  />
                )}
                {isVideo(formData.mediaUrl) && (
                  <video
                    src={formData.mediaUrl}
                    controls
                    className="w-full h-32 object-cover rounded"
                  />
                )}
                <h3 className="text-white font-semibold">{formData.title}</h3>
                <p className="text-gray-300 text-sm">{formData.text}</p>
                <a
                  href={formData.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 text-sm hover:underline"
                >
                  {formData.url}
                </a>
              </div>
            </div>
          )}

          {/* Buttons */}
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
