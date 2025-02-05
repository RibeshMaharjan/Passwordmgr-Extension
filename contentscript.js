(() => {

  // grab inputfield
  let usernameField = document.querySelector("input[type='text'], input[type='email']") || "";
  let passwordField = document.querySelector("input[type='password']") || "";

  if(!usernameField || !passwordField) return;

  // trigger when user focuses on inputfield
  usernameField.addEventListener('focus', () => {

    // fetch credentials
    chrome.runtime.sendMessage({ type: 'FETCH_CREDENTIALS' }, (response) => {
      
      if(!response || !response.passwords) return;

      let site = window.location.hostname;
      // Slice site_url to end-domain
      parts = site.split(".");
      site = parts.slice(-2).join(".");
      console.log(site);
      
      // Filter only those credentials that match siteurl
      let matchingEntries = response.passwords.filter(entries => entries.site_url === site);
      
      if(matchingEntries.length > 0) {
        // Put credentials on DOM
        showDropdown(matchingEntries, usernameField, passwordField);
      }
    })
  })

  function showDropdown(matchingEntries, usernameField, passwordField) {
    // Remove existing dropdown before creating a new one
    let existingDropdown = document.getElementById("credential-dropdown");
    if (existingDropdown) {
      existingDropdown.remove();
    }

    let dropdown = document.createElement('div');
    dropdown.id = "credential-dropdown"; // Set an ID to avoid duplicates
    dropdown.style.position = 'absolute';
    dropdown.style.background = "#fff";
    dropdown.style.border = "1px solid #ccc";
    dropdown.style.width = usernameField.offsetWidth + "px";
    dropdown.style.zIndex = "1000";

    matchingEntries.forEach(entry => {
      let credentials = document.createElement('div');
      credentials.textContent = entry.username;
      credentials.style.fontSize = '18px';
      credentials.style.padding = "12px";
      credentials.style.cursor = "pointer";

      credentials.addEventListener('click', () => {
        usernameField.value = entry.username;
        passwordField.value = entry.password;
        dropdown.remove();
      })
      dropdown.appendChild(credentials);
    });

    document.body.appendChild(dropdown);
    let rect = usernameField.getBoundingClientRect();
    dropdown.style.left = rect.left + "px";
    dropdown.style.top = rect.bottom + "px";

    document.addEventListener("click", handleClickOutside);

    function handleClickOutside(event) {
      if (!dropdown.contains(event.target) && event.target !== usernameField) {
        dropdown.remove();
        document.removeEventListener("click", handleClickOutside); // Remove event listener when dropdown is removed
      }
    }
  }

  function detectLoginForm() {
    let passwordField = document.querySelector("input[type='password']");
    if (passwordField) {
      console.log("Login form detected!");
      chrome.runtime.sendMessage({ type: "DETECT_LOGIN_FORM" });
    }
  }
  
  // Run detection when the page loads
  window.onload = detectLoginForm;
  
})();
