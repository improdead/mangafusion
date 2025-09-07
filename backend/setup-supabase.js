const { createClient } = require('@supabase/supabase-js');
require('dotenv/config');

async function setupSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  const bucketName = process.env.SUPABASE_BUCKET || 'manga-images';

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }

    const bucketExists = buckets.some(bucket => bucket.name === bucketName);

    if (bucketExists) {
      console.log(`✅ Bucket '${bucketName}' already exists`);
    } else {
      // Create bucket
      const { data, error } = await supabase.storage.createBucket(bucketName, {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
        fileSizeLimit: 10485760, // 10MB
      });

      if (error) {
        console.error('Error creating bucket:', error);
        return;
      }

      console.log(`✅ Created bucket '${bucketName}'`);
    }

    // Test upload
    const testBuffer = Buffer.from('test image data');
    const testFilename = `test/test-${Date.now()}.png`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(testFilename, testBuffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      console.error('Error testing upload:', uploadError);
      return;
    }

    console.log('✅ Test upload successful');

    // Get public URL
    const { data: publicData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(testFilename);

    console.log('✅ Public URL test:', publicData.publicUrl);

    // Clean up test file
    await supabase.storage.from(bucketName).remove([testFilename]);
    console.log('✅ Test file cleaned up');

    console.log('\n🎉 Supabase storage setup complete!');
    console.log(`Bucket: ${bucketName}`);
    console.log(`URL: ${supabaseUrl}`);

  } catch (error) {
    console.error('Setup failed:', error);
  }
}

setupSupabase();