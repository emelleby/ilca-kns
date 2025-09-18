---
type: "agent_requested"
---

# RedwoodSDK: Storage operations with Cloudflare R2

You're an expert at Cloudflare R2, TypeScript, and building web apps with RedwoodSDK. Generate high quality **storage operations** that adhere to the following best practices:

## Guidelines

1. Use streaming for file uploads and downloads to handle files of any size efficiently
2. Implement proper error handling for storage operations
3. Use consistent file naming and organization within buckets
4. Set appropriate content types and metadata for stored objects
5. Implement access control for sensitive files
6. Create reusable utility functions for common storage operations

## Example Templates

### Storage Client Setup

Create a centralized storage client that can be imported throughout the application:

```tsx
// src/lib/storage.ts
export class StorageClient {
  private bucket: R2Bucket;

  constructor(bucket: R2Bucket) {
    this.bucket = bucket;
  }

  // Generate a unique key for a file
  generateKey(fileName: string, prefix = ''): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    return `${prefix ? prefix + '/' : ''}${timestamp}-${randomString}-${sanitizedFileName}`;
  }

  // Upload a file
  async upload(file: File, key?: string, metadata?: Record<string, string>): Promise<string> {
    const fileKey = key || this.generateKey(file.name, 'uploads');
    
    await this.bucket.put(fileKey, file.stream(), {
      httpMetadata: {
        contentType: file.type,
      },
      customMetadata: metadata,
    });
    
    return fileKey;
  }

  // Download a file
  async download(key: string): Promise<{ data: ReadableStream; contentType: string } | null> {
    const object = await this.bucket.get(key);
    
    if (!object) {
      return null;
    }
    
    return {
      data: object.body,
      contentType: object.httpMetadata?.contentType || 'application/octet-stream',
    };
  }

  // Check if a file exists
  async exists(key: string): Promise<boolean> {
    const object = await this.bucket.head(key);
    return object !== null;
  }

  // Delete a file
  async delete(key: string): Promise<boolean> {
    await this.bucket.delete(key);
    return true;
  }

  // List files with a prefix
  async list(prefix?: string, limit = 100): Promise<R2Objects> {
    return await this.bucket.list({
      prefix,
      limit,
    });
  }

  // Get a signed URL for temporary access
  async getSignedUrl(key: string, expirationSeconds = 3600): Promise<string> {
    // Note: This requires additional setup with R2 presigned URLs
    // This is a placeholder for the actual implementation
    const url = await this.bucket.createPresignedUrl(key, expirationSeconds);
    return url.toString();
  }
}

// Export a function to create the storage client
export function createStorageClient(env: Env): StorageClient {
  return new StorageClient(env.R2);
}
```

### File Upload Handler

```tsx
import { route } from 'rwsdk/router'
import { createStorageClient } from '../lib/storage'

route('/api/upload', async function handler({ request, env }) {
  try {
    const storage = createStorageClient(env);
    
    // Check if the request is multipart form data
    const contentType = request.headers.get('Content-Type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return Response.json(
        { error: 'Request must be multipart/form-data' },
        { status: 400 }
      );
    }
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return Response.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Optional: validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return Response.json(
        { error: 'File type not allowed' },
        { status: 400 }
      );
    }
    
    // Optional: validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return Response.json(
        { error: 'File too large (max 10MB)' },
        { status: 400 }
      );
    }
    
    // Get additional metadata from form
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    
    // Create metadata object
    const metadata: Record<string, string> = {};
    if (description) metadata.description = description;
    if (category) metadata.category = category;
    
    // Upload file with custom prefix based on file type
    const fileType = file.type.split('/')[0]; // e.g., 'image', 'application'
    const key = await storage.upload(file, `${fileType}/${file.name}`, metadata);
    
    return Response.json({
      success: true,
      key,
      url: `/api/files/${key}`,
      metadata
    }, { status: 201 });
  } catch (error) {
    console.error('Upload error:', error);
    return Response.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}, { method: 'POST' });
```

