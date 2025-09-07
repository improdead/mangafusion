const { createClient } = require('@supabase/supabase-js');
require('dotenv/config');

async function testStorage() {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const bucketName = process.env.SUPABASE_BUCKET || 'manga-images';

  console.log('🧪 Testing Supabase storage...');
  console.log(`URL: ${url}`);
  console.log(`Bucket: ${bucketName}`);

  const supabase = createClient(url, anonKey);

  try {
    // Test upload
    console.log('🔄 Testing upload...');
    const testBuffer = Buffer.from('test manga image data');
    const testFilename = `test/test-${Date.now()}.png`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(testFilename, testBuffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      console.error('❌ Upload failed:', uploadError.message);
      return;
    }

    console.log('✅ Upload successful:', testFilename);
    
    // Get public URL
    const { data: publicData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(testFilename);
    
    console.log('🌐 Public URL:', publicData.publicUrl);
    
    // Clean up test file
    const { error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove([testFilename]);
    
    if (deleteError) {
      console.warn('⚠️  Failed to clean up test file:', deleteError.message);
    } else {
      console.log('🧹 Test file cleaned up');
    }
    
    console.log('🎉 Supabase storage is ready for manga image generation!');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testStorage().catch(console.error);