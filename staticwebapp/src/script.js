// JavaScript for handling API requests
document.getElementById("fetch-button").addEventListener("click", async () => {
  const responseElement = document.getElementById("api-response");
  responseElement.textContent = "Loading...";

  try {
    const response = await fetch("/api/funfact");
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const data = await response.json();
    responseElement.textContent = data.funfact || "No fun fact available.";
  } catch (error) {
    responseElement.textContent = `Error: ${error.message}`;
  }
});

document.getElementById("fetch-button-wa").addEventListener("click", async () => {
  const responseElement = document.getElementById("response-wa");
  responseElement.textContent = "Loading...";

  try {
    const response = await fetch("/api/funfactwa");
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const data = await response.json();
    responseElement.textContent = data.funfact || "No fun fact available.";
  } catch (error) {
    responseElement.textContent = `Error: ${error.message}`;
  }
});
