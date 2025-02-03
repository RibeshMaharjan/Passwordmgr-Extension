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
        alert("Login successfull");
        window.close();
      });
    } else {
      alert("Invalid Credentials");
    }
  } catch (error) {
    console.log(error);
  }
});
