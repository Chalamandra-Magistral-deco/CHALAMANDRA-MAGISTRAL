import { getVercelOidcToken } from '@vercel/oidc';

export default async function handler(req, res) {
  try {
    const token = await getVercelOidcToken();
    res.status(200).json({
      ok: true,
      oidc: true,
      tokenPresent: Boolean(token)
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
