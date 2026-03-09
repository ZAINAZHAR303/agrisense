/**
 * Upload image or video to Cloudinary
 * @param {File} file - The file to upload
 * @returns {Promise<Object>} Upload result with URL and type
 */
export async function uploadToCloudinary(file) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary configuration missing');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${file.type.startsWith('video') ? 'video' : 'image'}/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data = await response.json();

    return {
      success: true,
      url: data.secure_url,
      publicId: data.public_id,
      type: file.type.startsWith('video') ? 'video' : 'image',
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}

/**
 * Validate media URL
 * @param {string} url - The URL to validate
 * @returns {Promise<Object>} Validation result with type
 */
export async function validateMediaUrl(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    
    if (!response.ok) {
      throw new Error('Invalid URL');
    }

    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.startsWith('image/')) {
      return { success: true, type: 'image', url };
    } else if (contentType.startsWith('video/')) {
      return { success: true, type: 'video', url };
    } else {
      throw new Error('URL must be an image or video');
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
}
