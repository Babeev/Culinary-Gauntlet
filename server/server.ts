import express, { Request, Response } from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Pool } from 'pg';
import qs from 'qs'; // For URL-encoded bodies

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Allows your React app to talk to this server
app.use(express.json());

// Request Logging Middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Database Connection
const dbUrl = process.env.DATABASE_URL;
const isDbUrlValid =
  dbUrl && (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://'));

if (!isDbUrlValid && dbUrl) {
  console.warn(
    'DATABASE_URL is present but invalid (must start with postgres://). Ignoring.'
  );
}

const pool = isDbUrlValid
  ? new Pool({
      connectionString: dbUrl,
      ssl:
        process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: false }
          : false,
    })
  : null;

// Initialize DB
const initDB = async () => {
  if (!pool) {
    console.warn('DATABASE_URL not set. Skipping DB initialization.');
    return;
  }
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subscribers (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
};

initDB();

// Multer for handling file uploads (in memory)
const upload = multer({ storage: multer.memoryStorage() });

// Gemini Client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// --- FATSECRET HELPERS ---

let fatSecretToken: string | null = null;
let fatSecretTokenExpiresAt: number = 0;

const getFatSecretToken = async (): Promise<string> => {
  const now = Date.now();
  if (fatSecretToken && now < fatSecretTokenExpiresAt) {
    return fatSecretToken;
  }

  const clientId = process.env.FATSECRET_CLIENT_ID;
  const clientSecret = process.env.FATSECRET_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('FatSecret Client ID or Secret is missing');
  }

  const authString = Buffer.from(`${clientId}:${clientSecret}`).toString(
    'base64'
  );

  try {
    const response = await axios.post(
      'https://oauth.fatsecret.com/connect/token',
      qs.stringify({
        grant_type: 'client_credentials',
        scope: 'basic',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${authString}`,
        },
      }
    );

    fatSecretToken = response.data.access_token;
    // Expires in is in seconds, subtract 60s buffer
    fatSecretTokenExpiresAt = now + (response.data.expires_in - 60) * 1000;
    return fatSecretToken as string;
  } catch (error) {
    console.error('Failed to get FatSecret token:', error);
    throw error;
  }
};

// --- ROUTES ---

// Health check
app.get('/', (req: Request, res: Response) => {
  res.send('Iron Chef Server is Online 👨‍🍳');
});

// Subscribe (Collect Email)
app.post('/api/subscribe', async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  try {
    if (pool) {
      await pool.query(
        'INSERT INTO subscribers (email) VALUES ($1) ON CONFLICT (email) DO NOTHING',
        [email]
      );
      res.json({ message: 'Subscribed successfully' });
    } else {
      console.log('Simulated subscription for (no DB configured):', email);
      res.json({ message: 'Subscribed successfully (simulated)' });
    }
  } catch (error) {
    console.error('DB Error:', error);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

// List Subscribers (For Analytics)
app.get('/api/subscribers', async (req: Request, res: Response) => {
  try {
    if (!pool) {
      res.json({ subscribers: [] });
      return;
    }
    const result = await pool.query(
      'SELECT * FROM subscribers ORDER BY created_at DESC'
    );
    res.json({ subscribers: result.rows });
  } catch (error) {
    console.error('DB Error:', error);
    res.status(500).json({ error: 'Failed to fetch subscribers' });
  }
});

// List Gemini Models
app.get('/api/models', async (req: Request, res: Response) => {
  if (!process.env.GEMINI_API_KEY) {
    res.status(500).json({ error: 'Gemini API Key not configured' });
    return;
  }

  try {
    const response = await axios.get(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
    );

    res.json(response.data);
  } catch (error) {
    console.error('Failed to list models:', error);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    res
      .status(500)
      .json({ error: 'Failed to list models', details: (error as any).message });
  }
});

// Image to Ingredients
app.post(
  '/api/ingredients/image',
  upload.single('image'),
  async (req: Request, res: Response): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const file = (req as any).file;

    if (!file) {
      res.status(400).json({ error: 'No image file provided' });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({ error: 'Gemini API Key not configured' });
      return;
    }

    try {
      // Initialize model
      // Using specific version from user's available model list
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-001' });

      const prompt =
        'Identify the food ingredients in this image. Return ONLY a comma-separated list of ingredients in English (e.g. "chicken, tomato, onion"). Do not include quantities or explanations.';

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: file.buffer.toString('base64'),
            mimeType: file.mimetype,
          },
        },
      ]);

      const response = await result.response;
      const text = response.text();

      // Clean up the text (remove newlines, extra spaces)
      const ingredients = text
        .replace(/\n/g, '')
        .split(',')
        .map((i) => i.trim())
        .filter((i) => i.length > 0);

      res.json({ ingredients });
    } catch (error) {
      console.error(
        'Gemini API Error Details:',
        JSON.stringify(error, null, 2)
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const status = (error as any).status || 500;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const message = (error as any).message || 'Failed to analyze image';

      res.status(status).json({
        error: 'Failed to analyze image',
        details: message,
        googleStatus: status,
      });
    }
  }
);

// --- SPOONACULAR API ROUTES (ACTIVE) ---

// The Main Event: Search by Ingredients
app.get('/api/recipes', async (req: Request, res: Response) => {
  const { ingredients } = req.query;

  if (!ingredients) {
    // return explicitly to satisfy void return type of handler vs response
    res.status(400).json({ error: 'Ingredients are required' });
    return;
  }

  try {
    // Spoonacular Endpoint: Find By Ingredients
    const response = await axios.get(
      'https://api.spoonacular.com/recipes/findByIngredients',
      {
        params: {
          apiKey: process.env.SPOONACULAR_API_KEY,
          ingredients: ingredients, // e.g., "apples,flour,sugar"
          number: 9, // Limit results for grid view
          ranking: 1, // 1 = Minimize missing ingredients
          ignorePantry: true, // Don't assume I have salt/water, etc.
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('API Error:', (error as Error).message);

    // --- HACKATHON SAFETY NET ---
    // If the API fails (or you run out of credits), send this dummy data
    // so you can keep working on the Frontend design without stopping.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((error as any).response && (error as any).response.status === 402) {
      console.log('Quota exceeded, serving fallback data');
      res.json(FALLBACK_DATA);
      return;
    }

    res.status(500).json({ error: 'Failed to fetch recipes' });
  }
});

// Get Recipe Details
app.get('/api/recipes/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const response = await axios.get(
      `https://api.spoonacular.com/recipes/${id}/information`,
      {
        params: {
          apiKey: process.env.SPOONACULAR_API_KEY,
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('API Error (Details):', (error as Error).message);
    // Fallback for details could be added here if needed, but for now error out
    res.status(500).json({ error: 'Failed to fetch recipe details' });
  }
});


// --- FATSECRET API ROUTES (BACKUP / WAITING FOR APPROVAL) ---
// To use these, change the frontend URL or swap the endpoint paths above.

// Search by Ingredients (Using FatSecret)
app.get('/api/fatsecret/recipes', async (req: Request, res: Response) => {
  const { ingredients } = req.query;

  if (!ingredients) {
    res.status(400).json({ error: 'Ingredients are required' });
    return;
  }

  // If ingredients comes as "apple,sugar", we keep it as is or split it.
  // FatSecret search expression works well with spaces.
  const searchExpression = (ingredients as string).replace(/,/g, ' ');
  const ingredientsList = (ingredients as string)
    .split(',')
    .map((i) => i.trim().toLowerCase());

  try {
    const token = await getFatSecretToken();
    console.log('FatSecret Token obtained');

    // 1. Search for recipes
    console.log(`Searching for: "${searchExpression}"`);
    const searchResponse = await axios.get(
      'https://platform.fatsecret.com/rest/server.api',
      {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          method: 'recipes.search.v2',
          format: 'json',
          search_expression: searchExpression,
          max_results: 9,
        },
      }
    );

    // DEBUGGING: Log the FULL raw response data
    console.log('Full FatSecret Response Data:', JSON.stringify(searchResponse.data, null, 2));

    // FatSecret structure: { recipes: { recipe: [...] } } or { recipes: { page_number: 0, total_results: 0 } } if empty
    const recipesData = searchResponse.data.recipes;
    
    const searchResults = recipesData?.recipe || [];

    // Handle case where only 1 result is returned (FatSecret sometimes returns object instead of array for single result)
    const resultsArray = Array.isArray(searchResults)
      ? searchResults
      : [searchResults];
    
    // If resultsArray contains only undefined or empty objects, it's empty
    if (resultsArray.length === 0 || (resultsArray.length === 1 && !resultsArray[0])) {
       console.log('No recipes found.');
       res.json([]);
       return;
    }

    // 2. Fetch details for each recipe to calculate missed/used ingredients
    // (We need details because search results don't include ingredients)
    const detailedRecipes = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resultsArray.map(async (r: any) => {
        if (!r || !r.recipe_id) return null;

        try {
          const detailResponse = await axios.get(
            'https://platform.fatsecret.com/rest/server.api',
            {
              headers: { Authorization: `Bearer ${token}` },
              params: {
                method: 'recipe.get.v2',
                format: 'json',
                recipe_id: r.recipe_id,
              },
            }
          );
          const detail = detailResponse.data.recipe;
          
          // Extract ingredients list
          const recipeIngredientsRaw = detail.ingredients?.ingredient || [];
          const recipeIngredientsArray = Array.isArray(recipeIngredientsRaw)
            ? recipeIngredientsRaw
            : [recipeIngredientsRaw];

          // Map ingredients to simple strings for comparison
          const recipeIngredientNames = recipeIngredientsArray.map(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (i: any) => i.food_name || i.recipe_ingredient_description // Fallback
          );

          // Simple matching logic
          const usedIngredients: Ingredient[] = [];
          const missedIngredients: Ingredient[] = [];

          recipeIngredientNames.forEach((name: string) => {
            const lowerName = name.toLowerCase();
            // Check if any user ingredient is part of this ingredient name
            const isPresent = ingredientsList.some((userIng) =>
              lowerName.includes(userIng)
            );
            if (isPresent) {
              usedIngredients.push({ name });
            } else {
              missedIngredients.push({ name });
            }
          });

          return {
            id: r.recipe_id,
            title: r.recipe_name,
            image: r.recipe_image || 'https://placehold.co/312x231?text=No+Image',
            missedIngredientCount: missedIngredients.length,
            usedIngredientCount: usedIngredients.length,
            missedIngredients,
            usedIngredients,
          };
        } catch (err) {
          console.error(
            `Failed to fetch details for recipe ${r.recipe_id}`,
            err
          );
          return null;
        }
      })
    );

    // Filter out nulls
    const validRecipes = detailedRecipes.filter((r) => r !== null);
    
    res.json(validRecipes);

  } catch (error) {
    console.error('FatSecret API Error:', error);
    // Return fallback data if API fails
    res.json(FALLBACK_DATA);
  }
});

// Get Recipe Details (Using FatSecret)
app.get('/api/fatsecret/recipes/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const token = await getFatSecretToken();
    const response = await axios.get(
      'https://platform.fatsecret.com/rest/server.api',
      {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          method: 'recipe.get.v2',
          format: 'json',
          recipe_id: id,
        },
      }
    );

    const r = response.data.recipe;
    
    // Normalizing arrays (FatSecret returns single object if only 1 item)
    const ingredientsRaw = r.ingredients?.ingredient || [];
    const ingredientsArray = Array.isArray(ingredientsRaw) ? ingredientsRaw : [ingredientsRaw];
    
    const directionsRaw = r.directions?.direction || [];
    const directionsArray = Array.isArray(directionsRaw) ? directionsRaw : [directionsRaw];

    // Map to our frontend expected format
    const recipeDetail = {
        id: r.recipe_id,
        title: r.recipe_name,
        image: r.recipe_image,
        readyInMinutes: r.preparation_time_min || 30, // Fallback
        servings: r.number_of_servings || 2,
        summary: r.recipe_description,
        extendedIngredients: ingredientsArray.map((i: any) => ({
            original: i.recipe_ingredient_description || `${i.number_of_units} ${i.measurement_description} ${i.food_name}`
        })),
        instructions: directionsArray.map((d: any) => d.recipe_direction_description).join('\n\n'),
        sourceUrl: r.recipe_url
    };

    res.json(recipeDetail);
  } catch (error) {
    console.error('API Error (Details):', (error as Error).message);
    res.status(500).json({ error: 'Failed to fetch recipe details' });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// --- DUMMY DATA FOR TESTING/FALLBACK ---
interface Ingredient {
  name: string;
}

interface Recipe {
  id: number;
  title: string;
  image: string;
  missedIngredientCount: number;
  missedIngredients: Ingredient[];
}

const FALLBACK_DATA: Recipe[] = [
  {
    id: 73420,
    title: 'Apple Or Peach Strudel (Fallback)',
    image: 'https://img.spoonacular.com/recipes/73420-312x231.jpg',
    missedIngredientCount: 2,
    missedIngredients: [{ name: 'baking powder' }, { name: 'cinnamon' }],
  },
];
