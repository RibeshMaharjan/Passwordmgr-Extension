(() => {
  let loginform;

  chrome.runtime.onMessage.addListener((obj, sender, response) => {
    const { type } = obj;

    if (type === "LOGIN") {
      console.log("This is login page");

      chrome.storage.local.get(["token", "passwords"], (data) => {
        if (!data.token || !data.passwords) return; // User not logged in or no passwords saved

        let site = window.location.hostname;
        let usernameField = document.querySelector("input[type='text'], input[type='email']") || "";
        let passwordField = document.querySelector("input[type='password']") || "";

        parts = site.split(".");
        site = parts.slice(-2).join(".");

        let match = data.passwords.find((entry) => entry.site_url === site);
        if (match) {
          if (usernameField) usernameField.value = match.username;
          if(passwordField) passwordField.value = match.password;
        }
      });
    }
  });
})();
