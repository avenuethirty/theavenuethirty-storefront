import createApp from './server.js';

let cachedApp = null;

export default async (req: any, res: any) => {
  try {
    if (!cachedApp) {
      cachedApp = await createApp();
    }
    cachedApp(req, res);
  } catch (error) {
    console.error('Serverless Initialization Error:', error);
    res.status(500).json({
      error: 'Failed to initialize serverless application',
      details: error?.message || 'Unknown error',
    });
  }
};
