import type { Comment, PostListItem, SearchDocument } from "@freedompost/shared";

export interface StoredPost {
  id: string;
  slug: string;
  title: string;
  markdown: string;
  html: string;
  searchText: string;
  excerpt: string;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  commentCount: number;
  attachmentCount: number;
}

export type ProductStatus = "draft" | "published";

export interface StoredProduct {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  priceCents: number;
  compareAtCents: number | null;
  currency: string;
  stock: number;
  coverUrl: string | null;
  status: ProductStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductInput {
  title: string;
  summary: string;
  description: string;
  category: string;
  priceCents: number;
  compareAtCents: number | null;
  currency: string;
  stock: number;
  coverUrl: string | null;
  status: ProductStatus;
  sortOrder: number;
}

export interface CreatePostInput {
  title: string;
  markdown: string;
}

export interface UpdatePostInput {
  id: string;
  title: string;
  markdown: string;
}

export interface CreateCommentInput {
  postSlug: string;
  parentId: string | null;
  username: string;
  content: string;
  attachments: Comment["attachments"];
  fingerprintHash?: string | null;
  localIdHash?: string | null;
  ipHash: string;
}

export interface RecordViewInput {
  postSlug: string;
  viewDate: string;
  visitorKey: string;
  fingerprintHash?: string | null;
  localIdHash?: string | null;
  ipHash?: string | null;
}

export interface RecordViewResult {
  counted: boolean;
  viewCount: number;
}

export interface ContentRepository {
  listPosts(): Promise<StoredPost[]>;
  listPostSummaries(): Promise<PostListItem[]>;
  getPostBySlug(slug: string): Promise<StoredPost | null>;
  getPostById(id: string): Promise<StoredPost | null>;
  getSearchDocuments(): Promise<SearchDocument[]>;
  createPost(input: CreatePostInput): Promise<StoredPost>;
  updatePost(input: UpdatePostInput): Promise<StoredPost | null>;
  deletePost(id: string): Promise<boolean>;
  recordView(input: RecordViewInput): Promise<RecordViewResult | null>;
  listComments(postSlug: string): Promise<Comment[]>;
  createComment(input: CreateCommentInput): Promise<Comment | null>;
  deleteAttachmentsByIds(ids: string[]): Promise<void>;
  listProducts(options?: { publishedOnly?: boolean }): Promise<StoredProduct[]>;
  getProductBySlug(slug: string): Promise<StoredProduct | null>;
  getProductById(id: string): Promise<StoredProduct | null>;
  createProduct(input: ProductInput): Promise<StoredProduct>;
  updateProduct(id: string, input: ProductInput): Promise<StoredProduct | null>;
  deleteProduct(id: string): Promise<boolean>;
}
