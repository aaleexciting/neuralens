// This is the final, corrected version of the function.
// It uses the 'form-data' library to correctly package file uploads
// which resolves the 'multipart/form-data' encoding error.

const fetch = require('node-fetch');
const FormData = require('form-data');
const { Readable } = require('stream');

exports.handler = async function (event) {
  const { imageUrl, imageData } = JSON.parse(event.body);

  const API_USER = process.env.SIGHTENGINE_USER;
  const API_SECRET = process.env.SIGHTENGINE_SECRET;

  if (!API_USER || !API_SECRET) {
    return { statusCode: 500, body: JSON.stringify({ error: "API credentials are not configured." }) };
  }

  const SIGHTENGINE_API_URL = 'https://api.sightengine.com/1.0/check.json';
  
  try {
    let response;
    if (imageUrl) {
      // Handle URL analysis (this part remains the same)
      const params = new URLSearchParams({
        models: 'genai',
        api_user: API_USER,
        api_secret: API_SECRET,
        url: imageUrl,
      });
      response = await fetch(`${SIGHTENGINE_API_URL}?${params.toString()}`);

    } else if (imageData) {
      // Handle file upload using form-data
      const form = new FormData();
      form.append('models', 'genai');
      form.append('api_user', API_USER);
      form.append('api_secret', API_SECRET);
      
      // Convert the base64 string back into a buffer the API can understand
      const buffer = Buffer.from(imageData.split(',')[1], 'base64');
      form.append('media', buffer, { filename: 'image.jpg' });

      response = await fetch(SIGHTENGINE_API_URL, {
        method: 'POST',
        body: form,
      });

    } else {
      return { statusCode: 400, body: JSON.stringify({ error: 'No image URL or data provided.' }) };
    }

    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };

  } catch (error) {
    console.error("Error calling Sightengine API:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch data from Sightengine API." }),
    };
  }
};
