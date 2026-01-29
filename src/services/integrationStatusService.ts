export interface IntegrationStatus {
  slackConfigured: boolean;
  slackChannelConfigured: boolean;
  tavilyConfigured: boolean;
}

const DEFAULT_STATUS_URL =
  import.meta.env.VITE_INTEGRATION_STATUS_URL ||
  'https://us-central1-mg-dashboard-ee066.cloudfunctions.net/integrationStatus';

export const getIntegrationStatus = async (): Promise<IntegrationStatus> => {
  const response = await fetch(DEFAULT_STATUS_URL, {
    method: 'GET',
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || 'Failed to load integration status.');
  }

  return data as IntegrationStatus;
};
