// This is a more robust version of the function that uses a dynamic import for fetch.
// This method is more resilient and often solves silent build failures in Netlify.

exports.handler = async function (event) {
  // Use a dynamic import for node-fetch, which is more reliable in some build environments.
  const fetch = (await import('node-fetch')).default;

  // Get the data sent from your website. It will be either an `imageUrl` or `imageData`.
  const { imageUrl, imageData } = JSON.parse(event.body);

  // Securely access your secret keys from Netlify's environment variables
  const API_USER = process.env.SIGHTENGINE_USER;
  const API_SECRET = process.env.SIGHTENGINE_SECRET;

  if (!API_USER || !API_SECRET) {
    console.error("Function error: API credentials are not configured in Netlify environment variables.");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "API credentials are not configured on the server." }),
    };
  }

  // --- Prepare the request to Sightengine ---
  const SIGHTENGINE_API_URL = 'https://api.sightengine.com/1.0/check.json';
  const params = new URLSearchParams();
  params.append('models', 'genai');
  params.append('api_user', API_USER);
  params.append('api_secret', API_SECRET);
  
  let fetchOptions;
  let finalUrl;

  if (imageUrl) {
    // If it's a URL, add it to the parameters and use a GET request
    params.append('url', imageUrl);
    finalUrl = `${SIGHTENGINE_API_URL}?${params.toString()}`;
    fetchOptions = { method: 'GET' };
  } else if (imageData) {
    // If it's uploaded file data (base64), send it in the body of a POST request
    const body = new URLSearchParams(params);
    body.append('media_base64', imageData.split(',')[1]); // Remove the "data:image/jpeg;base64," part
    
    finalUrl = SIGHTENGINE_API_URL;
    fetchOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body,
    };
  } else {
    return { statusCode: 400, body: JSON.stringify({ error: 'No image URL or data provided.' }) };
  }
  
  try {
    // Call the Sightengine API from the secure server environment
    const response = await fetch(finalUrl, fetchOptions);
    const data = await response.json();

    // Return the results from Sightengine back to your website
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