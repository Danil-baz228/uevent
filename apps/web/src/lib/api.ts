export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

export async function fetchHealth() {
  const response = await fetch(`${API_BASE_URL}/health`);

  if (!response.ok) {
    throw new Error('Failed to fetch API health');
  }

  return response.json();
}
