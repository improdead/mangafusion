const { createClient } = require('@supabase/supabase-js');
require('dotenv/config');

async function testStorage() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  const bucketName = process.env.SUPABASE_BUCKET || 'manga-images';

  console.log('Testing Supabase storage...');
  console.log('URL:', supabaseUrl);
  console.log('Bucket:', bucketName);

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // List existing buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      return;
    }

    console.log('📦 Existing buckets:', buckets.map(b => b.name));

    const bucketExists = buckets.some(bucket => bucket.name === bucketName);

    if (!bucketExists) {
      console.log(`⚠️  Bucket '${bucketName}' does not exist`);
      console.log('Please create it manually:');
      console.log('1. Go to https://supabase.com/dashboard/project/bhliiabzcpxldjxcwarv/storage/buckets');
      console.log(`2. Click "New bucket"`);
      console.log(`3. Name: ${bucketName}`);
      console.log('4. Make it public ✅');
      console.log('5. Set file size limit: 10MB');
      console.log('6. Allowed MIME types: image/png, image/jpeg, image/webp');
      return;
    }

    console.log(`✅ Bucket '${bucketName}' exists`);

    // Test upload
    const testBuffer = Buffer.from('test image data for manga generation');
    const testFilename = `test/test-${Date.now()}.png`;
    
    console.log('🔄 Testing upload...');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(testFilename, testBuffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      console.error('❌ Upload failed:', uploadError);
      return;
    }

    console.log('✅ Upload successful:', uploadData.path);

    // Get public URL
    const { data: publicData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(testFilename);

    console.log('🌐 Public URL:', publicData.publicUrl);

    // Clean up
    await supabase.storage.from(bucketName).remove([testFilename]);
    console.log('🧹 Test file cleaned up');

    console.log('\n🎉 Supabase storage is ready for manga image generation!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testStorage();