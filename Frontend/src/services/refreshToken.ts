export const refreshToken = async () => {
  const refresh = localStorage.getItem('refresh_token');
  if (!refresh) return false;

  const response = await fetch(
    '/api/auth/refresh/',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    }
  );

  if (!response.ok) return false;

  const data = await response.json();
  localStorage.setItem('access_token', data.access);
  return true;
};
