const MAX_FIRE_TEXT = 65_536;

export function fireText(call) {
  const fields = ["source", "id", "url", "title"].filter((key) => call[key]).map((key) => `${key}=${call[key]}`);
  if (call.transcript) fields.push(`transcript=${call.transcript}`);
  return fields.join(" ").slice(0, MAX_FIRE_TEXT);
}

export async function fireRoutine(call, { routineId, token, apiVersion = "2023-06-01", fetchImpl = fetch }) {
  const response = await fetchImpl(`https://api.anthropic.com/v1/claude_code/routines/${routineId}/fire`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "anthropic-version": apiVersion,
      "content-type": "application/json",
    },
    body: JSON.stringify({ text: fireText(call) }),
  });
  if (!response.ok) throw new Error(`Routine fire failed: ${response.status} ${await response.text()}`);
  return response.json();
}
