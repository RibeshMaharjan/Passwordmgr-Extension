(() => {
  // Initialize fields as null
  let usernameField = null;
  let passwordField = null;

  // Function to find and set input fields
  function findInputFields() {
    // Simplified selectors for Google login
    const emailSelectors = [
      'input[type="email"]',
      'input[name="identifier"]',
      'input[autocomplete="username"]',
      'input[aria-label*="email" i]',
      'input[aria-label*="phone" i]'
    ].join(',');

    // Try to find username/email field
    usernameField = document.querySelector(emailSelectors);
    
    // Password field will be found later if not present initially
    passwordField = document.querySelector('input[type="password"]');
    
    return usernameField !== null;
  }

  // Function to attach event listeners
  function attachEventListeners() {
    // Remove any existing event listeners
    if (usernameField) {
        usernameField.removeEventListener('focus', handleFocus);
        usernameField.addEventListener('focus', () => handleFocus('username'));
    }
    
    if (passwordField) {
        passwordField.removeEventListener('focus', handleFocus);
        passwordField.addEventListener('focus', () => handleFocus('password'));
    }

    // Add input event listener for dynamic form changes
    document.addEventListener('input', (e) => {
        if (e.target.type === 'password') {
            passwordField = e.target;
            // Add focus listener to dynamically found password field
            passwordField.removeEventListener('focus', handleFocus);
            passwordField.addEventListener('focus', () => handleFocus('password'));
            
            if (window.passwordManagerPassword) {
                passwordField.value = window.passwordManagerPassword;
                passwordField.dispatchEvent(new Event('input', { bubbles: true }));
                passwordField.dispatchEvent(new Event('change', { bubbles: true }));
                delete window.passwordManagerPassword;
            }
        }
    });
  }

  // Handler for focus event
  function handleFocus(fieldType) {
    chrome.runtime.sendMessage({ type: 'FETCH_CREDENTIALS' }, (response) => {
        if(!response || !response.passwords) return;

        let site = window.location.hostname;
        let parts = site.split(".");
        site = parts[parts.indexOf("com") - 1];

        let matchingEntries = response.passwords.filter(entry => {
            let parts = entry.site_url.split(".");
            let filterSite = parts[parts.indexOf("com") - 1];
            return filterSite === site;
        });

        if(matchingEntries && matchingEntries.length > 0) {
            // Position dropdown next to the clicked field
            const targetField = fieldType === 'password' ? passwordField : usernameField;
            showDropdown(matchingEntries, usernameField, passwordField, targetField);
        }
    });
  }

  // Add styles for the dropdown
  const style = document.createElement('style');
  style.textContent = `
    #credential-dropdown {
      position: absolute;
      background: #ffffff;
      border: 1px solid #e0e0e0;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      z-index: 2147483647;
      max-height: 300px;
      overflow-y: auto;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .credential-item {
      padding: 12px 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      border-bottom: 1px solid #f0f0f0;
    }
    .credential-item:last-child {
      border-bottom: none;
    }
    .credential-item:hover {
      background-color: #f8f9fa;
    }
    .credential-icon {
      width: 20px;
      height: 20px;
      background: #008080;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 12px;
    }
    .credential-info {
      flex-grow: 1;
    }
    .credential-username {
      font-size: 14px;
      color: #333;
      margin-bottom: 2px;
    }
    .credential-domain {
      font-size: 12px;
      color: #666;
    }
  `;
  document.head.appendChild(style);

  // Modified showDropdown function with improved UI
  function showDropdown(matchingEntries, usernameField, passwordField, targetField) {
    let existingDropdown = document.getElementById("credential-dropdown");
    if (existingDropdown) {
        existingDropdown.remove();
    }

    const dropdown = document.createElement('div');
    dropdown.id = "credential-dropdown";
    dropdown.style.width = Math.max(targetField.offsetWidth, 280) + "px";

    matchingEntries.forEach(entry => {
        const item = document.createElement('div');
        item.className = 'credential-item';
        
        const icon = document.createElement('div');
        icon.className = 'credential-icon';
        icon.textContent = entry.username.charAt(0).toUpperCase();

        const info = document.createElement('div');
        info.className = 'credential-info';
        
        const username = document.createElement('div');
        username.className = 'credential-username';
        username.textContent = entry.username;
        
        const domain = document.createElement('div');
        domain.className = 'credential-domain';
        domain.textContent = entry.site_url;

        info.appendChild(username);
        info.appendChild(domain);
        item.appendChild(icon);
        item.appendChild(info);

        item.addEventListener('click', () => {
            if (targetField === passwordField) {
                // If clicked on password field, just fill the password
                passwordField.value = entry.password;
                passwordField.dispatchEvent(new Event('input', { bubbles: true }));
                passwordField.dispatchEvent(new Event('change', { bubbles: true }));
            } else {
                // Fill both fields if clicked on username field
                usernameField.value = entry.username;
                usernameField.dispatchEvent(new Event('input', { bubbles: true }));
                usernameField.dispatchEvent(new Event('change', { bubbles: true }));

                if (passwordField) {
                    passwordField.value = entry.password;
                    passwordField.dispatchEvent(new Event('input', { bubbles: true }));
                    passwordField.dispatchEvent(new Event('change', { bubbles: true }));
                } else {
                    window.passwordManagerPassword = entry.password;
                }
            }
            dropdown.remove();
        });

        dropdown.appendChild(item);
    });

    // Position the dropdown relative to the viewport
    document.body.appendChild(dropdown);
    const rect = targetField.getBoundingClientRect();
    const dropdownRect = dropdown.getBoundingClientRect();
    
    // Check if dropdown would go off-screen
    const spaceBelow = window.innerHeight - rect.bottom;
    if (spaceBelow < dropdownRect.height && rect.top > dropdownRect.height) {
        // Position above if there's more space
        dropdown.style.top = (rect.top - dropdownRect.height) + "px";
    } else {
        // Position below
        dropdown.style.top = rect.bottom + "px";
    }
    
    dropdown.style.left = rect.left + "px";

    // Handle click outside
    function handleClickOutside(event) {
        if (!dropdown.contains(event.target) && event.target !== targetField) {
            dropdown.remove();
            document.removeEventListener('click', handleClickOutside);
        }
    }
    
    // Delay adding the click handler to prevent immediate closure
    setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
    }, 0);
  }

  // Simplified login form detection
  function detectLoginForm() {
    if (findInputFields()) {
        console.log("Login form detected!");
        attachEventListeners();
        chrome.runtime.sendMessage({ type: "DETECT_LOGIN_FORM" });
    }
  }

  // Run detection immediately and on DOM changes
  detectLoginForm();

  // MutationObserver to handle dynamic form loading
  const observer = new MutationObserver(() => {
    detectLoginForm();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['type', 'name', 'aria-label']
  });
})();
