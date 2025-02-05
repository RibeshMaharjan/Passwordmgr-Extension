document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-wrapper");
  const userInfo = document.getElementById("user-info");
  const usernameSpan = document.getElementById("username");
  const logoutBtn = document.getElementById("logout-btn");

  // Check if user is logged in
  checkLogin();

  document.getElementById("login-btn").addEventListener("click", async () => {
    const email = document.getElementById("uname").value;
    const password = document.getElementById("password").value;

    try {
      console.log("Send req")
      
      let response = await fetch("http://localhost:81/Password-Mgr/app/api/login.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      let result = await response.json();
      console.log("response received")
      console.log(result.token);
      
      if (result.success) {
        chrome.storage.local.set({ token: result.token }, () => {
          console.log("Login successfull");
          // window.close();
          checkLogin();
        });
      } else {
        console.log("Invalid Credentials");
      }
    } catch (error) {
      console.log(error);
    }
  });

  // Logout event
  logoutBtn.addEventListener("click", function () {
    chrome.storage.local.remove(["token", "username", "passwords"], function () {
      location.reload(); // Refresh to show login form
    });
  });

  function checkLogin() {
    chrome.storage.local.get("token", (data) => {
      if (data.token) {
  
        console.log(data.token);
        
        // User is logged in
        chrome.storage.local.get("username", (user) => {
          usernameSpan.textContent = user.username || "User";
        });
  
        console.log("display");
        
        loginForm.style.display = "none";
        userInfo.style.display = "block";
      } else {
        // User is not logged in
        loginForm.style.display = "block";
        userInfo.style.display = "none";
      }
    });
  }

});