### File Download Handler

```tsx
import { route } from 'rwsdk/router'
import { createStorageClient } from '../lib/storage'

route('/api/files/:key', async function handler({ params, env }) {
  try {
    const storage = createStorageClient(env);
    const key = params.key;
    
    // Decode the key if it's URL-encoded
    const decodedKey = decodeURIComponent(key);
    
    const file = await storage.download(decodedKey);
    
    if (!file) {
      return Response.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }
    
    // Return the file as a streaming response
    return new Response(file.data, {
      headers: {
        'Content-Type': file.contentType,
        'Content-Disposition': `inline; filename="${decodedKey.split('/').pop()}"`,
      }
    });
  } catch (error) {
    console.error('Download error:', error);
    return Response.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
});
```

### File Deletion Handler

```tsx
import { route } from 'rwsdk/router'
import { createStorageClient } from '../lib/storage'

route('/api/files/:key', async function handler({ params, env }) {
  try {
    const storage = createStorageClient(env);
    const key = decodeURIComponent(params.key);
    
    // Check if file exists
    const exists = await storage.exists(key);
    if (!exists) {
      return Response.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }
    
    // Delete the file
    await storage.delete(key);
    
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Deletion error:', error);
    return Response.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}, { method: 'DELETE' });
```

### File Listing Handler

```tsx
import { route } from 'rwsdk/router'
import { createStorageClient } from '../lib/storage'

route('/api/files', async function handler({ request, env }) {
  try {
    const storage = createStorageClient(env);
    const url = new URL(request.url);
    
    // Get query parameters
    const prefix = url.searchParams.get('prefix') || undefined;
    const limit = parseInt(url.searchParams.get('limit') || '100');
    
    // List files
    const objects = await storage.list(prefix, limit);
    
    // Transform the objects to a more usable format
    const files = objects.objects.map(obj => ({
      key: obj.key,
      size: obj.size,
      etag: obj.etag,
      uploaded: obj.uploaded,
      url: `/api/files/${encodeURIComponent(obj.key)}`,
      metadata: obj.customMetadata || {},
    }));
    
    return Response.json({
      files,
      truncated: objects.truncated,
      count: files.length
    });
  } catch (error) {
    console.error('List error:', error);
    return Response.json(
      { error: 'Failed to list files' },
      { status: 500 }
    );
  }
});
```

### Image Resizing and Processing

```tsx
import { route } from 'rwsdk/router'
import { createStorageClient } from '../lib/storage'

route('/api/images/:key', async function handler({ params, request, env }) {
  try {
    const storage = createStorageClient(env);
    const key = decodeURIComponent(params.key);
    const url = new URL(request.url);
    
    // Get image processing parameters
    const width = parseInt(url.searchParams.get('width') || '0');
    const height = parseInt(url.searchParams.get('height') || '0');
    const format = url.searchParams.get('format') || null;
    
    // Get the original image
    const image = await storage.download(key);
    
    if (!image) {
      return Response.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }
    
    // Check if it's actually an image
    if (!image.contentType.startsWith('image/')) {
      return Response.json(
        { error: 'Not an image' },
        { status: 400 }
      );
    }
    
    // If no processing is needed, return the original
    if (!width && !height && !format) {
      return new Response(image.data, {
        headers: {
          'Content-Type': image.contentType,
        }
      });
    }
    
    // For actual image processing, you would use Cloudflare Image Resizing or Workers Image Processing
    // This is a placeholder for the actual implementation
    
    // Example with Cloudflare Image Resizing (if enabled on your account)
    const imageURL = `https://your-zone.cloudflare.com/cdn-cgi/image/width=${width},height=${height},format=${format}/${key}`;
    
    return Response.redirect(imageURL, 302);
  } catch (error) {
    console.error('Image processing error:', error);
    return Response.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
});
```

### File Upload Component (React)

```tsx
// src/app/components/FileUpload.tsx
import { useState } from 'react';

