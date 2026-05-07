'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Upload, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function UploadPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    body: '',
    excerpt: '',
    category: '',
    author: '',
    image_url: '',
    reading_time: ''
  })

  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me')
        const data = await res.json()
        if (!data.user) {
          router.push('/auth/login?redirect=/upload')
        }
      } catch {
        router.push('/auth/login')
      } finally {
        setCheckingAuth(false)
      }
    }
    checkAuth()
  }, [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()])
      }
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          reading_time: formData.reading_time ? parseInt(formData.reading_time) : undefined,
          tags
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to upload article')
        return
      }

      router.push(`/articles/${data.slug}`)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Upload className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-3xl">Submit New Article</CardTitle>
          </div>
          <CardDescription>
            Share an inspirational article with the community. Our recommendation engine will handle the rest.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && (
              <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="The Power of Mindfulness"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  placeholder="e.g., Personal Growth, Wellness"
                  value={formData.category}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="author">Author Name</Label>
                <Input
                  id="author"
                  placeholder="Your name or the original author"
                  value={formData.author}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Short Excerpt</Label>
              <Input
                id="excerpt"
                placeholder="A brief summary of the article..."
                value={formData.excerpt}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">Content * (Markdown supported)</Label>
              <Textarea
                id="body"
                placeholder="Write your article content here..."
                className="min-h-[300px]"
                value={formData.body}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image_url">Header Image URL</Label>
              <Input
                id="image_url"
                placeholder="https://images.unsplash.com/photo-..."
                value={formData.image_url}
                onChange={handleInputChange}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reading_time">Reading Time (minutes)</Label>
                <Input
                  id="reading_time"
                  type="number"
                  placeholder="5"
                  value={formData.reading_time}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (Press Enter to add)</Label>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    placeholder="add tags..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                  />
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-4 border-t pt-6">
            <Button variant="outline" type="button" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Vectorizing...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Publish Article
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
