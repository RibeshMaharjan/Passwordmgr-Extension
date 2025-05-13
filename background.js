chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "TEST") {
    sendResponse({ status: "Background is running" });
  }

  if (message.type === "DETECT_LOGIN_FORM") {
    handleLoginFormDetection();
  }

  if (message.type === "FETCH_CREDENTIALS") {
    handleCredentialsFetch(sendResponse);
    return true; // Required for async response
  }
});

async function handleLoginFormDetection() {
  try {
    const data = await chrome.storage.local.get("token");
    if (!data.token) return; // User not logged in

    // await fetchPasswords(data.token);
    chrome.runtime.sendMessage({ type: "LOGIN" });
  } catch (error) {
    console.error("Error in login form detection:", error);
  }
}

async function handleCredentialsFetch(sendResponse) {
  try {
    const data = await chrome.storage.local.get(["passwords", "token"]);
    
    if (data.token) {
      await fetchPasswords(data.token);
      const updatedData = await chrome.storage.local.get("passwords");
      sendResponse({ passwords: updatedData.passwords || [] });
    } else {
      sendResponse({ passwords: [] });
    }
  } catch (error) {
    console.error("Error fetching credentials:", error);
    sendResponse({ passwords: [], error: "Failed to fetch credentials" });
  }
}

async function fetchPasswords(token) {
  try {
    const response = await fetch(
      "http://localhost/Password-Mgr/public/api/getPassword.php",
      {
        method: "GET",
        headers: { 
          Authorization: `Bearer ${token}`
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log(response);
    const result = await response.json();
    console.log(result);
    
    if (result.success) {
      await chrome.storage.local.set({ passwords: result.passwords });
    } else {
      throw new Error("Failed to fetch passwords: " + (result.message || "Unknown error"));
    }
  } catch (error) {
    console.error("Password fetch error:", error);
    throw error;
  }
}