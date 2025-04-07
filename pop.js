document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-wrapper");
  const userInfo = document.getElementById("user-info");
  const usernameSpan = document.getElementById("username");
  const logoutBtn = document.getElementById("logout-btn");
  const loginBtn = document.getElementById("login-btn");
  const emailInput = document.getElementById("uname");
  const passwordInput = document.getElementById("password");
  const notification = document.getElementById("notification");
  const notificationMessage = notification.querySelector(".notification-message");

  // Check if user is logged in on load
  checkLogin();

  // Improve form handling with validation and loading state
  loginBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoadingState(true);
    
    try {
      const response = await fetch("http://localhost/Password-Mgr/public/api/login.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: emailInput.value,
          password: passwordInput.value,
        }), 
      });

      const result = await response.json();
      
      if (result.success) {
        // Store both token and username
        chrome.storage.local.set({ 
          token: result.token,
          username: result.email || emailInput.value
        }, () => {
          showNotification("Login successful!", "success");
          checkLogin();
        });
      } else {
        showNotification("Invalid credentials", "error");
      }
    } catch (error) {
      console.error("Login error:", error);
      showNotification("Connection error", "error");
    } finally {
      setLoadingState(false);
    }
  });

  // Improved logout handling
  logoutBtn.addEventListener("click", async () => {
    setLoadingState(true);
    try {
      await chrome.storage.local.remove(["token", "username", "passwords"]);
      showNotification("Logged out successfully", "success");
      location.reload();
    } catch (error) {
      console.error("Logout error:", error);
      showNotification("Error during logout", "error");
      setLoadingState(false);
    }
  });

  // Handle registration link click
  document.querySelector('a[href*="signup.php"]').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: "http://localhost/Password-Mgr/public/signup.php" });
  });

  // Validate form inputs
  function validateForm() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (!email) {
      showNotification("Please enter your email", "error");
      emailInput.focus();
      return false;
    }
    
    if (!password) {
      showNotification("Please enter your password", "error");
      passwordInput.focus();
      return false;
    }
    
    return true;
  }

  // Check login status and update UI
  async function checkLogin() {
    try {
      const data = await chrome.storage.local.get(["token", "username"]);
      
      if (data.token) {
        // Show user info with actual username
        usernameSpan.textContent = data.username || "User";
        loginForm.style.display = "none";
        userInfo.style.display = "block";
      } else {
        loginForm.style.display = "block";
        userInfo.style.display = "none";
      }
    } catch (error) {
      console.error("Error checking login status:", error);
      showNotification("Error checking login status", "error");
    }
  }

  // UI Helper Functions
  function setLoadingState(isLoading) {
    loginBtn.disabled = isLoading;
    logoutBtn.disabled = isLoading;
    
    if (isLoading) {
      loginBtn.textContent = "Loading...";
      loginBtn.style.opacity = "0.7";
    } else {
      loginBtn.textContent = "Login";
      loginBtn.style.opacity = "1";
    }
  }

  function showNotification(message, type = "info") {
    // Clear any existing timeout
    if (window.notificationTimeout) {
      clearTimeout(window.notificationTimeout);
    }

    // Update notification content and style
    notificationMessage.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = "block";
    
    // Add show class after a brief delay to trigger transition
    requestAnimationFrame(() => {
      notification.classList.add("show");
    });

    // Hide notification after 3 seconds
    window.notificationTimeout = setTimeout(() => {
      notification.classList.remove("show");
      setTimeout(() => {
        notification.style.display = "none";
      }, 300); // Match transition duration
    }, 3000);
  }

  // Add input event listeners for real-time validation
  emailInput.addEventListener("input", () => {
    emailInput.style.borderColor = emailInput.value.trim() ? "" : "#ff4444";
  });

  passwordInput.addEventListener("input", () => {
    passwordInput.style.borderColor = passwordInput.value ? "" : "#ff4444";
  });
});