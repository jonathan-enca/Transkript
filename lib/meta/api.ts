/**
 * Meta Marketing API Client
 * Handles all interactions with Facebook/Meta Ads API
 */

const META_API_VERSION = "v21.0";
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

export interface MetaAdAccount {
  id: string;
  account_id: string;
  name: string;
  currency: string;
  account_status: number;
}

export interface MetaAd {
  id: string;
  name: string;
  status: string;
  creative: {
    id: string;
    name: string;
    object_story_spec?: {
      video_data?: {
        video_id?: string;
        image_url?: string;
        message?: string;
        call_to_action?: {
          type: string;
        };
        link_description?: string;
      };
      link_data?: {
        image_hash?: string;
        link?: string;
        message?: string;
        name?: string;
        call_to_action?: {
          type: string;
        };
        description?: string;
      };
    };
    thumbnail_url?: string;
  };
  adset: {
    id: string;
    name: string;
  };
  campaign: {
    id: string;
    name: string;
  };
  created_time: string;
  updated_time: string;
}

export interface MetaInsights {
  ad_id: string;
  date_start: string;
  date_stop: string;
  spend: string;
  impressions: string;
  reach: string;
  frequency: string;
  clicks: string;
  cpc: string;
  ctr: string;
  cpm: string;
  outbound_clicks?: string;
  outbound_clicks_ctr?: string;
  cost_per_outbound_click?: string;
  inline_link_clicks?: string;
  inline_link_click_ctr?: string;
  video_thruplay_watched_actions?: Array<{
    action_type: string;
    value: string;
  }>;
  video_p25_watched_actions?: Array<{
    action_type: string;
    value: string;
  }>;
  video_p50_watched_actions?: Array<{
    action_type: string;
    value: string;
  }>;
  video_p75_watched_actions?: Array<{
    action_type: string;
    value: string;
  }>;
  video_p100_watched_actions?: Array<{
    action_type: string;
    value: string;
  }>;
  video_avg_time_watched_actions?: Array<{
    action_type: string;
    value: string;
  }>;
  actions?: Array<{
    action_type: string;
    value: string;
  }>;
  action_values?: Array<{
    action_type: string;
    value: string;
  }>;
  cost_per_action_type?: Array<{
    action_type: string;
    value: string;
  }>;
  purchase_roas?: Array<{
    action_type: string;
    value: string;
  }>;
}

/**
 * Fetch user's ad accounts
 */
export async function getAdAccounts(accessToken: string): Promise<MetaAdAccount[]> {
  const url = `${META_API_BASE}/me/adaccounts?fields=id,account_id,name,currency,account_status&access_token=${accessToken}`;

  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Meta API Error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Fetch ads from an ad account (single page)
 */
export async function getAds(
  adAccountId: string,
  accessToken: string,
  limit = 100
): Promise<MetaAd[]> {
  const fields = [
    'id',
    'name',
    'status',
    'created_time',
    'updated_time',
    'creative{id,name,thumbnail_url,object_story_spec}',
    'adset{id,name}',
    'campaign{id,name}'
  ].join(',');

  const url = `${META_API_BASE}/${adAccountId}/ads?fields=${fields}&limit=${limit}&access_token=${accessToken}`;

  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Meta API Error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Fetch ALL ads from an ad account (with pagination)
 */
export async function getAllAds(
  adAccountId: string,
  accessToken: string,
  pageSize = 100
): Promise<MetaAd[]> {
  const fields = [
    'id',
    'name',
    'status',
    'created_time',
    'updated_time',
    'creative{id,name,thumbnail_url,object_story_spec}',
    'adset{id,name}',
    'campaign{id,name}'
  ].join(',');

  let allAds: MetaAd[] = [];
  let nextPageUrl: string | null = `${META_API_BASE}/${adAccountId}/ads?fields=${fields}&limit=${pageSize}&access_token=${accessToken}`;

  while (nextPageUrl) {
    const response = await fetch(nextPageUrl);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Meta API Error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const pageAds = data.data || [];
    allAds = allAds.concat(pageAds);

    // Check if there's a next page
    nextPageUrl = data.paging?.next || null;

    // Log progress
    console.log(`📥 Fetched ${allAds.length} ads so far...`);
  }

  return allAds;
}

/**
 * Fetch insights for ads
 */
export async function getAdInsights(
  adAccountId: string,
  accessToken: string,
  dateFrom: string, // YYYY-MM-DD
  dateTo: string, // YYYY-MM-DD
  level: 'account' | 'campaign' | 'adset' | 'ad' = 'ad'
): Promise<MetaInsights[]> {
  const fields = [
    'ad_id',
    'date_start',
    'date_stop',
    'spend',
    'impressions',
    'reach',
    'frequency',
    'clicks',
    'cpc',
    'ctr',
    'cpm',
    'outbound_clicks',
    'outbound_clicks_ctr',
    'cost_per_outbound_click',
    'inline_link_clicks',
    'inline_link_click_ctr',
    'video_thruplay_watched_actions',
    'video_p25_watched_actions',
    'video_p50_watched_actions',
    'video_p75_watched_actions',
    'video_p100_watched_actions',
    'video_avg_time_watched_actions',
    'actions',
    'action_values',
    'cost_per_action_type',
    'purchase_roas'
  ].join(',');

  const url = `${META_API_BASE}/${adAccountId}/insights?level=${level}&fields=${fields}&time_range={"since":"${dateFrom}","until":"${dateTo}"}&time_increment=1&access_token=${accessToken}`;

  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Meta API Error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Get long-lived access token
 */
export async function exchangeForLongLivedToken(
  shortLivedToken: string,
  appId: string,
  appSecret: string
): Promise<{ access_token: string; expires_in: number }> {
  const url = `${META_API_BASE}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`;

  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Token exchange failed: ${error.error?.message || 'Unknown error'}`);
  }

  return response.json();
}
