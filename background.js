chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  
  if (tab.url && (tab.url.includes("login") || tab.url.includes("signin"))) {
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

    chrome.tabs.sendMessage(tabId, {
      type: "LOGIN",
    });
  }
});
