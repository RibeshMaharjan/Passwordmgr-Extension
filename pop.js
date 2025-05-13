document.addEventListener("DOMContentLoaded", () => {
  // UI Elements
  const loginWrapper = document.getElementById("login-wrapper");
  const otpWrapper = document.getElementById("otp-wrapper");
  const otpForm = document.getElementById("otp-form");
  const userInfo = document.getElementById("user-info");
  const usernameSpan = document.getElementById("username");

  // Buttons
  const logoutBtn = document.getElementById("logout-btn");
  const loginBtn = document.getElementById("login-btn");
  const verifyBtn = document.getElementById("verify-btn");
  const resendCodeLink = document.getElementById("resend-code");

  // Input fields
  const emailInput = document.getElementById("uname");
  const passwordInput = document.getElementById("password");
  const otpInput = document.getElementById("otp_code");

  // Notification
  const notification = document.getElementById("notification");
  const notificationMessage = notification.querySelector(".notification-message");

  // Check if user is logged in on load
  checkLogin();

  // Login form handling with validation and loading state
  loginBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoadingState(true, "login");

    try {
      const response = await fetch("http://localhost/Password-Mgr/newUi/api/login.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          email: emailInput.value,
          password: passwordInput.value,
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        // Store username for both cases
        const username = result.email || emailInput.value;

        if (result.is2FAEnabled) {
          // If 2FA is enabled, store flag and username but not token yet
          chrome.storage.local.set({
            is2FAEnabled: true,
            username: username
          }, () => {
            showNotification("Please verify your identity with 2FA code", "info");
            // Clear the login form
            emailInput.value = "";
            passwordInput.value = "";
            // Update UI to show OTP verification
            checkLogin();
          });
        } else {
          // If 2FA is not enabled, store token and username
          chrome.storage.local.set({ 
            token: result.token,
            username: username
          }, () => {
            showNotification(result.message || "Login successful", "success");
            // Clear the login form
            emailInput.value = "";
            passwordInput.value = "";
            // Update UI to show logged-in state
            checkLogin();
          });
        }
      } else {
        showNotification(result.message || "Login failed", "error");
      }
    } catch (error) {
      console.error("Login error:", error);
      showNotification("Connection error", "error");
    } finally {
      setLoadingState(false, "login");
    }
  });

  // OTP verification handling
  verifyBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    if (otpInput.value.trim() === '') {
      showNotification("Please enter your OTP code", "error");
      otpInput.focus();
      return;
    }

    setLoadingState(true, "verify");

    try {
      // Get stored username
      const data = await chrome.storage.local.get(["username"]);
      const username = data.username;

      const response = await fetch("http://localhost/Password-Mgr/newUi/api/verifyOtp.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          otp: otpInput.value,
          email: username // Include username/email for verification
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        // Store token and remove 2FA flag
        chrome.storage.local.set({
          token: result.token,
          is2FAEnabled: false // Clear the 2FA flag as verification is complete
        }, () => {
          showNotification(result.message || "Verification successful", "success");
          // Clear the OTP input
          otpInput.value = "";
          // Update UI to show logged-in state
          checkLogin();
        });
      } else {
        showNotification(result.message || "Invalid OTP code", "error");
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      showNotification("Connection error", "error");
    } finally {
      setLoadingState(false, "verify");
    }
  });

  // Resend OTP code
  resendCodeLink.addEventListener("click", async (e) => {
    e.preventDefault();

    try {
      const data = await chrome.storage.local.get(["username"]);
      const username = data.username;

      if (!username) {
        showNotification("Session expired. Please login again.", "error");
        // Clear storage and show login form
        await chrome.storage.local.remove(["is2FAEnabled", "username"]);
        checkLogin();
        return;
      }

      showNotification("Requesting new OTP code...", "info");

      const response = await fetch("http://localhost/Password-Mgr/newUi/api/resendOtp.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          email: username
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        showNotification(result.message || "New OTP code sent", "success");
      } else {
        showNotification(result.message || "Failed to send new OTP code", "error");
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      showNotification("Connection error", "error");
    }
  });

  // Improved logout handling
  logoutBtn.addEventListener("click", async () => {
    setLoadingState(true, "logout");
    try {
      // Clear all authentication data
      await chrome.storage.local.remove(["token", "username", "passwords", "is2FAEnabled"]);
      showNotification("Logged out successfully", "success");
      // Update UI to show login form
      checkLogin();
    } catch (error) {
      console.error("Logout error:", error);
      showNotification("Error during logout", "error");
    } finally {
      setLoadingState(false, "logout");
    }
  });

  // Handle registration link click
  document.querySelector('a[href*="signup.php"]').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: "http://localhost/Password-Mgr/newUi/signup.php" });
  });

  // Validate form inputs
  function validateForm() {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

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
      const data = await chrome.storage.local.get(["token", "is2FAEnabled", "username"]);

      // Hide all UI sections first
      loginWrapper.style.display = "none";
      otpWrapper.style.display = "none";
      userInfo.style.display = "none";

      // Determine which section to show based on authentication state
      if (data.token) {
        // User is fully authenticated - show user info
        usernameSpan.textContent = data.username || "User";
        userInfo.style.display = "block";
      } else if (data.is2FAEnabled) {
        // User has logged in but needs to verify OTP
        otpWrapper.style.display = "block";
      } else {
        // User is not logged in - show login form
        loginWrapper.style.display = "block";
      }
    } catch (error) {
      console.error("Error checking login status:", error);
      showNotification("Error checking login status", "error");
      // On error, show login form as fallback
      loginWrapper.style.display = "block";
      otpWrapper.style.display = "none";
      userInfo.style.display = "none";
    }
  }

  // UI Helper Functions
  function setLoadingState(isLoading, buttonType = "login") {
    // Disable appropriate button based on type
    switch (buttonType) {
      case "login":
        loginBtn.disabled = isLoading;
        if (isLoading) {
          loginBtn.textContent = "Loading...";
          loginBtn.style.opacity = "0.7";
        } else {
          loginBtn.textContent = "Login";
          loginBtn.style.opacity = "1";
        }
        break;

      case "verify":
        verifyBtn.disabled = isLoading;
        if (isLoading) {
          verifyBtn.textContent = "Verifying...";
          verifyBtn.style.opacity = "0.7";
        } else {
          verifyBtn.textContent = "Verify Code";
          verifyBtn.style.opacity = "1";
        }
        break;

      case "logout":
        logoutBtn.disabled = isLoading;
        if (isLoading) {
          logoutBtn.textContent = "Logging out...";
          logoutBtn.style.opacity = "0.7";
        } else {
          logoutBtn.textContent = "Logout";
          logoutBtn.style.opacity = "1";
        }
        break;

      default:
        // Disable all buttons as fallback
        loginBtn.disabled = isLoading;
        verifyBtn.disabled = isLoading;
        logoutBtn.disabled = isLoading;
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