interface FileUploadProps {
  endpoint?: string;
  onUploadComplete?: (data: any) => void;
  onError?: (error: Error) => void;
  allowedTypes?: string[];
  maxSize?: number;
}

export function FileUpload({
  endpoint = '/api/upload',
  onUploadComplete,
  onError,
  allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  maxSize = 10 * 1024 * 1024, // 10MB
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      const error = new Error(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
      setError(error.message);
      onError?.(error);
      return;
    }
    
    // Validate file size
    if (maxSize > 0 && file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      const error = new Error(`File too large. Maximum size: ${maxSizeMB}MB`);
      setError(error.message);
      onError?.(error);
      return;
    }
    
    setIsUploading(true);
    setError(null);
    setProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Add any additional form fields here
      // formData.append('description', description);
      
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setProgress(percentComplete);
        }
      });
      
      // Handle response
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
          onUploadComplete?.(response);
        } else {
          const error = new Error(`Upload failed with status ${xhr.status}`);
          setError(error.message);
          onError?.(error);
        }
        setIsUploading(false);
      };
      
      // Handle errors
      xhr.onerror = () => {
        const error = new Error('Upload failed due to network error');
        setError(error.message);
        onError?.(error);
        setIsUploading(false);
      };
      
      xhr.open('POST', endpoint);
      xhr.send(formData);
    } catch (err) {
      setError(err.message);
      onError?.(err);
      setIsUploading(false);
    }
  };
  
  return (
    <div className="file-upload">
      <input
        type="file"
        onChange={handleFileChange}
        disabled={isUploading}
        accept={allowedTypes.join(',')}
      />
      
      {isUploading && (
        <div className="progress">
          <div className="progress-bar" style={{ width: `${progress}%` }}>
            {progress}%
          </div>
        </div>
      )}
      
      {error && (
        <div className="error">{error}</div>
      )}
    </div>
  );
}
```

### Drag and Drop File Upload Zone

```tsx
// src/app/components/DropZone.tsx
import { useState, useRef, useCallback } from 'react';

interface DropZoneProps {
  endpoint?: string;
  onUploadComplete?: (data: any) => void;
  onError?: (error: Error) => void;
  allowedTypes?: string[];
  maxSize?: number;
  multiple?: boolean;
}

