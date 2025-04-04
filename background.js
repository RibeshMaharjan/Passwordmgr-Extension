chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "TEST") {
    sendResponse({ status: "Background is running" });
  }
  console.log("Background is running");
  

  if (message.type === "DETECT_LOGIN_FORM") {
    console.log("Background is running form");
    
    chrome.storage.local.get("token", async (data) => {
      console.log("fetching data");
      if (!data.token) return; // User not logged in
      console.log("fetching data");
      
      try {
        let response = await fetch(
          "http://localhost/Password-Mgr/app/api/getPassword.php",
          {
            method: "GET",
            headers: { Authorization: `Bearer ${data.token}` },
          }
        );

        console.log(await response);
        
        let result = await response.json();
        console.log(result); // Log the result
        console.log(result.passwords);
        
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