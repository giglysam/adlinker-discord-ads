
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
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
    imageUrl: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.url || !formData.text || !formData.imageUrl) {
      toast.error('Please fill in all fields');
      return;
    }

    onSubmit(formData);
    toast.success('Ad created successfully!');

    setFormData({ title: '', url: '', text: '', imageUrl: '' });
  };

  const isImage = (url: string) => /\.(jpeg|jpg|gif|png|webp)$/i.test(url);
  const isVideo = (url: string) => /\.(mp4|webm|ogg)$/i.test(url);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl h-[95vh] max-h-[800px] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b border-gray-700">
          <DialogTitle className="text-xl">Create New Advertisement</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="px-6 py-4">
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
                  className="bg-gray-700 border-gray-600 text-white min-h-[80px] resize-none"
                  rows={3}
                  required
                />
              </div>

              {/* Media URL */}
              <div className="space-y-2">
                <Label htmlFor="imageUrl" className="text-gray-300">Media URL (Image or Video)</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  placeholder="https://example.com/ad.jpg or .mp4"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                  required
                />
              </div>

              {/* Preview */}
              {(formData.imageUrl || formData.title || formData.text) && (
                <div className="space-y-2">
                  <Label className="text-gray-300">Ad Preview</Label>
                  <div className="bg-gray-700 p-4 rounded-lg border border-gray-600 space-y-2">
                    {isImage(formData.imageUrl) && (
                      <img
                        src={formData.imageUrl}
                        alt="Ad preview"
                        className="w-full h-32 object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    {isVideo(formData.imageUrl) && (
                      <video
                        src={formData.imageUrl}
                        controls
                        className="w-full h-32 object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    {formData.title && (
                      <h3 className="text-white font-semibold">{formData.title}</h3>
                    )}
                    {formData.text && (
                      <p className="text-gray-300 text-sm">{formData.text}</p>
                    )}
                    {formData.url && (
                      <a
                        href={formData.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 text-sm hover:underline inline-block break-all"
                      >
                        {formData.url}
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Buttons - Always visible at bottom */}
              <div className="flex justify-end space-x-3 pt-6 pb-2 border-t border-gray-600 bg-gray-800 sticky bottom-0">
                <Button type="button" variant="outline" onClick={onClose} className="border-gray-600 text-gray-300 hover:bg-gray-700">
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                  Create Ad
                </Button>
              </div>
            </form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAdModal;