export function DropZone({
  endpoint = '/api/upload',
  onUploadComplete,
  onError,
  allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  maxSize = 10 * 1024 * 1024, // 10MB
  multiple = false,
}: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const dropRef = useRef<HTMLDivElement>(null);
  
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const validateFile = (file: File): boolean => {
    // Validate file type
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      setError(`File type not allowed: ${file.type}. Allowed types: ${allowedTypes.join(', ')}`);
      return false;
    }
    
    // Validate file size
    if (maxSize > 0 && file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      setError(`File too large: ${file.name}. Maximum size: ${maxSizeMB}MB`);
      return false;
    }
    
    return true;
  };
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setError(null);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    
    if (!multiple && droppedFiles.length > 1) {
      setError('Only one file can be uploaded at a time');
      return;
    }
    
    const validFiles = droppedFiles.filter(validateFile);
    
    if (validFiles.length > 0) {
      setFiles(validFiles);
      uploadFiles(validFiles);
    }
  }, [multiple, validateFile]);
  
  const uploadFiles = async (filesToUpload: File[]) => {
    setIsUploading(true);
    
    try {
      const uploadPromises = filesToUpload.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(endpoint, {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error(`Upload failed with status ${response.status}`);
        }
        
        return await response.json();
      });
      
      const results = await Promise.all(uploadPromises);
      onUploadComplete?.(multiple ? results : results[0]);
    } catch (err) {
      setError(err.message);
      onError?.(err);
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    
    if (!e.target.files?.length) return;
    
    const selectedFiles = Array.from(e.target.files);
    
    if (!multiple && selectedFiles.length > 1) {
      setError('Only one file can be uploaded at a time');
      return;
    }
    
    const validFiles = selectedFiles.filter(validateFile);
    
    if (validFiles.length > 0) {
      setFiles(validFiles);
      uploadFiles(validFiles);
    }
  };
  
  return (
    <div
      ref={dropRef}
      className={`drop-zone ${isDragging ? 'dragging' : ''} ${isUploading ? 'uploading' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        onChange={handleFileSelect}
        accept={allowedTypes.join(',')}
        multiple={multiple}
        className="file-input"
      />
      
      <div className="drop-zone-content">
        {isUploading ? (
          <div className="uploading-message">Uploading...</div>
        ) : (
          <>
            <div className="drop-message">
              Drag & drop {multiple ? 'files' : 'a file'} here, or click to select
            </div>
            <div className="file-info">
              Allowed types: {allowedTypes.map(type => type.replace('image/', '.')).join(', ')}
              <br />
              Max size: {maxSize / (1024 * 1024)}MB
            </div>
          </>
        )}
      </div>
      
      {files.length > 0 && !isUploading && (
        <div className="file-list">
          <h4>Selected Files:</h4>
          <ul>
            {files.map((file, index) => (
              <li key={index}>
                {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {error && (
        <div className="error-message">{error}</div>
      )}
    </div>
  );
}
```

### File Gallery Component

```tsx
// src/app/components/FileGallery.tsx
import { useState, useEffect } from 'react';

interface FileItem {
  key: string;
  url: string;
  size: number;
  uploaded: string;
  metadata?: Record<string, string>;
}

interface FileGalleryProps {
  prefix?: string;
  limit?: number;
  onSelect?: (file: FileItem) => void;
  onDelete?: (file: FileItem) => void;
  refreshInterval?: number;
}

export function FileGallery({
  prefix,
  limit = 50,
  onSelect,
  onDelete,
  refreshInterval = 0,
}: FileGalleryProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (prefix) params.append('prefix', prefix);
      if (limit) params.append('limit', limit.toString());
      
      const response = await fetch(`/api/files?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch files: ${response.status}`);
      }
      
      const data = await response.json();
      setFiles(data.files);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchFiles();
    
    // Set up refresh interval if specified
    if (refreshInterval > 0) {
      const interval = setInterval(fetchFiles, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [prefix, limit, refreshInterval]);
  
  const handleDelete = async (file: FileItem) => {
    if (!confirm(`Are you sure you want to delete ${file.key}?`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/files/${encodeURIComponent(file.key)}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete file: ${response.status}`);
      }
      
      // Remove file from the list
      setFiles(files.filter(f => f.key !== file.key));
      
      // Call onDelete callback if provided
      onDelete?.(file);
    } catch (err) {
      setError(err.message);
    }
  };
  
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };
  
  const isImage = (key: string): boolean => {
    const ext = key.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '');
  };
  
  if (loading && files.length === 0) {
    return <div className="loading">Loading files...</div>;
  }
  
  if (error) {
    return <div className="error">{error}</div>;
  }
  
  if (files.length === 0) {
    return <div className="empty">No files found</div>;
  }
  
  return (
    <div className="file-gallery">
      <div className="file-grid">
        {files.map((file) => (
          <div key={file.key} className="file-item">
            {isImage(file.key) ? (
              <div className="file-preview">
                <img src={file.url} alt={file.key} />
              </div>
            ) : (
              <div className="file-icon">
                {file.key.split('.').pop()?.toUpperCase()}
              </div>
            )}
            
            <div className="file-info">
              <div className="file-name" title={file.key}>
                {file.key.split('/').pop()}
              </div>
              <div className="file-size">{formatFileSize(file.size)}</div>
            </div>
            
            <div className="file-actions">
              <button
                className="view-button"
                onClick={() => onSelect?.(file)}
              >
                View
              </button>
              <button
                className="delete-button"
                onClick={() => handleDelete(file)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```
