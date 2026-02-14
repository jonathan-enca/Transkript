/**
 * Meta Marketing API Types
 * Based on Facebook Marketing API v21.0
 */

export interface MetaAdAccount {
  id: string;
  account_id: string;
  name: string;
  currency: string;
  account_status: number;
  disable_reason?: number;
}

export interface MetaAdCreative {
  id: string;
  name: string;
  title?: string;
  body?: string;
  image_url?: string;
  image_hash?: string;
  thumbnail_url?: string;
  video_id?: string;
  object_story_spec?: Record<string, any>;
  asset_feed_spec?: Record<string, any>;
  effective_object_story_id?: string;
  url_tags?: string;
}

export interface MetaAd {
  id: string;
  name: string;
  creative: MetaAdCreative;
  status: "ACTIVE" | "PAUSED" | "DELETED" | "ARCHIVED";
  adset_id: string;
  campaign_id: string;
  created_time: string;
  updated_time: string;
}

export interface MetaCampaign {
  id: string;
  name: string;
  objective: string;
  status: string;
  daily_budget?: string;
  lifetime_budget?: string;
}

export interface MetaAdSet {
  id: string;
  name: string;
  targeting?: Record<string, any>;
  optimization_goal: string;
  billing_event: string;
  bid_strategy: string;
}

export interface MetaActionBreakdown {
  action_type: string;
  value: string;
}

export interface MetaVideoPlayAction {
  action_type: string;
  value: string;
}

export interface MetaInsights {
  ad_id: string;
  date_start: string;
  date_stop: string;

  // Core metrics
  spend: string;
  impressions: string;
  reach: string;
  frequency: string;

  // Click metrics
  clicks?: string;
  cpc?: string;
  ctr?: string;
  inline_link_clicks?: string;
  inline_link_click_ctr?: string;
  outbound_clicks?: Array<MetaActionBreakdown>;
  outbound_clicks_ctr?: Array<MetaActionBreakdown>;
  cost_per_outbound_click?: Array<MetaActionBreakdown>;

  // Cost metrics
  cpm?: string;
  cpp?: string;

  // Video metrics
  video_play_actions?: Array<MetaVideoPlayAction>;
  video_p25_watched_actions?: Array<MetaVideoPlayAction>;
  video_p50_watched_actions?: Array<MetaVideoPlayAction>;
  video_p75_watched_actions?: Array<MetaVideoPlayAction>;
  video_p100_watched_actions?: Array<MetaVideoPlayAction>;
  video_30_sec_watched_actions?: Array<MetaVideoPlayAction>;
  video_avg_time_watched_actions?: Array<MetaVideoPlayAction>;
  video_thru_play_watched_actions?: Array<MetaVideoPlayAction>;

  // Conversion metrics
  actions?: Array<MetaActionBreakdown>;
  action_values?: Array<MetaActionBreakdown>;
  cost_per_action_type?: Array<MetaActionBreakdown>;
  purchase_roas?: Array<MetaActionBreakdown>;

  // Breakdown dimensions
  publisher_platform?: string;
  platform_position?: string;
}

export interface MetaInsightsResponse {
  data: MetaInsights[];
  paging?: {
    cursors?: {
      before: string;
      after: string;
    };
    next?: string;
  };
}

export interface MetaBatchRequest {
  method: "GET" | "POST";
  relative_url: string;
}

export interface MetaBatchResponse {
  code: number;
  headers: Array<{ name: string; value: string }>;
  body: string;
}

export interface MetaError {
  message: string;
  type: string;
  code: number;
  error_subcode?: number;
  fbtrace_id: string;
}
