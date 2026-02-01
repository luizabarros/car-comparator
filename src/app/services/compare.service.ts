async function compareCars(carItems: string[]) {
  const res = await fetch('/api/search-analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(carItems),
  });

  if (!res.ok) {
    throw new Error('Erro ao comparar veículos');
  }

  return res.json();
}
