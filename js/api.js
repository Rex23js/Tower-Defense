const API = "http://localhost:3000";

export async function getWaves() {
  const res = await fetch(`${API}/waves`);
  if (!res.ok) throw new Error("Falha ao buscar waves");
  return res.json();
}

export async function getScores() {
  const res = await fetch(`${API}/scores`);
  if (!res.ok) throw new Error("Falha ao buscar scores");
  return res.json();
}

export async function postScore(payload) {
  const res = await fetch(`${API}/scores`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Falha ao salvar score");
  return res.json();
}
