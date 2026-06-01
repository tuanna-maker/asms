const base = process.env.API_BASE ?? "http://127.0.0.1:4001";
const id = process.argv[2] ?? "cmpccqtz3000g9d58h8qdfc2b";
const email = process.argv[3] ?? "admin@demo.local";

async function main() {
  const loginRes = await fetch(`${base}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "Password123!" }),
  });
  const loginJson = (await loginRes.json()) as {
    data?: { token?: string };
    message?: string;
  };
  const token = loginJson.data?.token;
  if (!token) {
    console.error("login failed", loginRes.status, loginJson);
    process.exit(1);
  }

  const detailRes = await fetch(`${base}/api/v1/customer-feedbacks/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const detailJson = await detailRes.json();
  console.log(email, "->", detailRes.status, detailJson.message ?? "ok");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
