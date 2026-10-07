import { getVercelOidcToken } from '@vercel/oidc';

const AUDIENCE = '//iam.googleapis.com/projects/384061856530/locations/global/workloadIdentityPools/vercel-chalamandra/providers/vercel-team';
const SERVICE_ACCOUNT = 'chalamandra-hub@chalamandrax.iam.gserviceaccount.com';
export default async function handler(req, res) {
  try {
    const oidcToken = await getVercelOidcToken();

    const stsBody = new URLSearchParams({
      audience: AUDIENCE,
      grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
      requested_token_type: 'urn:ietf:params:oauth:token-type:access_token',
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
      subject_token: oidcToken
    });

    const stsResponse = await fetch('https://sts.googleapis.com/v1/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: stsBody
    });

    const stsData = await stsResponse.json();

    if (!stsResponse.ok || !stsData.access_token) {
      return res.status(502).json({
        ok: false,
        oidc: true,
        sts: false,
        error: stsData.error_description || stsData.error || 'STS exchange failed'
      });
    }

    const iamResponse = await fetch(
      `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${encodeURIComponent(SERVICE_ACCOUNT)}:generateAccessToken`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${stsData.access_token}`
        },
        body: JSON.stringify({
          scope: ['https://www.googleapis.com/auth/cloud-platform']
        })
      }
    );

    const iamData = await iamResponse.json();

    if (!iamResponse.ok || !iamData.accessToken) {
      return res.status(502).json({
        ok: false,
        oidc: true,
        sts: true,
        impersonation: false,
        error: iamData.error?.message || 'Service account impersonation failed'
      });
    }

    return res.status(200).json({
      ok: true,
      oidc: true,
      sts: true,
      impersonation: true,
      serviceAccount: SERVICE_ACCOUNT,
      expiresIn: iamData.expireTime || null
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
