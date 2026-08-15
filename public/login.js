const form = document.querySelector("#loginForm");
const error = document.querySelector("#loginError");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = form.querySelector("button");
  button.disabled = true;
  button.textContent = "Signing in…";
  error.textContent = "";
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(form)))
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "Sign-in failed.");
    window.location.assign("/");
  } catch (requestError) {
    error.textContent = requestError.message;
  } finally {
    button.disabled = false;
    button.textContent = "Sign in";
  }
});
