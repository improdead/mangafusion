import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class StorageService {
    private supabase: SupabaseClient | null = null;
    private adminSupabase: SupabaseClient | null = null;
    private readonly bucket: string;

    constructor() {
        const url = process.env.SUPABASE_URL;
        const anonKey = process.env.SUPABASE_ANON_KEY;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        this.bucket = process.env.SUPABASE_BUCKET || 'manga-images';

        if (url && anonKey) {
            this.supabase = createClient(url, anonKey);

            // Create admin client if service role key is available
            if (serviceRoleKey) {
                this.adminSupabase = createClient(url, serviceRoleKey, {
                    auth: {
                        autoRefreshToken: false,
                        persistSession: false
                    }
                });
            }
        }
    }

    get enabled(): boolean {
        return this.supabase !== null;
    }

    async uploadImage(
        buffer: Buffer,
        filename: string,
        contentType: string = 'image/png'
    ): Promise<string> {
        if (!this.supabase) {
            throw new Error('Supabase not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY');
        }

        // Try to upload
        const { data, error } = await this.supabase.storage
            .from(this.bucket)
            .upload(filename, buffer, {
                contentType,
                upsert: true,
            });

        if (error) {
            // Handle different types of errors
            if (error.message.includes('row-level security policy')) {
                console.error('❌ Storage upload failed: RLS policy violation');
                console.log('The bucket exists but RLS policies are blocking uploads.');
                console.log('Please check your bucket policies in Supabase dashboard:');
                console.log(`1. Go to https://supabase.com/dashboard/project/bhliiabzcpxldjxcwarv/storage/buckets`);
                console.log(`2. Click on the '${this.bucket}' bucket`);
                console.log('3. Go to "Policies" tab');
                console.log('4. Make sure there are policies allowing INSERT and SELECT for public access');
                throw new Error(`Storage RLS policy blocks uploads to '${this.bucket}' bucket`);
            }

            // If bucket doesn't exist, try to create it
            if (error.message.includes('Bucket not found')) {
                console.log(`Bucket '${this.bucket}' not found, attempting to create...`);

                // Use admin client if available, otherwise regular client
                const clientToUse = this.adminSupabase || this.supabase;

                const { error: createError } = await clientToUse.storage.createBucket(this.bucket, {
                    public: true,
                    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
                    fileSizeLimit: 10485760, // 10MB
                });

                if (createError) {
                    console.error(`Failed to create bucket: ${createError.message}`);
                    if (!this.adminSupabase) {
                        console.log('💡 Tip: Set SUPABASE_SERVICE_ROLE_KEY for automatic bucket creation');
                    }
                    console.log('Please manually create the bucket in Supabase dashboard:');
                    console.log(`1. Go to https://supabase.com/dashboard/project/bhliiabzcpxldjxcwarv/storage/buckets`);
                    console.log(`2. Create a new bucket named '${this.bucket}'`);
                    console.log('3. Make it public');
                    console.log('4. Set allowed MIME types: image/png, image/jpeg, image/webp');
                    throw new Error(`Bucket '${this.bucket}' does not exist and cannot be created automatically. Please create it manually.`);
                } else {
                    console.log(`✅ Successfully created bucket '${this.bucket}'`);
                }

                // Retry upload after creating bucket
                const { data: retryData, error: retryError } = await this.supabase.storage
                    .from(this.bucket)
                    .upload(filename, buffer, {
                        contentType,
                        upsert: true,
                    });

                if (retryError) {
                    throw new Error(`Upload failed after bucket creation: ${retryError.message}`);
                }
            } else {
                throw new Error(`Upload failed: ${error.message}`);
            }
        }

        // Get public URL
        const { data: publicData } = this.supabase.storage
            .from(this.bucket)
            .getPublicUrl(filename);

        return publicData.publicUrl;
    }

  async uploadAudio(
    buffer: Buffer,
    filename: string,
    contentType: string = 'audio/mpeg'
  ): Promise<string> {
    if (!this.supabase) {
      throw new Error('Supabase not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY');
    }

    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .upload(filename, buffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      throw new Error(`Audio upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: publicData } = this.supabase.storage
      .from(this.bucket)
      .getPublicUrl(filename);

    return publicData.publicUrl;
  }

  async deleteImage(filename: string): Promise<void> {
    if (!this.supabase) return;

        const { error } = await this.supabase.storage
            .from(this.bucket)
            .remove([filename]);

    if (error) {
      console.warn(`Failed to delete ${filename}:`, error.message);
    }
  }

  async listPublicUrls(prefix: string): Promise<string[]> {
    if (!this.supabase) {
      throw new Error('Supabase not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY');
    }
    const folder = prefix.replace(/^\/+/, '');
    const { data, error } = await this.supabase.storage.from(this.bucket).list(folder, { limit: 1000 });
    if (error) throw new Error(`List failed: ${error.message}`);
    const urls: string[] = [];
    for (const item of data || []) {
      if (item.name.match(/\.(png|jpg|jpeg|webp)$/i)) {
        const full = `${folder}/${item.name}`;
        const { data: pub } = this.supabase.storage.from(this.bucket).getPublicUrl(full);
        urls.push(pub.publicUrl);
      }
    }
    return urls;
  }
}
