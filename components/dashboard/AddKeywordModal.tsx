'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function AddKeywordModal() {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // TODO: Call API to add keyword
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setLoading(false);
    setKeyword('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="bg-primary hover:bg-primary/90">
          <Plus className="w-5 h-5 mr-2" />
          Add Keyword
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Keyword</DialogTitle>
          <DialogDescription>
            Enter a seed keyword to start your research. You can expand, classify, and analyze
            it after adding.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label htmlFor="keyword" className="block text-sm font-medium mb-2">
              Keyword
            </label>
            <input
              id="keyword"
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g., seo automation tools"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              required
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-primary" disabled={loading}>
              {loading ? 'Adding...' : 'Add Keyword'}
            </Button>
          </div>
        </form>

        <div className="mt-4 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Pro Tip:</strong> You have <span className="text-primary font-medium">unlimited</span> seed
            keywords on all plans. After adding, use your daily expansions to discover variations.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
