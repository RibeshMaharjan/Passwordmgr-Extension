chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  
  if (message.type === "DETECT_LOGIN_FORM") {
    chrome.storage.local.get("token", async (data) => {
      if (!data.token) return; // User not logged in

      try {
        let response = await fetch(
          "http://localhost:81/Password-Mgr/app/api/getPassword.php",
          {
            method: "GET",
            headers: { Authorization: `Bearer ${data.token}` },
          }
        );

        let result = await response.json();
        if (result.success) {
          chrome.storage.local.set({ passwords: result.passwords });
        }
      } catch (error) {
        console.log("Failed to fetch passwords:", error);
      }
    });

    chrome.runtime.sendMessage({
      type: "LOGIN",
    });
  }

  if (message.type === "FETCH_CREDENTIALS") {
    chrome.storage.local.get(["passwords"], (data) => {
      sendResponse({ passwords: data.passwords || [] });
    });

    return true; // Required for async response
  }
});