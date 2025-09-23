const API = "http://localhost:3000";

async function timedFetch(url, opts = {}) {
  const start = performance.now();
  try {
    const res = await fetch(url, opts);
    const ms = Math.round(performance.now() - start);
    // copia do status e tempo para logs/retorno
    const info = { ok: res.ok, status: res.status, timeMs: ms };
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw {
        message: `HTTP ${res.status}`,
        status: res.status,
        body: text,
        info,
      };
    }
    const json = await res.json().catch(() => null);
    return { data: json, info };
  } catch (err) {
    const ms = Math.round(performance.now() - start);
    // normalize error object
    if (err && err.info) throw err;
    throw {
      message: err.message || "Network error",
      status: err.status || 0,
      info: { timeMs: ms },
    };
  }
}

export async function getWaves() {
  const resp = await timedFetch(`${API}/waves`);
  return { data: resp.data, meta: resp.info };
}

export async function getScores() {
  const resp = await timedFetch(`${API}/scores`);
  return { data: resp.data, meta: resp.info };
}

export async function postScore(payload) {
  const resp = await timedFetch(`${API}/scores`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { data: resp.data, meta: resp.info };
}

// Segunda API simples (exemplo: hora de São Paulo)
// Não exige chave e serve como "segunda API integrada" para demonstrar latência/códigos.
export async function getServerTime() {
  // usar API pública sem auth; se quiser trocar, substitua a URL
  const resp = await timedFetch(
    "https://worldtimeapi.org/api/timezone/America/Sao_Paulo"
  );
  return { data: resp.data, meta: resp.info };
}
